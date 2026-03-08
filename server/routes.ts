import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { generateLeadsSchema } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/generate-leads", async (req, res) => {
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

      const parsed2 = JSON.parse(content);
      const leads = parsed2.leads.map((lead: any, idx: number) => ({
        ...lead,
        id: idx + 1,
        status: "new",
      }));

      return res.json({
        leads,
        businessType,
        location,
      });
    } catch (error: any) {
      console.error("Error generating leads:", error);
      return res.status(500).json({ error: "Failed to generate leads", message: error.message });
    }
  });

  return httpServer;
}
