"use client";

import { useState } from "react";
import { submitPracticeLog } from "@/actions/practice-log";
import type { PracticeLog } from "@/db/schema";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function PracticeWeekGrid({
  studentId,
  existingLogs,
}: {
  studentId: string;
  existingLogs: PracticeLog[];
}) {
  const weekDates = getWeekDates();
  const logMap = new Map(existingLogs.map((l) => [toISODate(new Date(l.date)), l]));

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    weekDates.forEach((d) => {
      const key = toISODate(d);
      init[key] = logMap.get(key)?.minutes ?? 0;
    });
    return init;
  });
  const [saving, setSaving] = useState<string | null>(null);

  const handleBlur = async (dateStr: string) => {
    setSaving(dateStr);
    await submitPracticeLog({ studentId, date: dateStr, minutes: values[dateStr] ?? 0 });
    setSaving(null);
  };

  const weekTotal = Object.values(values).reduce((s, v) => s + (v || 0), 0);

  return (
    <div>
      <div className="text-xs font-semibold text-inkSubtle uppercase tracking-wider mb-2">
        This week
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDates.map((d, i) => {
          const key = toISODate(d);
          const isToday = key === toISODate(new Date());
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-mono ${isToday ? "text-accent" : "text-inkSubtle"}`}>
                {DAY_LABELS[i]}
              </span>
              <input
                type="number"
                min={0}
                max={600}
                value={values[key] ?? 0}
                onChange={(e) => setValues((v) => ({ ...v, [key]: parseInt(e.target.value) || 0 }))}
                onBlur={() => handleBlur(key)}
                className={`w-full rounded border px-1 py-1.5 text-xs text-center font-mono bg-surface focus:outline-none focus:ring-1 focus:ring-cta/40
                  ${saving === key ? "border-cta/40" : "border-line"}`}
              />
              {saving === key && (
                <span className="text-[9px] text-inkSubtle">saving…</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs text-inkSubtle text-right font-mono">
        Total: <span className="text-ink font-medium">{weekTotal} min</span>
      </div>
    </div>
  );
}
