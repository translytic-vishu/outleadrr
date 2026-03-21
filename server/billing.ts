/**
 * Stripe billing — subscription management for Outleadrr plans.
 * Env vars required:
 *   STRIPE_SECRET_KEY        — from stripe.com dashboard (sk_live_... or sk_test_...)
 *   STRIPE_WEBHOOK_SECRET    — from stripe webhook endpoint
 *   STRIPE_PRICE_STARTER     — price ID for Starter plan (5 leads/campaign)
 *   STRIPE_PRICE_PRO         — price ID for Pro plan (25 leads/campaign)
 *   STRIPE_PRICE_AGENCY      — price ID for Agency plan (50 leads/campaign)
 *
 * Plans:
 *   Starter  — $29/mo — up to 5 leads per campaign
 *   Pro      — $79/mo — up to 25 leads per campaign
 *   Agency   — $149/mo — up to 50 leads per campaign
 */
import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : null;

export const PLANS = {
  starter: { name: "Starter", maxLeads: 5,  priceId: process.env.STRIPE_PRICE_STARTER || "" },
  pro:     { name: "Pro",     maxLeads: 25, priceId: process.env.STRIPE_PRICE_PRO     || "" },
  agency:  { name: "Agency",  maxLeads: 50, priceId: process.env.STRIPE_PRICE_AGENCY  || "" },
} as const;

export type PlanKey = keyof typeof PLANS;

/** Create a Stripe checkout session for a given plan */
export async function createCheckoutSession(opts: {
  userEmail: string;
  planKey: PlanKey;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  if (!stripe) {
    console.warn("[Stripe] STRIPE_SECRET_KEY not set");
    return null;
  }
  const plan = PLANS[opts.planKey];
  if (!plan.priceId) {
    console.warn(`[Stripe] Price ID not set for plan: ${opts.planKey}`);
    return null;
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: opts.userEmail,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { plan: opts.planKey },
  });
  return session.url;
}

/** Create a Stripe billing portal session for managing subscriptions */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string | null> {
  if (!stripe) return null;
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
  return session.url;
}

/** Verify a Stripe webhook event signature */
export function constructWebhookEvent(payload: Buffer, sig: string): Stripe.Event | null {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return null;
  try {
    return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return null;
  }
}
