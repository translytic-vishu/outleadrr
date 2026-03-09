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

export const authStatusSchema = z.object({
  connected: z.boolean(),
  email: z.string().optional(),
  name: z.string().optional(),
});

export const sendResultSchema = z.object({
  email: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
});

export const sendEmailsResponseSchema = z.object({
  results: z.array(sendResultSchema),
  sent: z.number(),
  failed: z.number(),
  total: z.number(),
});

export type Lead = z.infer<typeof leadSchema>;
export type GenerateLeadsInput = z.infer<typeof generateLeadsSchema>;
export type LeadsResponse = z.infer<typeof leadsResponseSchema>;
export type AuthStatus = z.infer<typeof authStatusSchema>;
export type SendResult = z.infer<typeof sendResultSchema>;
export type SendEmailsResponse = z.infer<typeof sendEmailsResponseSchema>;
