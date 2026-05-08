import { requireStripe } from "@/lib/stripe";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function ensureConnectAccount(studio: {
  id: string;
  stripeConnectAccountId: string | null;
  ownerEmail: string;
  name: string;
}): Promise<string> {
  if (studio.stripeConnectAccountId) return studio.stripeConnectAccountId;
  const stripe = requireStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: studio.ownerEmail,
    business_profile: {
      name: studio.name,
      product_description: "Private music lessons",
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { studioId: studio.id },
  });
  await db
    .update(studios)
    .set({ stripeConnectAccountId: account.id })
    .where(eq(studios.id, studio.id));
  return account.id;
}

export async function createOnboardingLink(accountId: string): Promise<string> {
  const stripe = requireStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${APP_URL}/api/stripe/connect/refresh`,
    return_url: `${APP_URL}/api/stripe/connect/return`,
  });
  return link.url;
}

export async function createDashboardLink(accountId: string): Promise<string> {
  const stripe = requireStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

export async function syncStudioFromAccount(accountId: string): Promise<void> {
  const stripe = requireStripe();
  const account: Stripe.Account = await stripe.accounts.retrieve(accountId);
  await db
    .update(studios)
    .set({
      stripeConnectChargesEnabled: account.charges_enabled,
      stripeConnectPayoutsEnabled: account.payouts_enabled,
      stripeConnectDetailsSubmitted: account.details_submitted,
    })
    .where(eq(studios.stripeConnectAccountId, accountId));
}
