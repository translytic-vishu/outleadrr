import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import OpenAI from "openai";
import { generateLeadsSchema } from "@shared/schema";
import { getAuthUrl, getOAuthClient, getUserInfo, sendEmailViaGmail } from "./gmail";
import { getApolloLeads, type ApolloPerson } from "./apollo";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

declare module "express-session" {
  interface SessionData {
    gmailAccessToken?: string;
    gmailRefreshToken?: string;
    gmailEmail?: string;
    gmailName?: string;
  }
}

const MemStore = MemoryStore(session);

/* ─── helpers ────────────────────────────────────────────────────── */

function formatPhone(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

function cleanWebsite(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Build a prompt for GPT to write cold emails for real Apollo contacts.
 */
function buildEmailPrompt(
  people: ApolloPerson[],
  businessType: string,
  location: string
): string {
  const contactList = people
    .map((p, i) => {
      const company = p.organization?.name || p.organization_name || "their company";
      const title = p.title || "professional";
      return `${i + 1}. Name: ${p.name}, Title: ${title}, Company: ${company}`;
    })
    .join("\n");

  return `You are an expert B2B sales copywriter. Write a highly personalized cold email for each of the following real contacts. These are real ${businessType} professionals in ${location}.

Contacts:
${contactList}

Return a JSON object with this exact structure:
{
  "emails": [
    {
      "index": 1,
      "emailSubject": "Compelling, specific subject line (max 60 chars)",
      "emailBody": "Full personalized cold email body (3-4 paragraphs, 150-200 words). Reference their specific title, company type, and location. Professional but conversational. Clear value proposition. Soft CTA."
    }
  ]
}

Rules:
- Each email must be unique and tailored to that specific person's role and company
- Reference the ${location} market specifically
- Do NOT use generic openers like "I hope this email finds you well"
- Subject lines should be curiosity-driven, not salesy
- Return ONLY valid JSON`;
}

/* ─── route registration ─────────────────────────────────────────── */

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  /* ─── Google OAuth ─────────────────────────────────────────────── */

  app.get("/api/auth/google", (_req: Request, res: Response) => {
    const url = getAuthUrl();
    res.redirect(url);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.redirect("/?error=oauth_failed");
    }
    try {
      const oauth2Client = getOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);
      const accessToken = tokens.access_token!;
      const refreshToken = tokens.refresh_token || "";
      const userInfo = await getUserInfo(accessToken, refreshToken);
      req.session.gmailAccessToken = accessToken;
      req.session.gmailRefreshToken = refreshToken;
      req.session.gmailEmail = userInfo.email || "";
      req.session.gmailName = userInfo.name || "";
      res.redirect("/?connected=true");
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect("/?error=oauth_failed");
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
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  /* ─── Generate Leads (Apollo + OpenAI) ────────────────────────── */

  app.post("/api/generate-leads", async (req: Request, res: Response) => {
    try {
      const parsed = generateLeadsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      }

      const { businessType, location } = parsed.data;

      /* ── 1. Fetch real contacts from Apollo ──────────────────── */
      let apolloPeople: ApolloPerson[] = [];
      let source: "apollo" | "ai" = "apollo";

      try {
        console.log(`[Apollo] Searching for ${businessType} in ${location}...`);
        apolloPeople = await getApolloLeads(businessType, location, 10);
        console.log(`[Apollo] Found ${apolloPeople.length} contacts`);
      } catch (apolloErr: any) {
        console.error("[Apollo] Search failed, falling back to AI:", apolloErr.message);
        source = "ai";
      }

      /* ── 2. If Apollo returned results, write emails with GPT ── */
      if (apolloPeople.length > 0) {
        const emailPrompt = buildEmailPrompt(apolloPeople, businessType, location);

        const completion = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: "You are an expert B2B cold email copywriter. Always return valid JSON only." },
            { role: "user", content: emailPrompt },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 6000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No response from AI");

        const emailData = JSON.parse(content);
        const emailMap: Record<number, { emailSubject: string; emailBody: string }> = {};
        for (const e of emailData.emails || []) {
          emailMap[e.index] = { emailSubject: e.emailSubject, emailBody: e.emailBody };
        }

        const leads = apolloPeople.map((person, idx) => {
          const email = emailMap[idx + 1] || { emailSubject: "Quick question for you", emailBody: "Hi, I'd love to connect and discuss how we can help your business." };
          const phone = formatPhone(person.phone_numbers?.[0]?.raw_number);
          const website = cleanWebsite(person.organization?.website_url || person.organization?.primary_domain);
          const companyName = person.organization?.name || person.organization_name || "Unknown Company";

          return {
            id: idx + 1,
            apolloId: person.id,
            companyName,
            contactName: person.name,
            title: person.title || undefined,
            email: person.email || `${person.first_name.toLowerCase()}@${person.organization?.primary_domain || "noreply.com"}`,
            emailVerified: !!person.email,
            phone,
            website,
            industry: businessType,
            emailSubject: email.emailSubject,
            emailBody: email.emailBody,
            status: "new" as const,
          };
        });

        return res.json({ leads, businessType, location, source: "apollo" });
      }

      /* ── 3. Fallback: pure AI generation ─────────────────────── */
      console.log("[AI] Generating fictional leads as fallback...");
      const aiPrompt = `Generate exactly 10 realistic sales leads for ${businessType} businesses in ${location}.

Return a JSON object:
{
  "leads": [
    {
      "id": 1,
      "companyName": "Company Name",
      "contactName": "Full Name",
      "title": "Job Title",
      "email": "firstname.lastname@companydomain.com",
      "phone": "(555) 123-4567",
      "website": "www.companydomain.com",
      "industry": "${businessType}",
      "emailSubject": "Compelling subject line",
      "emailBody": "Personalized cold email body (150-200 words, professional, references ${location} and ${businessType})"
    }
  ]
}
Return ONLY valid JSON.`;

      const fallback = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are a B2B sales intelligence system. Return valid JSON only." },
          { role: "user", content: aiPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const fallbackContent = fallback.choices[0]?.message?.content;
      if (!fallbackContent) return res.status(500).json({ error: "No response from AI" });

      const fallbackData = JSON.parse(fallbackContent);
      const leads = fallbackData.leads.map((lead: any, idx: number) => ({
        ...lead,
        id: idx + 1,
        emailVerified: false,
        status: "new",
      }));

      return res.json({ leads, businessType, location, source: "ai" });
    } catch (error: any) {
      console.error("Error generating leads:", error);
      return res.status(500).json({ error: "Failed to generate leads", message: error.message });
    }
  });

  /* ─── Send All Emails via Gmail ────────────────────────────────── */

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

  app.post("/api/send-emails", async (req: Request, res: Response) => {
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
