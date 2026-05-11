# 17 — Practice log

A weekly practice tracker. Students (or their parents) log how many minutes
they practiced each day plus a short note. Teachers see a heat-map style view
per student; parents see their own kids' history. Studio-tier only.

This is the third piece of **Task #5**. It depends on the parent portal
(#16) for the parent-side submission UI, but the teacher-side review is
fully usable on its own.

---

## What you're building

1. A `practice_logs` table — one row per (student, date).
2. Submission UI on the parent portal: a current-week grid where a parent
   enters minutes + note per day.
3. Teacher-side view at `/dashboard/students/[id]` showing a 12-week heatmap
   of practice activity for that student.
4. Plan gating: hidden + endpoint-blocked unless `studio.plan === "studio"`.
5. A nudge: students at zero minutes for 5+ days get a small reminder email
   (gated, optional; can be cut for v1).

No new dependencies. ~5 files, 1 migration.

---

## Schema

```ts
export const practiceLogs = pgTable(
  "practice_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studioId: uuid("studio_id").notNull().references(() => studios.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
    minutes: integer("minutes").notNull(), // 0-600 enforced at app level
    note: text("note"),                    // optional, parent/student-supplied
    submittedByEmail: text("submitted_by_email"), // parent email or null if teacher entered
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    studentDateIdx: uniqueIndex("practice_logs_student_date_idx").on(t.studentId, t.date),
  }),
);
```

The unique index on `(studentId, date)` ensures one row per day per student;
upserts on submission overwrite the previous value.

Migration name: `add_practice_logs`.

---

## Server actions

`src/actions/practice-log.ts`:

```ts
"use server";
import { db } from "@/db";
import { practiceLogs, parentContacts, studentParents, studios } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { canUseFeature } from "@/lib/plan";
import { getCurrentParentEmail } from "@/lib/parent-auth";

const MAX_MINUTES_PER_DAY = 600;

export async function submitPracticeLog(input: {
  studentId: string;
  date: string; // ISO date string, e.g. "2026-05-07"
  minutes: number;
  note?: string;
}) {
  const email = await getCurrentParentEmail();
  if (!email) return { success: false as const, error: "Not signed in" };

  const minutes = Math.max(0, Math.min(MAX_MINUTES_PER_DAY, Math.round(input.minutes)));
  const note = (input.note ?? "").trim().slice(0, 500) || null;
  const date = new Date(input.date);
  date.setUTCHours(0, 0, 0, 0);

  // Authorize: parent must be linked to this student, and student's studio
  // must be on the Studio plan.
  const [link] = await db
    .select({ studioId: studios.id, plan: studios.plan })
    .from(studentParents)
    .innerJoin(parentContacts, eq(parentContacts.id, studentParents.parentId))
    .innerJoin(studios, eq(studios.id, parentContacts.studioId))
    .where(and(eq(studentParents.studentId, input.studentId), eq(parentContacts.email, email)))
    .limit(1);

  if (!link) return { success: false as const, error: "Not authorized" };
  if (!canUseFeature({ plan: link.plan }, "practice_log")) {
    return { success: false as const, error: "Practice log requires the Studio plan." };
  }

  await db
    .insert(practiceLogs)
    .values({
      studioId: link.studioId,
      studentId: input.studentId,
      date,
      minutes,
      note,
      submittedByEmail: email,
    })
    .onConflictDoUpdate({
      target: [practiceLogs.studentId, practiceLogs.date],
      set: { minutes, note, submittedByEmail: email, updatedAt: new Date() },
    });

  return { success: true as const };
}
```

Teacher entry can use the same action with a different auth path (or add a
sibling action `teacherSubmitPracticeLog` that uses teacher session + a
studio ownership check).

---

## Parent UI

`src/app/portal/practice/page.tsx`:

- For each student linked to the current parent's email and on a Studio-tier
  studio, render a card with:
  - Student name + instrument
  - Current week (Mon-Sun) as 7 input cells, each with a number input
    (0-600) and a tiny note field on hover/click.
  - Total for the week underneath.
  - "Save" button (or autosave on blur — pick autosave; nicer UX).
- Below current week: a 12-week historical strip, read-only, showing
  total minutes per week.

Hide the page entirely if no linked student is on a Studio plan. Show a
single message: "Your teacher needs to upgrade to the Studio plan to enable
practice logging."

`src/app/portal/practice/[studentId]/page.tsx`: detailed view of one
student's full history (12+ weeks back), still parent-scoped to ensure
they only see their own kids.

---

## Teacher UI

In `src/app/dashboard/students/[id]/page.tsx`, add a section below the
existing student details:

- 12-week heatmap: 12 rows (weeks) × 7 cols (days). Cell color intensity
  scales with minutes: 0 = `bg-muted`, 1-15 = `bg-accentSoft`, 16-30 = a
  brighter shade, 31-60 = brighter, 60+ = brightest. Pick four shades.
- Hovering a cell shows date + minutes + note.
- Total this week and a 4-week trend (up/down arrow + percentage change).
- A small "Add log entry" affordance if the teacher wants to record on
  the parent's behalf.

Hide the entire section if `canUseFeature(studio, "practice_log")` is
false. Show a small upsell card pointing to `/dashboard/upgrade` when on
Solo.

---

## Optional reminder cron

A nudge email when a student has zero minutes for 5+ consecutive days.
Skip for v1 unless the rest of the work goes faster than expected.

If you build it, add `src/app/api/cron/practice-reminders/route.ts` that
queries for students with no `practice_logs` rows in the last 5 days and
sends an email to their primary parent. Gate on `studio.plan === "studio"`.

---

## QA checklist

1. As a parent linked to a student in a Studio-tier studio, visit
   `/portal/practice` → see the current-week grid.
2. Enter minutes for Monday → autosaves → DB row appears.
3. Refresh → minutes still showing.
4. Edit Monday's value → DB row updates (no duplicate row created).
5. Try to submit 9999 minutes → server clamps to 600.
6. As a parent, log into a different parent's account (after manual session
   tampering) and try to submit → action returns "Not authorized".
