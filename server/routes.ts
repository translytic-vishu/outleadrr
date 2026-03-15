import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { generateLeadsSchema, signupSchema, loginSchema } from "../shared/schema.js";
import { getAuthUrl, getLoginAuthUrl, getOAuthClient, getUserInfo, sendEmailViaGmail, fetchInboxMessages } from "./gmail.js";
import { searchPlaces, getPlaceDetails, scorePlace, PlaceDetails } from "./places.js";
import { storage } from "./storage.js";
import { z } from "zod";

function getOpenAI() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";
  const isOpenRouter = baseURL.includes("openrouter.ai");
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "placeholder",
    baseURL,
    defaultHeaders: isOpenRouter ? {
      "HTTP-Referer": process.env.APP_URL || "https://outleadrr.vercel.app",
      "X-Title": "Outleadrr",
    } : undefined,
  });
}

function getModel() {
  // Allow override via OPENAI_MODEL env var
  // For OpenRouter stepfun: set OPENAI_MODEL=step-1-8k (or your preferred stepfun model)
  return process.env.OPENAI_MODEL || "gpt-4o";
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
  // In production (Vercel) sessions MUST be stored in Postgres.
  // MemoryStore resets between serverless invocations, causing 401 on every request after login.
  if (process.env.DATABASE_URL) {
    return new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // auto-creates "session" table
      tableName: "session",
    });
  }
  // Local dev fallback (no DB)
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
        // Explicitly save session before redirect — critical in serverless
        // (Lambda terminates after res is sent, async auto-save never completes)
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => (err ? reject(err) : resolve()));
        });
        return res.redirect("/app");
      } else {
        /* ── Gmail connect ────────────────────────────────────── */
        req.session.gmailAccessToken = accessToken;
        req.session.gmailRefreshToken = refreshToken;
        req.session.gmailEmail = userInfo.email || "";
        req.session.gmailName = userInfo.name || "";
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => (err ? reject(err) : resolve()));
        });
        return res.redirect("/app?connected=true");
      }
    } catch (err: any) {
      console.error("OAuth callback error:", err);
      const dest = state === "login" ? "/login" : "/app";
      // Include error detail in URL so it's visible for debugging
      const detail = encodeURIComponent((err?.message || String(err)).slice(0, 200));
      return res.redirect(`${dest}?error=${detail}`);
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

      /* ── 1. Require SerpAPI key ──────────────────────────────────── */
      if (!process.env.SERPAPI_KEY) {
        return res.status(503).json({
          error: "SERPAPI_KEY not configured",
          message: "Add SERPAPI_KEY to your Vercel environment variables to enable lead generation. Get a free key at serpapi.com.",
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

      /* ── 5. Generate contact + cold email via AI ────────────────── */
      const toneGuide: Record<string, string> = {
        professional:  "Formal and polished. No contractions. Business-focused language. Credibility through specificity.",
        friendly:      "Warm and conversational. Use contractions. Feel like a peer reaching out, not a salesperson.",
        direct:        "Short sentences. No filler. One clear ask. Respect the reader's time above all else.",
        humorous:      "Light wit and a single clever observation. Never try-hard. One joke max, then straight to value.",
        persuasive:    "Highlight a pain they might not know they have. Create mild urgency. End with a compelling reason to reply.",
        casual:        "Write like a smart friend texting. Informal but credible. Short paragraphs.",
        consultative:  "Lead with insight before offer. Position as an advisor, not a vendor. Ask a thoughtful question.",
        bold:          "Open with a strong, slightly provocative statement. Confident claims backed by specifics.",
      };

      const completion = await getOpenAI().chat.completions.create({
        model: getModel(),
        messages: [
          {
            role: "system",
            content: `You are the world's best B2B cold email writer. You spent 10 years as a top SDR before charging $800/email. Your emails get 20–35% reply rates because they feel researched, not blasted.

YOUR RULE: Make the reader feel like you wrote this specifically for them in 2 minutes of real thought — then got out of the way.

━━━ BANNED OPENERS (instant delete) ━━━
"I hope this", "I wanted to reach out", "My name is", "I came across your business",
"Are you looking to", "Are you struggling", "I noticed your", "Just following up",
"We help companies like yours", "I'd love to connect", "I'm reaching out because"

━━━ BANNED WORDS (AI tells) ━━━
synergy, leverage, unlock, revolutionize, game-changer, cutting-edge, seamlessly,
transform, streamline, elevate, empower, harness, nurture, scalable, robust,
innovative solution, pain points, deep dive, circle back, move the needle,
take your business to the next level, best-in-class, world-class, ROI-driven

━━━ SUBJECT LINE RULES ━━━
4–7 words. No punctuation at end. Not a question.
Never: "Quick question", "Following up", "Introduction", "Partnership", "Opportunity for X"
Good examples: "For dental practices in Austin", "Worth 15 minutes this week", "Something for [Business Name]"

━━━ BODY FORMAT ━━━
Exactly 3 short paragraphs. 100–130 words total. No bullets. No bold. No exclamation marks.
P1 (1–2 sentences): Hook — specific to THIS business, city, rating, or industry reality
P2 (2–3 sentences): Offer — what you do, who it helped, one real outcome with a number
P3 (1 sentence): CTA — one of: "Worth a 10-minute call this week?", "Can I send you [specific thing]?", "Reply yes and I'll send details.", "Open to a 2-line reply if relevant?"
NEVER end with: "Let me know if interested", "Feel free to reach out", "Looking forward to hearing from you"

━━━ OPENER ROTATION — use a different one for each business ━━━
A) INDUSTRY INSIGHT: A true, sharp observation about their market or city that shows you know the space
B) DATA SIGNAL: Reference their actual Google rating or review count as the hook — what it signals
C) SOCIAL PROOF: "We just helped a [city] [type] similar to [name] [result] in [timeframe]"
D) STRAIGHT VALUE: Skip the hook entirely — open directly with the most compelling thing you offer
E) REFRAME: Say something unexpected-but-true that changes how they see their situation

━━━ PERSONALIZATION RULE ━━━
Every email must reference at least one: the city, the business name (once, naturally), their actual rating/reviews, or an implication of their specific business type.

━━━ TONE IS LAW ━━━
The tone defines everything — word choice, sentence length, formality, CTA style. Honor it completely.

Return ONLY a raw JSON object. Zero markdown. Zero code fences. Nothing before or after the JSON.`,
          },
          {
            role: "user",
            content: `Write cold outreach emails for ${placeDetails.length} ${businessType} businesses in ${location}.
${intent ? `The sender offers: "${intent}"` : ""}
Tone for all emails: ${toneGuide[tone as string] || toneGuide.professional}

IMPORTANT on email addresses: If a website domain is provided, always use that real domain. Format: firstname@domain.com (all lowercase). If no domain, construct from company name slug.

For each business return:
- contactName: a realistic owner/decision-maker first and last name matching the area and business culture
- title: one of — Owner, Founder, CEO, General Manager, Practice Manager, Operations Director, Principal
- email: use real domain if available (e.g. if domain is "smithplumbing.com" use "john@smithplumbing.com"), else firstname@sluggedcompanyname.com
- emailSubject: 4–7 word subject line, no punctuation at end, specific to this business or industry
- emailBody: 110–140 word cold email following the 3-paragraph structure. Vary the opener style across businesses. Sound like a person, not a tool.

BUSINESSES:
${businessList}

Return exactly ${placeDetails.length} contacts in this JSON format (same order as businesses above):
{"contacts":[{"contactName":"","title":"","email":"","emailSubject":"","emailBody":""}]}`,
          },
        ],
        max_tokens: 8192,
      });

      const rawContent = completion.choices[0]?.message?.content;
      if (!rawContent) return res.status(500).json({ error: "No response from AI" });

      // Strip markdown code fences that some models wrap JSON in
      const aiContent = rawContent
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      let aiData: any;
      try {
        aiData = JSON.parse(aiContent);
      } catch {
        // Try to extract JSON object from response if model added extra text
        const match = aiContent.match(/\{[\s\S]*\}/);
        if (!match) return res.status(500).json({ error: "AI returned invalid JSON" });
        aiData = JSON.parse(match[0]);
      }
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
    campaignName: z.string().optional(),
    businessType: z.string().optional(),
    location: z.string().optional(),
  });

  app.post("/api/send-emails", requireAuth, async (req: Request, res: Response) => {
    if (!req.session.gmailAccessToken) {
      return res.status(401).json({ error: "Not authenticated with Gmail" });
    }

    const parsed = sendEmailsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { leads, campaignName, businessType, location } = parsed.data;
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

    // Persist campaign record
    try {
      await storage.createCampaign({
        userId: req.session.userId!,
        name: campaignName || `${businessType || "Campaign"} — ${location || ""}`.trim(),
        businessType: businessType || "",
        location: location || "",
        totalLeads: leads.length,
        sent,
        failed,
      });
    } catch (e) {
      console.error("Failed to save campaign:", e);
    }

    return res.json({ results, sent, failed, total: leads.length });
  });

  /* ─── Campaigns (protected) ────────────────────────────────────── */

  app.get("/api/campaigns", requireAuth, async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getCampaigns(req.session.userId!);
      return res.json({ campaigns });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /* ─── Gmail Inbox (protected) ──────────────────────────────────── */

  app.get("/api/inbox", requireAuth, async (req: Request, res: Response) => {
    if (!req.session.gmailAccessToken) {
      return res.json({ messages: [], connected: false });
    }
    try {
      const messages = await fetchInboxMessages(
        req.session.gmailAccessToken,
        req.session.gmailRefreshToken || "",
        25
      );
      return res.json({ messages, connected: true });
    } catch (e: any) {
      console.error("Inbox fetch error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  /* ─── Send reply from Inbox ─────────────────────────────────────── */

  const replySchema = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
  });

  app.post("/api/inbox/reply", requireAuth, async (req: Request, res: Response) => {
    if (!req.session.gmailAccessToken) {
      return res.status(401).json({ error: "Gmail not connected" });
    }
    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const { to, subject, body } = parsed.data;
    const from = req.session.gmailEmail!;
    try {
      await sendEmailViaGmail(
        req.session.gmailAccessToken,
        req.session.gmailRefreshToken || "",
        from, to,
        subject.startsWith("Re:") ? subject : `Re: ${subject}`,
        body
      );
      return res.json({ success: true });
    } catch (e: any) {
      console.error("Reply send error:", e);
      return res.status(500).json({ error: e.message });
    }
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
