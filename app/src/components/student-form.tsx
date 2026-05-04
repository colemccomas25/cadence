"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createStudent } from "@/actions/students";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  instrument: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(1),
  rateDollars: z.coerce.number().min(0, "Rate must be 0 or more"),
});

type FormValues = z.infer<typeof schema>;

export function StudentCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { durationMinutes: 30, rateDollars: 40 },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createStudent(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.name} added to your studio`);
      router.push("/dashboard/students");
    });
  };

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500";
  const errorClass = "text-sm text-red-600 mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          {...register("name")}
          placeholder="Jamie Chen"
          aria-invalid={!!errors.name}
          className={`${inputClass} ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Instrument</label>
        <input {...register("instrument")} placeholder="Piano" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Default duration</label>
          <select {...register("durationMinutes")} className={inputClass}>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Rate per lesson ($)
          </label>
          <input
            {...register("rateDollars")}
            type="number"
            min="0"
            step="0.01"
            aria-invalid={!!errors.rateDollars}
            className={`${inputClass} ${errors.rateDollars ? "border-red-400 focus:ring-red-400" : ""}`}
          />
          {errors.rateDollars && <p className={errorClass}>{errors.rateDollars.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/students")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save student
        </button>
      </div>
    </form>
  );
}
