const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMES = ["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

const LESSONS: Record<string, { student: string; instrument: string; isNow?: boolean; color: string }> = {
  "0-0": { student: "Jamie",  instrument: "Piano",  color: "bg-amber-100 border-l-amber-500 text-amber-900" },
  "1-1": { student: "Sofia",  instrument: "Violin", color: "bg-sky-50 border-l-sky-500 text-sky-900" },
  "1-2": { student: "Marcus", instrument: "Guitar", color: "bg-violet-50 border-l-violet-500 text-violet-900" },
  "2-0": { student: "Elena",  instrument: "Voice",  isNow: true, color: "bg-amber-50 border-l-amber-400 text-amber-900" },
  "3-1": { student: "Noah",   instrument: "Drums",  color: "bg-rose-50 border-l-rose-500 text-rose-900" },
  "4-0": { student: "Lily",   instrument: "Cello",  color: "bg-emerald-50 border-l-emerald-500 text-emerald-900" },
  "4-2": { student: "James",  instrument: "Piano",  color: "bg-sky-50 border-l-sky-500 text-sky-900" },
};

export function HeroScreenshot() {
  return (
    <div className="mt-12 rounded-xl border border-line shadow-lg overflow-hidden bg-surface">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3 bg-muted">
        <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
        <span className="ml-4 text-[11px] font-mono text-inkSubtle">May 5 – 10, 2025</span>
      </div>

      {/* Calendar grid */}
      <div
        className="grid text-xs"
        style={{ gridTemplateColumns: "48px repeat(6, 1fr)" }}
      >
        {/* Header row */}
        <div className="border-b border-line bg-muted h-8" />
        {DAYS.map((day, i) => (
          <div
            key={day}
            className={`border-b border-l border-line h-8 flex items-center justify-center font-medium ${
              i === 2 ? "bg-accentSoft text-accent" : "bg-muted text-inkMuted"
            }`}
          >
            {day}
          </div>
        ))}

        {/* Time rows */}
        {TIMES.flatMap((time, rowIdx) => [
          <div
            key={`t-${rowIdx}`}
            className={`border-b border-line px-2 py-2.5 text-right font-mono text-[10px] text-inkSubtle ${
              rowIdx % 2 === 0 ? "bg-white" : "bg-stone-50"
            }`}
          >
            {time}
          </div>,
          ...DAYS.map((_, colIdx) => {
            const lesson = LESSONS[`${colIdx}-${rowIdx}`];
            return (
              <div
                key={`c-${rowIdx}-${colIdx}`}
                className={`border-b border-l border-line p-1 min-h-[54px] ${
                  rowIdx % 2 === 0 ? "bg-white" : "bg-stone-50"
                }`}
              >
                {lesson && (
                  <div
                    className={`rounded border-l-2 px-2 py-1.5 h-full ${lesson.color} ${
                      lesson.isNow ? "ring-1 ring-accent" : ""
                    }`}
                  >
                    <div className="font-medium truncate leading-tight">{lesson.student}</div>
                    <div className="text-[10px] opacity-60">{lesson.instrument}</div>
                    {lesson.isNow && (
                      <div className="text-[10px] font-semibold text-accent mt-0.5">Now</div>
                    )}
                  </div>
                )}
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}
