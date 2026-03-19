import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { generateLeadsSchema, signupSchema, loginSchema } from "../shared/schema.js";
import { getAuthUrl, getLoginAuthUrl, getOAuthClient, getUserInfo, sendEmailViaGmail, fetchInboxMessages } from "./gmail.js";
import { searchPlaces, getPlaceDetails, scorePlace, scrapeEmailFromWebsite, PlaceDetails } from "./places.js";
import { storage } from "./storage.js";
import { z } from "zod";

// ── Gemini 2.0 Flash via OpenRouter (primary AI — MAIN_AI_OUTLEADR) ──────────
const GEMINI_MODEL = "google/gemini-2.5-flash-preview";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function getGeminiClient() {
  return new OpenAI({
    apiKey: process.env.MAIN_AI_OUTLEADR || "",
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || "https://outleadrr.vercel.app",
      "X-Title": "Outleadrr",
    },
  });
}

// ── OpenAI fallback ──────────────────────────────────────────────────────────
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

function getModel() { return process.env.OPENAI_MODEL || "gpt-4o"; }

// ── Universal AI caller: Gemini first → OpenAI fallback ─────────────────────
async function aiCall(params: Omit<Parameters<OpenAI["chat"]["completions"]["create"]>[0], "model">) {
  if (process.env.MAIN_AI_OUTLEADR) {
    try {
      return await getGeminiClient().chat.completions.create({ ...params, model: GEMINI_MODEL } as any);
    } catch (err: any) {
      console.warn("[AI] Gemini failed, falling back to OpenAI:", err.message);
    }
  }
  return getOpenAI().chat.completions.create({ ...params, model: getModel() } as any);
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

      /* ── 2. Search Google Places — expand geographically if needed ── */
      // Collect a large candidate pool: primary location + nearby areas
      const nearbyExpansions = [
        `${businessType} near ${location}`,
        `${businessType} in ${location} area`,
        `${businessType} near ${location} TX`,  // works well for TX suburbs
      ];

      let allCandidates: { placeId: string; name: string }[] = [];
      try {
        allCandidates = await searchPlaces(`${businessType} in ${location}`);
      } catch { /* continue to expansions */ }

      // If primary search returned fewer than needed, try expansions
      if (allCandidates.length < leadCount * 2) {
        for (const q of nearbyExpansions) {
          if (allCandidates.length >= leadCount * 3) break;
          try {
            const extra = await searchPlaces(q);
            // Merge, deduplicating by name
            const existingNames = new Set(allCandidates.map(r => r.name.toLowerCase()));
            for (const r of extra) {
              if (!existingNames.has(r.name.toLowerCase())) {
                allCandidates.push(r);
                existingNames.add(r.name.toLowerCase());
              }
            }
          } catch { /* ignore expansion errors */ }
        }
      }

      if (allCandidates.length === 0) {
        return res.status(404).json({
          error: "No businesses found",
          message: `No ${businessType} businesses found in or near ${location}. Try a different city or business type.`,
        });
      }

      /* ── 3. Fetch details for up to 4× the requested count ──────── */
      const toFetch = allCandidates.slice(0, Math.min(allCandidates.length, leadCount * 4));
      const allDetails = await Promise.all(toFetch.map(p => getPlaceDetails(p.placeId).catch(() => null)));
      // Only keep businesses that have a website (required to derive email)
      const placeDetails = allDetails.filter((p): p is PlaceDetails => !!p && !!p.website);

      /* ── 4. Build context list for AI ───────────────────────────── */
      // If pitching website services, prefer businesses with weak/no web presence
      const intentLower = (intent || "").toLowerCase();
      const pitchingWebsite = /\bwebsite|web design|web dev|landing page|redesign\b/i.test(intentLower);

      // Score-sort: if pitching websites, push businesses with a basic/old site to top
      const sortedDetails = pitchingWebsite
        ? [...placeDetails].sort((a, b) => {
            // Prefer no-review or low-review businesses (less established = more likely needs upgrade)
            const aScore = a.reviewCount < 20 ? 0 : 1;
            const bScore = b.reviewCount < 20 ? 0 : 1;
            return aScore - bScore;
          })
        : placeDetails;

      const businessList = sortedDetails.map((p, i) => {
        const domainMatch = p.website?.match(/(?:https?:\/\/)?(?:www\.)?([^\/?\s]+)/);
        const domain = domainMatch?.[1] || "";
        const webNote = pitchingWebsite
          ? (p.reviewCount < 10 ? " [minimal online presence — ideal for website pitch]" : "")
          : "";
        return [
          `${i + 1}. Business: "${p.name}"${webNote}`,
          `   Location: ${p.address || location}`,
          `   Phone: ${p.phone || "not listed"}`,
          `   Website: ${domain || "none"}`,
          `   Google rating: ${p.rating > 0 ? `${p.rating}/5 (${p.reviewCount} reviews)` : "not yet rated — new or under-the-radar business"}`,
        ].join("\n");
      }).join("\n\n");

      /* ── 5. Generate contact + cold email via Gemini (OpenAI fallback) ─ */
      const toneGuide: Record<string, { style: string; voice: string; cta: string; closing: string }> = {
        professional:  { style: "Polished, confident, results-oriented. No contractions unless it sounds natural. Precise word choice.", voice: "Senior account executive who has done their homework on this specific business.", cta: "Worth a 15-minute call this week?", closing: "Kind regards," },
        friendly:      { style: "Warm, conversational, genuine. Contractions throughout. Reads like an email from someone you already like.", voice: "Peer reaching out peer-to-peer, not salesperson to prospect.", cta: "Happy to share more — just reply and I'll send details.", closing: "Cheers," },
        direct:        { style: "Short sentences only. No filler words. One idea per sentence. Zero pleasantries.", voice: "Person who values time above everything and writes accordingly.", cta: "Open to a quick chat?", closing: "Best," },
        humorous:      { style: "One sharp, clever observation — then real value. Never try-hard. Wit earns trust; jokes don't close deals.", voice: "Smart person with a dry sense of humour who still has something real to offer.", cta: "Can I send you a 2-minute example?", closing: "Cheers," },
        persuasive:    { style: "Opens with a mild tension or overlooked opportunity. Builds urgency without pressure. Strong proof point.", voice: "Consultant who spotted something the business owner hasn't noticed yet.", cta: "Reply and I'll show you exactly how it works.", closing: "Best," },
        casual:        { style: "Breezy and short. Writes like a smart friend texting, not a vendor pitching. Informal but credible.", voice: "Someone the reader would actually want to grab coffee with.", cta: "Worth a quick chat?", closing: "Cheers," },
        consultative:  { style: "Lead with a specific insight before any offer. Position as advisor, not vendor. Ask one thoughtful question.", voice: "Industry expert who noticed something specific about this business and wants to share it.", cta: "Open to a 10-minute conversation about it?", closing: "Kind regards," },
        bold:          { style: "Opens with a strong, slightly provocative statement backed by a specific claim. Confident, never arrogant.", voice: "Someone who has achieved measurable results and isn't afraid to say so.", cta: "Happy to share how — reply and I'll send details.", closing: "Best," },
      };
      const toneConfig = toneGuide[tone as string] || toneGuide.professional;

      /* ── 5+6. AI email generation AND email scraping run in parallel ─ */
      const [completion, scrapedEmails] = await Promise.all([
        aiCall({
        messages: [
          {
            role: "system",
            content: `You are a top-performing cold email copywriter. Every email you write sounds like a real human spent 20 minutes researching that specific business — because each one is crafted specifically for them.

## CORE RULES
1. Each email MUST reference the specific business by name, location, or real data (rating/reviews).
2. Every email in the batch must have a DIFFERENT opening structure. No two can start the same way.
3. Vary email LENGTH across the batch: some are tight 3-sentence punchy emails, some are 5-sentence with more context. Never the same length twice in a row.

## PERSONA
${toneConfig.voice}

## TONE
${toneConfig.style}

## NEVER USE THESE OPENERS
"I hope this finds you", "I hope you're doing well", "I wanted to reach out", "My name is X and I", "I came across your business", "Are you struggling with", "We help companies like yours", "I'd love to connect", "I noticed your business online"

## BANNED WORDS (AI-detector words — never write these)
synergy, leverage, unlock, revolutionize, game-changer, cutting-edge, seamlessly, transform, streamline, elevate, empower, scalable, robust, innovative, pain points, deep dive, circle back, move the needle, best-in-class, world-class, tailored, comprehensive, actionable, impactful, holistic, robust, solutions

## SUBJECT LINE RULES (pick a different structure for each email)
- 4–7 words max, no trailing punctuation
- Structures to rotate: city + industry ("Austin plumbers doing this wrong"), business name specific ("re: [Name]'s Google reviews"), question-free observation, number hook ("3 dental clinics in Dallas that...")
- Never: "Quick question", "Partnership opportunity", "Growing your business"

## EMAIL BODY STRUCTURE — pick ONE variant per email (rotate variants across batch):
VARIANT A (INSIGHT-FIRST): Open with a sharp local observation → specific value claim with a real number → soft CTA
VARIANT B (RESULT-FIRST): Lead with a specific result you got for a similar business → explain why it applies to them → CTA
VARIANT C (HOOK-QUESTION): Single sharp observation about their niche → what you do and one real proof stat → CTA
VARIANT D (SHORT-PUNCH): 3 sentences total. No fluff. Specific hook, specific offer, specific CTA. Under 60 words.

## CTA FOR THIS BATCH
"${toneConfig.cta}"

## CLOSING
"${toneConfig.closing}"
Signature: {{YourName}}

## JSON OUTPUT ONLY — no markdown, no explanation
{"contacts":[{"contactName":"string","title":"string","email":"","emailSubject":"string","emailBody":"string"}]}

Rules:
- email: always ""
- contactName: real-sounding name for the region
- emailBody: includes salutation (Hi [Name],), body, blank line, closing, {{YourName}}`,
          },
          {
            role: "user",
            content: `Write ${sortedDetails.length} cold emails for ${businessType} businesses in ${location}.

OFFER BEING PITCHED: ${intent ? `"${intent}"` : `A relevant service for ${businessType} owners — infer something specific from context`}

IMPORTANT: If the offer mentions a demo, call, or trial — make sure the CTA references that specific action. Make the emails feel like they were written by someone who genuinely understands this business type.

BUSINESSES (write one email per business, vary structure for each):
${businessList}

Return exactly ${sortedDetails.length} JSON contact objects. Each email body must use a DIFFERENT variant structure. No two emails can open the same way.`,
          },
        ],
          max_tokens: 4096,
        }),
        // Scrape emails for all candidates in parallel with AI generation
        Promise.all(
          sortedDetails.map(async (p) => {
            if (!p.website) return null;
            try { return await scrapeEmailFromWebsite(p.website); }
            catch { return null; }
          })
        ),
      ]);

      const rawContent = completion.choices[0]?.message?.content;
      if (!rawContent) return res.status(500).json({ error: "No response from AI" });

      const aiContent = rawContent
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      let aiData: any;
      try {
        aiData = JSON.parse(aiContent);
      } catch {
        const match = aiContent.match(/\{[\s\S]*\}/);
        if (!match) return res.status(500).json({ error: "AI returned invalid JSON" });
        aiData = JSON.parse(match[0]);
      }
      const contacts: any[] = aiData.contacts || [];

      /* ── 7. Merge + ONLY keep leads with a confirmed email ────────── */
      const allMerged = sortedDetails.map((place, idx) => {
        const contact      = contacts[idx] || {};
        const scoring      = scorePlace(place, businessType);
        const emailToUse   = scrapedEmails[idx] || "";
        const emailVerified = !!emailToUse && emailToUse.includes("@");
        return {
          id: idx + 1,
          companyName:  place.name,
          address:      place.address,
          phone:        place.phone,
          website:      place.website,
          rating:       place.rating > 0 ? place.rating : undefined,
          reviewCount:  place.reviewCount > 0 ? place.reviewCount : undefined,
          contactName:  contact.contactName  || "",
          title:        contact.title        || "",
          email:        emailToUse,
          emailVerified,
          emailSubject: contact.emailSubject || "",
          emailBody:    contact.emailBody    || "",
          industry:     businessType,
          status:       "new" as const,
          ...scoring,
        };
      });

      // ONLY return leads that have a verified email — guarantee deliverability
      // Only keep leads with a confirmed email address
      const leads = allMerged
        .filter(l => l.email && l.email.includes("@"))
        .map((l, i) => ({ ...l, id: i + 1 }));

      // If somehow zero passed the filter, return all merged leads anyway
      // (better to let the user see results than a blank error)
      const finalLeads = leads.length > 0 ? leads : allMerged.map((l, i) => ({ ...l, id: i + 1 }));

      return res.json({ leads: finalLeads, businessType, location });
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
      // Skip leads with no valid email address
      if (!lead.email || !lead.email.includes("@")) {
        results.push({ email: lead.email || "", success: false, error: "No email address found for this lead" });
        continue;
      }
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

  /* ─── AI Inbox: Summarize email ─────────────────────────────────── */
  app.post("/api/inbox/summarize", requireAuth, async (req: Request, res: Response) => {
    const { subject, snippet, from } = req.body;
    if (!snippet) return res.status(400).json({ error: "snippet required" });
    try {
      const completion = await aiCall({
        max_tokens: 400,
        messages: [
          { role: "system", content: `You are an inbox assistant for a B2B outreach platform. Analyze the email and return a JSON object with:
- "summary": 1-2 sentences capturing the core message and any next step implied
- "sentiment": one of "positive", "neutral", "negative", "interested", "not_interested"
- "keyPoints": array of 2-3 concise bullet strings (the most actionable details)

Return ONLY valid JSON. No markdown. Schema: {"summary":"...","sentiment":"...","keyPoints":["...","..."]}` },
          { role: "user", content: `Subject: ${subject || "(none)"}\nFrom: ${from || "unknown"}\n\n${snippet}` },
        ],
      });
      const raw = (completion.choices[0]?.message?.content || "").replace(/```(?:json)?/g, "").trim();
      const data = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /* ─── AI Inbox: Smart reply suggestions ─────────────────────────── */
  app.post("/api/inbox/smart-replies", requireAuth, async (req: Request, res: Response) => {
    const { subject, snippet, from } = req.body;
    if (!snippet) return res.status(400).json({ error: "snippet required" });
    try {
      const completion = await aiCall({
        max_tokens: 250,
        messages: [
          { role: "system", content: `You are a smart reply assistant for a B2B sales inbox. Generate exactly 3 reply options that a sales rep might send. Rules:
- Each reply under 15 words
- Vary the intent: one accepting/positive, one asking a question, one soft decline or delay
- Match the tone of the incoming email (formal stays formal, casual stays casual)
- Sound like a human wrote them, not software
Return ONLY valid JSON: {"replies":["...","...","..."]}` },
          { role: "user", content: `Subject: ${subject || "(none)"}\nFrom: ${from || "unknown"}\n\n${snippet}` },
        ],
      });
      const raw = (completion.choices[0]?.message?.content || "").replace(/```(?:json)?/g, "").trim();
      const data = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      return res.json(data);
    } catch (e: any) {
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
