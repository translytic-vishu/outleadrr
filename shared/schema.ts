import { z } from "zod";

/* ─── user ────────────────────────────────────────────────────────── */
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.string().optional(),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const meResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;

/* ─── leads ───────────────────────────────────────────────────────── */
export const generateLeadsSchema = z.object({
  businessType: z.string().min(1),
  location: z.string().min(1),
  intent: z.string().optional(),
  leadCount: z.number().int().min(1).max(50).optional(),
  tone: z.enum(["professional", "friendly", "direct", "humorous", "persuasive", "casual", "consultative", "bold"]).optional(),
});

export const leadSchema = z.object({
  id: z.number(),
  companyName: z.string(),
  contactName: z.string(),
  title: z.string().optional(),
  email: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  industry: z.string(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  score: z.number().optional(),
  scoreLabel: z.string().optional(),
  scoreBreakdown: z.object({
    industryFit: z.number(),
    businessSize: z.number(),
    reachability: z.number(),
    opportunity: z.number(),
    reviewHealth: z.number(),
  }).optional(),
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

/* Legacy — kept to avoid TS errors in storage.ts until rewritten */
export type InsertUser = { email: string; passwordHash: string };
