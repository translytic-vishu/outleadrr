import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { generateLeadsSchema, signupSchema, loginSchema } from "../shared/schema.js";
import { getAuthUrl, getLoginAuthUrl, getOAuthClient, getUserInfo, sendEmailViaGmail } from "./gmail.js";
import { searchPlaces, getPlaceDetails, scorePlace, PlaceDetails } from "./places.js";
import { storage } from "./storage.js";
import { z } from "zod";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "placeholder",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    gmailAccessToken?: string;
    gmailRefreshToken?: string;
    gmailEmail?: string;
    gmailName?: string;
  }
}

const MemStore = MemoryStore(session);
const PgSession = connectPgSimple(session);

function buildSessionStore() {
  if (process.env.DATABASE_URL) {
    return new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: true,
    });
  }
  return new MemStore({ checkPeriod: 86400000 });
}

/* ─── auth middleware ─────────────────────────────────────────────── */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "ai-sales-agent-secret-key",
      resave: false,
      saveUninitialized: false,
      store: buildSessionStore(),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  /* ─── User auth ─────────────────────────────────────────────────── */

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { email, password } = parsed.data;
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser(email, passwordHash);
      req.session.userId = user.id;
      return res.status(201).json({ id: user.id, email: user.email });
    } catch (e: any) {
      console.error("Signup error:", e);
      return res.status(500).json({ error: e.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid email or password" });
      }
      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      req.session.userId = user.id;
      return res.json({ id: user.id, email: user.email });
    } catch (e: any) {
      console.error("Login error:", e);
      return res.status(500).json({ error: e.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      return res.json({ id: user.id, email: user.email });
    } catch (e: any) {
      console.error("Auth/me error:", e);
      return res.status(500).json({ error: e.message || "Auth check failed" });
    }
  });

  /* ─── Google OAuth ─────────────────────────────────────────────── */

  app.get("/api/auth/google", (_req: Request, res: Response) => {
    try { res.redirect(getAuthUrl()); }
    catch (e) { console.error("getAuthUrl error:", e); res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/auth/google-login", (_req: Request, res: Response) => {
    try { res.redirect(getLoginAuthUrl()); }
    catch (e) { console.error("getLoginAuthUrl error:", e); res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code, state } = req.query;
    if (!code || typeof code !== "string") {
      const dest = state === "login" ? "/login" : "/app";
      return res.redirect(`${dest}?error=oauth_failed`);
    }
    try {
      const oauth2Client = getOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);
      const accessToken = tokens.access_token!;
      const refreshToken = tokens.refresh_token || "";
      const userInfo = await getUserInfo(accessToken, refreshToken);

      if (state === "login") {
        /* ── Google sign-in / sign-up ─────────────────────────── */
        if (!userInfo.id || !userInfo.email) {
          return res.redirect("/login?error=oauth_failed");
        }
        let user = await storage.getUserByGoogleId(userInfo.id);
        if (!user) {
          user = await storage.createGoogleUser(userInfo.email, userInfo.id);
        }
        req.session.userId = user.id;
        return res.redirect("/app");
      } else {
        /* ── Gmail connect ────────────────────────────────────── */
        req.session.gmailAccessToken = accessToken;
        req.session.gmailRefreshToken = refreshToken;
        req.session.gmailEmail = userInfo.email || "";
        req.session.gmailName = userInfo.name || "";
        return res.redirect("/app?connected=true");
      }
    } catch (err) {
      console.error("OAuth callback error:", err);
      const dest = state === "login" ? "/login" : "/app";
      return res.redirect(`${dest}?error=oauth_failed`);
    }
  });

  app.get("/api/auth/status", (req: Request, res: Response) => {
    if (req.session.gmailAccessToken) {
      res.json({ connected: true, email: req.session.gmailEmail, name: req.session.gmailName });
    } else {
      res.json({ connected: false });
    }
  });

  app.post("/api/auth/disconnect", (req: Request, res: Response) => {
    req.session.gmailAccessToken = undefined;
    req.session.gmailRefreshToken = undefined;
    req.session.gmailEmail = undefined;
    req.session.gmailName = undefined;
    res.json({ success: true });
  });

  /* ─── Generate Leads (protected) ──────────────────────────────── */

  app.post("/api/generate-leads", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = generateLeadsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      }

      const { businessType, location, intent, leadCount = 10, tone = "professional" } = parsed.data;

      /* ── 1. Require Google Places API key ────────────────────────── */
      if (!process.env.GOOGLE_PLACES_API_KEY) {
        return res.status(503).json({
          error: "Google Places API key not configured",
          message: "Add GOOGLE_PLACES_API_KEY to your environment secrets to enable lead generation.",
        });
      }

      /* ── 2. Search Google Places for real businesses ─────────────── */
      const allResults = await searchPlaces(`${businessType} in ${location}`);
      const searchResults = allResults.slice(0, leadCount);

      if (searchResults.length === 0) {
        return res.status(404).json({
          error: "No businesses found",
          message: `No ${businessType} businesses found in ${location}. Try a broader search.`,
        });
      }

      /* ── 3. Fetch place details in parallel ──────────────────────── */
      const placeDetails = await Promise.all(
        searchResults.map(p => getPlaceDetails(p.placeId))
      );

      /* ── 4. Build context list for OpenAI (contact + email only) ─── */
      const businessList = placeDetails.map((p, i) => {
        const domainMatch = p.website?.match(/(?:https?:\/\/)?(?:www\.)?([^\/?\s]+)/);
        const domain = domainMatch?.[1] || "";
        return [
          `${i + 1}. Business: "${p.name}"`,
          `   Location: ${p.address || location}`,
          `   Phone: ${p.phone || "not listed"}`,
          `   Website domain: ${domain || "none"}`,
          `   Rating: ${p.rating > 0 ? `${p.rating}/5 (${p.reviewCount} reviews)` : "not rated yet"}`,
        ].join("\n");
      }).join("\n\n");

      /* ── 5. Use OpenAI only for contact person + cold email ──────── */
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: "You are a B2B sales assistant. For each real business provided, generate a plausible decision-maker contact and a personalised cold email. Do not invent business names, addresses, or phone numbers — those are already provided.",
          },
          {
            role: "user",
            content: `Here are ${placeDetails.length} real ${businessType} businesses in ${location}. For each, generate:
- "contactName": a realistic owner/decision-maker full name
- "title": a realistic job title (Owner, CEO, Founder, General Manager, etc.)
- "email": if a website domain is available use firstname@domain (e.g. sarah@torresplumbing.com); otherwise construct a plausible one from the business name
- "emailSubject": a compelling, specific cold email subject line (do NOT use generic phrases like "Quick question")
- "emailBody": 150-200 word personalized cold email. Reference the actual business name and city. Include a clear value proposition and specific call to action.${intent ? ` The sender is pitching: "${intent}" — make every email relevant to this offering.` : ""}
Tone: ${tone === "professional" ? "formal and business-focused" : tone === "friendly" ? "warm, conversational and approachable" : tone === "direct" ? "concise and straight to the point, no fluff" : "light, witty and memorable — make them smile"}.

BUSINESSES:
${businessList}

Return JSON:
{
  "contacts": [
    { "contactName": "...", "title": "...", "email": "...", "emailSubject": "...", "emailBody": "..." }
  ]
}
Return ONLY valid JSON. The "contacts" array must have exactly ${placeDetails.length} items in the same order as the businesses listed.`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const aiContent = completion.choices[0]?.message?.content;
      if (!aiContent) return res.status(500).json({ error: "No response from AI" });

      const aiData = JSON.parse(aiContent);
      const contacts: any[] = aiData.contacts || [];

      /* ── 6. Merge real Places data with AI contact/email data ─────── */
      const leads = placeDetails.map((place, idx) => {
        const contact = contacts[idx] || {};
        const scoring = scorePlace(place, businessType);

        return {
          id: idx + 1,
          /* ── real data from Google Places ── */
          companyName: place.name,
          address:     place.address,
          phone:       place.phone,
          website:     place.website,
          rating:      place.rating > 0 ? place.rating : undefined,
          reviewCount: place.reviewCount > 0 ? place.reviewCount : undefined,
          /* ── AI-generated contact + outreach ── */
          contactName:  contact.contactName  || "",
          title:        contact.title        || "",
          email:        contact.email        || "",
          emailSubject: contact.emailSubject || "",
          emailBody:    contact.emailBody    || "",
          /* ── metadata ── */
          industry: businessType,
          status:   "new" as const,
          ...scoring,
        };
      });

      return res.json({ leads, businessType, location });
    } catch (error: any) {
      console.error("Error generating leads:", error);
      return res.status(500).json({ error: "Failed to generate leads", message: error.message });
    }
  });

  /* ─── Send All Emails via Gmail (protected) ─────────────────────── */

  const sendEmailsSchema = z.object({
    leads: z.array(
      z.object({
        email: z.string(),
        emailSubject: z.string(),
        emailBody: z.string(),
        companyName: z.string(),
        contactName: z.string(),
      })
    ),
  });

  app.post("/api/send-emails", requireAuth, async (req: Request, res: Response) => {
    if (!req.session.gmailAccessToken) {
      return res.status(401).json({ error: "Not authenticated with Gmail" });
    }

    const parsed = sendEmailsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { leads } = parsed.data;
    const from = req.session.gmailEmail!;
    const accessToken = req.session.gmailAccessToken!;
    const refreshToken = req.session.gmailRefreshToken || "";

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const lead of leads) {
      try {
        await sendEmailViaGmail(accessToken, refreshToken, from, lead.email, lead.emailSubject, lead.emailBody);
        results.push({ email: lead.email, success: true });
        await new Promise((r) => setTimeout(r, 300));
      } catch (err: any) {
        console.error(`Failed to send to ${lead.email}:`, err.message);
        results.push({ email: lead.email, success: false, error: err.message });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return res.json({ results, sent, failed, total: leads.length });
  });

  /* ─── Global error handler (prevents unhandled rejections from crashing lambda) */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Express global error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  return httpServer;
}
