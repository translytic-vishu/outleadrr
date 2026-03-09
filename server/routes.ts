import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import OpenAI from "openai";
import { generateLeadsSchema } from "@shared/schema";
import { getAuthUrl, getOAuthClient, getUserInfo, sendEmailViaGmail } from "./gmail";
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
      res.json({
        connected: true,
        email: req.session.gmailEmail,
        name: req.session.gmailName,
      });
    } else {
      res.json({ connected: false });
    }
  });

  app.post("/api/auth/disconnect", (req: Request, res: Response) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  /* ─── Generate Leads ───────────────────────────────────────────── */

  app.post("/api/generate-leads", async (req: Request, res: Response) => {
    try {
      const parsed = generateLeadsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      }

      const { businessType, location } = parsed.data;

      const systemPrompt = `You are an expert B2B sales intelligence system. Generate realistic, fictional leads for sales prospecting. Create believable company names, professional email addresses, and highly personalized cold emails that feel genuine and research-based. The emails should be concise, compelling, and not spammy.`;

      const userPrompt = `Generate exactly 10 realistic sales leads for ${businessType} businesses in ${location}.

Return a JSON object with this exact structure:
{
  "leads": [
    {
      "id": 1,
      "companyName": "Company Name",
      "contactName": "Full Name",
      "email": "firstname.lastname@companydomain.com",
      "phone": "(555) 123-4567",
      "website": "www.companydomain.com",
      "industry": "${businessType}",
      "emailSubject": "Compelling email subject line",
      "emailBody": "Full personalized cold email body (3-4 paragraphs, professional but warm tone, references their specific business type and location, includes a clear value proposition and call to action)"
    }
  ]
}

Requirements:
- Make company names realistic and varied (some with local flair from ${location})
- Use professional email formats: firstname@domain.com or firstname.lastname@domain.com
- Websites should match company names
- Each cold email must be unique, personalized, and reference ${location} and the ${businessType} industry
- Emails should be 150-200 words, professional, conversational
- Include a clear subject line that would get opened
- Phone numbers should be real-looking US format
- Return ONLY valid JSON, nothing else`;

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
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }

      const data = JSON.parse(content);
      const leads = data.leads.map((lead: any, idx: number) => ({
        ...lead,
        id: idx + 1,
        status: "new",
      }));

      return res.json({ leads, businessType, location });
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
        await sendEmailViaGmail(
          accessToken,
          refreshToken,
          from,
          lead.email,
          lead.emailSubject,
          lead.emailBody
        );
        results.push({ email: lead.email, success: true });
        // small delay to avoid rate limiting
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
