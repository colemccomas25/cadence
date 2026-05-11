"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createGroupLesson } from "@/actions/groups";

type Student = { id: string; name: string; instrument: string | null; defaultRateCents: number };

const inputCls = "w-full rounded-md border border-line bg-surface px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";

export function GroupLessonForm({ students }: { students: Student[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rates, setRates] = useState<Record<string, number>>({});
  const [recurrence, setRecurrence] = useState<"none" | "weekly" | "biweekly">("none");

  const today = new Date().toISOString().split("T")[0];

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (!rates[id]) {
      const s = students.find((st) => st.id === id);
      setRates((r) => ({ ...r, [id]: Math.round((s?.defaultRateCents ?? 4000) / 100) }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selected.size < 2) { toast.error("Select at least 2 students."); return; }

    const fd = new FormData(e.currentTarget);
    const startsAt = `${fd.get("date")}T${fd.get("time")}:00`;
    const durationMinutes = parseInt(fd.get("durationMinutes") as string);
    const studentRates = [...selected].map((id) => ({
      studentId: id,
      rateCents: Math.round((rates[id] ?? 40) * 100),
    }));

    const input: Parameters<typeof createGroupLesson>[0] = {
      startsAt,
      durationMinutes,
      studentRates,
      recurrence,
    };

    if (recurrence !== "none") {
      input.startsOn = fd.get("startsOn") as string;
      input.endsOn = (fd.get("endsOn") as string) || undefined;
      const [h, m] = ((fd.get("time") as string) ?? "16:00").split(":").map(Number);
      input.startTimeMinutes = h * 60 + m;
      const d = new Date(`${fd.get("date")}T00:00:00`);
      input.dayOfWeek = d.getDay();
    }

    startTransition(async () => {
      const result = await createGroupLesson(input);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Group lesson created");
      router.push("/dashboard/calendar");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-surface rounded-xl border border-line p-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-inkMuted mb-1">Date</label>
          <input name="date" type="date" required defaultValue={today} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-inkMuted mb-1">Time</label>
          <input name="time" type="time" required defaultValue="16:00" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-inkMuted mb-1">Duration</label>
          <select name="durationMinutes" defaultValue="60" className={inputCls}>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-inkMuted mb-1">Repeats</label>
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)} className={inputCls}>
            <option value="none">One-off</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
          </select>
        </div>
      </div>

      {recurrence !== "none" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Starting on</label>
            <input name="startsOn" type="date" required defaultValue={today} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Ending (optional)</label>
            <input name="endsOn" type="date" className={inputCls} />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-inkMuted mb-2">Students ({selected.size} selected)</label>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {students.map((s) => (
            <label key={s.id} className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors ${selected.has(s.id) ? "border-accent bg-accentSoft" : "border-line bg-surface hover:bg-muted"}`}>
              <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleStudent(s.id)} className="rounded" />
              <span className="flex-1 text-sm text-ink">{s.name}{s.instrument ? ` · ${s.instrument}` : ""}</span>
              {selected.has(s.id) && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-inkSubtle">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={rates[s.id] ?? Math.round((s.defaultRateCents) / 100)}
                    onChange={(e) => setRates((r) => ({ ...r, [s.id]: parseFloat(e.target.value) || 0 }))}
                    onClick={(e) => e.preventDefault()}
                    className="w-16 rounded border border-line px-1.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
            </label>
          ))}
        </div>
        {selected.size >= 2 && (
          <p className="text-xs text-inkSubtle mt-2 font-mono">
            Group total: ${[...selected].reduce((s, id) => s + (rates[id] ?? 40), 0).toFixed(2)}/lesson
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || selected.size < 2}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-medium text-white hover:bg-accentHover transition-colors disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create group lesson
      </button>
    </form>
  );
}
