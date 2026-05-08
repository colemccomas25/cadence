/**
 * Plan limits + feature gates for Cadence.
 *
 * Single source of truth: every feature check, limit check, and pricing-page label
 * should pull from this file. Don't hard-code "free", "solo", or numbers anywhere
 * else in the app.
 */

import type { Studio } from "@/db/schema";

export type Plan = "free" | "solo" | "studio";

export type Feature =
  // Solo+ features
  | "lesson_reminders"          // 24h-out parent email reminders (cron)
  | "stripe_invoicing"          // Generate Stripe Checkout links for invoices
  | "family_billing"            // Multiple students billed to one parent
  | "makeup_tracking"           // Make-up lesson scheduling/tracking
  // Studio-only features
  | "auto_charge"               // Off-session card charges via saved payment method
  | "group_lessons"             // Lessons with >1 student
  | "practice_log"              // Student practice-minutes log
  | "parent_portal"             // Parent-side login & dashboard
  | "priority_support";         // Marketing only — no behavior gate

/**
 * Maximum active (non-archived) students per plan.
 * `null` means unlimited.
 */
export const STUDENT_LIMITS: Record<Plan, number | null> = {
  free: 5,
  solo: 30,
  studio: null,
};

/**
 * Which plan unlocks each feature (lowest tier required).
 * If a plan's tier >= the required tier, the feature is enabled.
 */
const PLAN_RANK: Record<Plan, number> = { free: 0, solo: 1, studio: 2 };

const FEATURE_REQUIRES: Record<Feature, Plan> = {
  lesson_reminders: "solo",
  stripe_invoicing: "solo",
  family_billing: "solo",
  makeup_tracking: "solo",
  auto_charge: "studio",
  group_lessons: "studio",
  practice_log: "studio",
  parent_portal: "studio",
  priority_support: "studio",
};

/** Display labels for plans. */
export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  solo: "Solo",
  studio: "Studio",
};

/**
 * Does this studio's plan unlock the feature?
 */
export function canUseFeature(
  studio: Pick<Studio, "plan">,
  feature: Feature,
): boolean {
  return PLAN_RANK[studio.plan] >= PLAN_RANK[FEATURE_REQUIRES[feature]];
}

/**
 * Lowest plan that unlocks the feature. Useful for upsell copy.
 */
export function requiredPlanFor(feature: Feature): Plan {
  return FEATURE_REQUIRES[feature];
}

/**
 * Can this studio add another active student given its current count?
 */
export function canAddStudent(
  studio: Pick<Studio, "plan">,
  currentActiveCount: number,
): boolean {
  const limit = STUDENT_LIMITS[studio.plan];
  if (limit === null) return true; // unlimited
  return currentActiveCount < limit;
}

/**
 * Friendly message describing why an add-student attempt was blocked.
 */
export function studentLimitMessage(plan: Plan): string {
  const limit = STUDENT_LIMITS[plan];
  if (limit === null) return ""; // shouldn't happen
  const next = plan === "free" ? "Solo" : "Studio";
  return `You've reached the ${PLAN_LABELS[plan]} plan limit of ${limit} students. Upgrade to ${next} to add more.`;
}

/**
 * Returns the studio's student-count headroom: { used, limit, remaining, atLimit }.
 * `limit === null` means unlimited (Studio plan).
 */
export function studentUsage(
  plan: Plan,
  currentActiveCount: number,
): { used: number; limit: number | null; remaining: number | null; atLimit: boolean } {
  const limit = STUDENT_LIMITS[plan];
  if (limit === null) {
    return { used: currentActiveCount, limit: null, remaining: null, atLimit: false };
  }
  const remaining = Math.max(0, limit - currentActiveCount);
  return { used: currentActiveCount, limit, remaining, atLimit: currentActiveCount >= limit };
}
