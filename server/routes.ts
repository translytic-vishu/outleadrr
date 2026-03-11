import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import OpenAI from "openai";
import bcrypt from "bcrypt";
import { generateLeadsSchema, signupSchema, loginSchema } from "@shared/schema";
import { getAuthUrl, getLoginAuthUrl, getOAuthClient, getUserInfo, sendEmailViaGmail } from "./gmail";
import { searchPlaces, getPlaceDetails, scorePlace, PlaceDetails } from "./places";
import { storage } from "./storage";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
      store: new MemStore({ checkPeriod: 86400000 }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  /* ─── User auth ─────────────────────────────────────────────────── */

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
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
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
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
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    return res.json({ id: user.id, email: user.email });
  });

  /* ─── Google OAuth ─────────────────────────────────────────────── */

  app.get("/api/auth/google", (_req: Request, res: Response) => {
    res.redirect(getAuthUrl());
  });

  app.get("/api/auth/google-login", (_req: Request, res: Response) => {
    res.redirect(getLoginAuthUrl());
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

      const { businessType, location } = parsed.data;

      /* ── 1. Fetch real businesses from Google Places ─────────────── */
      let placeDetails: PlaceDetails[] = [];
      let usedPlaces = false;

      if (process.env.GOOGLE_PLACES_API_KEY) {
        try {
          const searchResults = await searchPlaces(`${businessType} in ${location}`);
          placeDetails = await Promise.all(searchResults.map(p => getPlaceDetails(p.placeId)));
          usedPlaces = placeDetails.length > 0;
        } catch (placesErr: any) {
          console.warn("Places API error, falling back to AI-only:", placesErr.message);
        }
      }

      /* ── 2. Build OpenAI prompt ──────────────────────────────────── */
      let userPrompt: string;

      if (usedPlaces) {
        const businessList = placeDetails.map((p, i) => {
          const domainMatch = p.website?.match(/(?:https?:\/\/)?(?:www\.)?([^\/?\s]+)/);
          const domain = domainMatch?.[1] || "";
          return [
            `${i + 1}. Name: "${p.name}"`,
            `   Address: ${p.address || "N/A"}`,
            `   Phone: ${p.phone || "N/A"}`,
            `   Website: ${p.website || "N/A"}`,
            `   Domain: ${domain || "N/A"}`,
            `   Rating: ${p.rating || "N/A"} (${p.reviewCount} reviews)`,
          ].join("\n");
        }).join("\n\n");

        userPrompt = `For each of these real ${businessType} businesses in ${location}, generate outreach data.

REAL BUSINESSES:
${businessList}

For each business return:
- "contactName": a realistic owner or decision-maker full name
- "title": a realistic job title (Owner, CEO, Founder, Operations Manager, etc.)
- "email": a professional email. If a domain is available, use it (e.g. firstname@domain.com). Otherwise invent a plausible one from the business name.
- "emailSubject": a compelling, specific cold email subject line
- "emailBody": 150-200 word personalized cold email referencing the company name, location, and business type. Professional but warm. Clear value proposition and call to action.

Return JSON exactly:
{
  "leads": [
    { "id": 1, "companyName": "...", "contactName": "...", "title": "...", "email": "...", "emailSubject": "...", "emailBody": "..." }
  ]
}
Return ONLY valid JSON.`;
      } else {
        userPrompt = `Generate exactly 10 realistic sales leads for ${businessType} businesses in ${location}.
Return JSON:
{
  "leads": [
    { "id": 1, "companyName": "...", "contactName": "...", "title": "...", "email": "...", "phone": "(555) 000-0000", "website": "www.example.com", "industry": "${businessType}", "emailSubject": "...", "emailBody": "..." }
  ]
}
Requirements:
- Realistic company names with local flair from ${location}
- Professional email formats (firstname@domain.com)
- Websites match company names
- Each cold email unique, personalized, 150-200 words
- Include realistic job titles (Owner, CEO, Operations Manager, etc.)
- Return ONLY valid JSON`;
      }

      const systemPrompt = usedPlaces
        ? "You are a B2B sales intelligence assistant. Generate personalized cold outreach data based on real business information provided."
        : "You are an expert B2B sales intelligence system. Generate realistic sales leads with highly personalized cold emails.";

      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return res.status(500).json({ error: "No response from AI" });

      const aiData = JSON.parse(content);

      /* ── 3. Merge Places data + calculate scores ─────────────────── */
      const leads = (aiData.leads as any[]).map((lead: any, idx: number) => {
        const place = placeDetails[idx];
        const scoring = place
          ? scorePlace(place, businessType)
          : {
              score: 62,
              scoreLabel: "Good Lead",
              scoreBreakdown: {
                industryFit: 70,
                businessSize: 50,
                reachability: lead.phone && lead.website ? 100 : lead.phone || lead.website ? 60 : 20,
                opportunity: 75,
                reviewHealth: 50,
              },
            };

        return {
          ...lead,
          id: idx + 1,
          companyName: place?.name || lead.companyName,
          phone: place?.phone || lead.phone || "",
          website: place?.website || lead.website || "",
          address: place?.address || "",
          rating: place?.rating ?? undefined,
          reviewCount: place?.reviewCount ?? undefined,
          industry: businessType,
          status: "new",
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

  return httpServer;
}
