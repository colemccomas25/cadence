"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { completeOnboarding } from "@/actions/onboarding";

const FALLBACK_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Detroit",
  "America/Indiana/Indianapolis",
  "America/Toronto",
  "America/Vancouver",
  "America/Halifax",
  "America/Edmonton",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Pacific/Auckland",
];

function getTimezones(): string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (Intl as any).supportedValuesOf("timeZone") as string[];
  } catch {
    return FALLBACK_TIMEZONES;
  }
}

const schema = z.object({
  name: z.string().trim().min(1, "Studio name is required").max(80),
  timezone: z.string().min(1, "Pick your timezone"),
  currency: z.enum(["USD", "CAD", "GBP", "EUR", "AUD"]),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-md border border-line px-3 py-2 text-sm bg-surface text-ink placeholder:text-inkSubtle focus:outline-none focus:ring-2 focus:ring-cta/40";
const errorClass = "text-xs text-red-500 mt-1";
const helpClass = "text-xs text-inkSubtle mt-1";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const timezones = getTimezones();
  const detectedTz = typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/New_York";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName,
      timezone: detectedTz,
      currency: "USD",
    },
  });

  useEffect(() => {
    setValue("timezone", detectedTz);
  }, [detectedTz, setValue]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await completeOnboarding(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Studio set up — welcome!");
      router.push("/dashboard");
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-surface rounded-xl border border-line p-6 space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Studio name <span className="text-red-400">*</span>
        </label>
        <input
          {...register("name")}
          placeholder="Maple Street Music Studio"
          aria-invalid={!!errors.name}
          className={`${inputClass} ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
        />
        {errors.name ? (
          <p className={errorClass}>{errors.name.message}</p>
        ) : (
          <p className={helpClass}>What you want parents to see on invoices.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Timezone <span className="text-red-400">*</span>
        </label>
        <select
          {...register("timezone")}
          aria-invalid={!!errors.timezone}
          className={`${inputClass} ${errors.timezone ? "border-red-400 focus:ring-red-400" : ""}`}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        {errors.timezone ? (
          <p className={errorClass}>{errors.timezone.message}</p>
        ) : (
          <p className={helpClass}>Used for lesson times and reminder windows.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Currency <span className="text-red-400">*</span>
        </label>
        <select
          {...register("currency")}
          className={inputClass}
        >
          <option value="USD">USD — US Dollar</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="EUR">EUR — Euro</option>
          <option value="AUD">AUD — Australian Dollar</option>
        </select>
        <p className={helpClass}>Used for invoices and amounts shown across the app.</p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-cta px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Get started
        </button>
      </div>
    </form>
  );
}