7. As a parent linked to a student in a Solo-tier studio: practice log
   page shows the upsell message, no input grid.
8. Switch the studio to Studio-tier via admin tool → page now shows the
   input grid.
9. As a teacher, visit `/dashboard/students/[id]` → see the 12-week
   heatmap with the data the parent just entered.
10. Trend indicator updates correctly as more weeks accrue data.
11. Switch studio back to Solo → heatmap hidden, upsell card visible.
12. Run `npm run typecheck`, `npm run lint`, `npm run build` — clean.

---

## Constraints

- Cap minutes at 600/day (10 hours). No teacher cares about the
  difference between 700 and 9999.
- Note field is 500 chars max. Truncate server-side, not just client-side.
- One row per (student, date). Upsert; don't accumulate duplicates.
- `submittedByEmail` is informational only. Don't make the auth depend
  on it after the fact.
- Don't expose practice_logs to other parents in the same studio. Scope
  by `studentParents` join to the current parent email.
- Don't allow practice_log entries dated more than 60 days in the past
  (clamp at server). Backfill is not a feature.
- Don't allow future-dated entries.

---

## The prompt to paste into Claude Code

```
I'm building the practice log feature (Task #5c of the pre-launch
sequence). The complete spec is in ../docs/17-week12-practice-log.md.
Read it end-to-end first.

This depends on the parent portal (Task #5b) for the parent-side
submission UI. Confirm /portal exists and getCurrentParentEmail() is
wired up before starting on the parent UI.

Implement in this order:
1. Schema: practice_logs table. Generate migration. Show me SQL.
2. Server actions: src/actions/practice-log.ts (submitPracticeLog plus
   teacherSubmitPracticeLog).
3. Parent UI: src/app/portal/practice/page.tsx and a per-student detail
   route. Autosave on blur. Hide the entire feature when no linked
   student is on a Studio-tier studio.
4. Teacher UI: add the 12-week heatmap section to
   src/app/dashboard/students/[id]/page.tsx. Gate by canUseFeature(
   studio, "practice_log").
5. (Optional) Reminder cron: only if the rest fits in budget.
6. Run typecheck, lint, build. Walk me through the QA checklist.

After step 1, pause for migration review.

Constraints: see spec. 600-minute cap. 500-char note cap. Upsert per
(student, date). No backfill beyond 60 days. No future dates.

Start by reading the spec, then plan step 1.
```

---

## Why this is structured this way

- **One row per (student, date)** with upsert, not append-only — parents
  who edit yesterday's entry shouldn't create accidental duplicates.
- **Autosave on blur** — practice log is a low-stakes, high-frequency
  interaction. Buttons and toasts kill the flow.
- **Heatmap, not bar chart** — the question teachers actually ask is "is
  this student practicing consistently?", not "how many minutes total?"
  A heatmap answers consistency at a glance.
- **`submittedByEmail` recorded but not enforced** — useful for "did
  Mom or Dad enter this?" later, but not the source of truth for
  authorization (which is via `studentParents`).
- **No cancel / no draft state** — every save is final. If the parent
  wants to change a value, they re-enter it.

---

## After this is done

Next phase-2 piece: **Group lessons** (#18), the last and most invasive
piece.
