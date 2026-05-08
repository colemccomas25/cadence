"use server";

import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type { Plan } from "@/lib/plan";

export async function setStudioPlan(studioId: string, plan: Plan) {
  await requireAdmin();
  await db.update(studios).set({ plan }).where(eq(studios.id, studioId));
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function resetOnboarding(studioId: string) {
  await requireAdmin();
  await db
    .update(studios)
    .set({ onboardingCompletedAt: null })
    .where(eq(studios.id, studioId));
  revalidatePath("/admin");
  return { success: true as const };
}

export async function runLessonReminderCron(): Promise<{ checked: number; sent: number; failed: number }> {
  await requireAdmin();
  const { runLessonReminders } = await import("@/lib/cron-lesson-reminders");
  return runLessonReminders();
}

export async function runInvoiceGenerationCron(): Promise<{ generated: number }> {
  await requireAdmin();
  const { runInvoiceGeneration } = await import("@/lib/cron-invoice-generation");
  return runInvoiceGeneration();
}
