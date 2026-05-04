"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateLessonStatus } from "@/actions/lessons";

type Status =
  | "scheduled"
  | "held"
  | "cancelled_by_teacher"
  | "cancelled_by_student_paid"
  | "cancelled_by_student_unpaid"
  | "make_up_scheduled";

export function StatusControls({
  lessonId,
  status,
}: {
  lessonId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const s = status as Status;

  const update = (next: Parameters<typeof updateLessonStatus>[1], label: string) => {
    startTransition(async () => {
      await updateLessonStatus(lessonId, next);
      toast.success(label);
    });
  };

  return (
    <div className="flex gap-1.5 mt-2 flex-wrap">
      {s !== "held" && (
        <button
          disabled={isPending}
          onClick={() => update("held", "Lesson marked as held")}
          className="text-xs px-2 py-1.5 min-h-[32px] rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
        >
          Mark held
        </button>
      )}
      {s !== "cancelled_by_teacher" && s !== "held" && (
        <button
          disabled={isPending}
          onClick={() => update("cancelled_by_teacher", "Lesson cancelled")}
          className="text-xs px-2 py-1.5 min-h-[32px] rounded bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
        >
          Cancel
        </button>
      )}
      {s !== "cancelled_by_student_unpaid" && s !== "held" && (
        <button
          disabled={isPending}
          onClick={() => update("cancelled_by_student_unpaid", "Marked as student cancellation")}
          className="text-xs px-2 py-1.5 min-h-[32px] rounded bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
        >
          Student cancelled
        </button>
      )}
      {s !== "scheduled" && (
        <button
          disabled={isPending}
          onClick={() => update("scheduled", "Lesson reset to scheduled")}
          className="text-xs px-2 py-1.5 min-h-[32px] rounded bg-blue-50 text-blue-500 hover:bg-blue-100 disabled:opacity-50"
        >
          Reset
        </button>
      )}
    </div>
  );
}
