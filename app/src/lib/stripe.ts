import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  // We don't throw at import time so dev can boot without Stripe configured;
  // routes that need Stripe should call `requireStripe()`.
  console.warn("[stripe] STRIPE_SECRET_KEY is not set — payment routes will fail.");
}

export const stripe = key
  ? new Stripe(key, { apiVersion: "2024-09-30.acacia" })
  : (null as unknown as Stripe);

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  return stripe;
}

export const PRICE_IDS = {
  solo_monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY,
  solo_yearly: process.env.STRIPE_PRICE_SOLO_YEARLY,
  studio_monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY,
  studio_yearly: process.env.STRIPE_PRICE_STUDIO_YEARLY,
} as const;

export type PriceKey = keyof typeof PRICE_IDS;
