"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Studio name is required").max(80),
  timezone: z.string().min(1, "Pick your timezone"),
  currency: z.enum(["USD", "CAD", "GBP", "EUR", "AUD"]),
});

export type CompleteOnboardingResult =
  | { success: true }
  | { success: false; error: string };

export async function completeOnboarding(
  data: unknown,
): Promise<CompleteOnboardingResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not signed in" };

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  await db
    .update(studios)
    .set({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
      onboardingCompletedAt: new Date(),
    })
    .where(eq(studios.id, studio.id));

  revalidatePath("/dashboard");
  return { success: true };
}
