import { z } from "zod";

export const generateLeadsSchema = z.object({
  businessType: z.string().min(1),
  location: z.string().min(1),
});

export const leadSchema = z.object({
  id: z.number(),
  companyName: z.string(),
  contactName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
  industry: z.string(),
  emailSubject: z.string(),
  emailBody: z.string(),
  status: z.enum(["new", "contacted", "replied", "closed"]).default("new"),
});

export const leadsResponseSchema = z.object({
  leads: z.array(leadSchema),
  businessType: z.string(),
  location: z.string(),
});

export type Lead = z.infer<typeof leadSchema>;
export type GenerateLeadsInput = z.infer<typeof generateLeadsSchema>;
export type LeadsResponse = z.infer<typeof leadsResponseSchema>;
