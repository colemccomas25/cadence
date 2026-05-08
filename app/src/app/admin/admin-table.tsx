"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  setStudioPlan,
  resetOnboarding,
  runLessonReminderCron,
  runInvoiceGenerationCron,
} from "@/actions/admin";
import { PLAN_LABELS, type Plan } from "@/lib/plan";

const PLANS: Plan[] = ["free", "solo", "studio"];

export type StudioRow = {
  id: string;
  name: string;
  ownerEmail: string;
  plan: Plan;
  studentCount: number;
  lessonCount: number;
  invoiceCount: number;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
};

function PlanButtons({ studioId, currentPlan }: { studioId: string; currentPlan: Plan }) {
  const [isPending, startTransition] = useTransition();

  const flip = (plan: Plan) => {
    if (plan === currentPlan) return;
    startTransition(async () => {
      await setStudioPlan(studioId, plan);
      toast.success(`Plan set to ${PLAN_LABELS[plan]}`);
    });
  };

  return (
    <div className="flex gap-1">
      {PLANS.map((plan) => (
        <button
          key={plan}
          onClick={() => flip(plan)}
          disabled={isPending}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
            plan === currentPlan
              ? "bg-accent text-white"
              : "border border-line text-ink hover:bg-muted"
          }`}
        >
          {PLAN_LABELS[plan]}
        </button>
      ))}
      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-inkSubtle self-center ml-1" />}
    </div>
  );
}

function ResetOnboardingButton({ studioId, studioName }: { studioId: string; studioName: string }) {
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    if (!window.confirm(`Reset onboarding for ${studioName}?`)) return;
    startTransition(async () => {
      await resetOnboarding(studioId);
      toast.success("Onboarding reset");
    });
  };

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="text-xs text-amber-600 hover:underline disabled:opacity-50"
    >
      {isPending ? "…" : "reset"}
    </button>
  );
}

function CronButtons() {
  const [reminderPending, startReminder] = useTransition();
  const [invoicePending, startInvoice] = useTransition();

  const runReminders = () => {
    startReminder(async () => {
      const result = await runLessonReminderCron();
      toast.success(`Reminders: checked ${result.checked}, sent ${result.sent}, failed ${result.failed}`);
    });
  };

  const runInvoices = () => {
    startInvoice(async () => {
      const result = await runInvoiceGenerationCron();
      toast.success(`Invoice generation: ${result.generated} invoice(s) created`);
    });
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={runReminders}
        disabled={reminderPending}
        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-muted disabled:opacity-50 transition-colors"
      >
        {reminderPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Run lesson reminders
      </button>
      <button
        onClick={runInvoices}
        disabled={invoicePending}
        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-muted disabled:opacity-50 transition-colors"
      >
        {invoicePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Run invoice generation
      </button>
    </div>
  );
}

export function AdminTable({ studios }: { studios: StudioRow[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">
          Studios{" "}
          <span className="text-inkSubtle font-normal text-sm">({studios.length})</span>
        </h1>
        <CronButtons />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="px-4 py-3 text-left font-medium text-inkSubtle">Studio</th>
              <th className="px-4 py-3 text-left font-medium text-inkSubtle">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-inkSubtle">Plan</th>
              <th className="px-4 py-3 text-right font-medium text-inkSubtle font-mono">Students</th>
              <th className="px-4 py-3 text-right font-medium text-inkSubtle font-mono">Lessons</th>
              <th className="px-4 py-3 text-right font-medium text-inkSubtle font-mono">Invoices</th>
              <th className="px-4 py-3 text-left font-medium text-inkSubtle">Onboarded</th>
              <th className="px-4 py-3 text-left font-medium text-inkSubtle">Created</th>
            </tr>
          </thead>
          <tbody>
            {studios.map((s, i) => (
              <tr
                key={s.id}
                className={`border-b border-line last:border-0 ${i % 2 === 1 ? "bg-surface/50" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-inkSubtle">{s.ownerEmail}</td>
                <td className="px-4 py-3">
                  <PlanButtons studioId={s.id} currentPlan={s.plan} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-inkSubtle">{s.studentCount}</td>
                <td className="px-4 py-3 text-right font-mono text-inkSubtle">{s.lessonCount}</td>
                <td className="px-4 py-3 text-right font-mono text-inkSubtle">{s.invoiceCount}</td>
                <td className="px-4 py-3 text-xs text-inkSubtle">
                  {s.onboardingCompletedAt ? (
                    <span className="font-mono">
                      {s.onboardingCompletedAt.toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-amber-600">no</span>
                  )}
                  {" "}
                  <ResetOnboardingButton studioId={s.id} studioName={s.name} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-inkSubtle">
                  {s.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
