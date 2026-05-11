# 18 — Group lessons

A single lesson slot with multiple students attending, billed individually.
Studio teachers running ensembles, theory classes, or beginner-pair lessons
need this. Studio-tier only.

This is the fourth and final piece of **Task #5**. It's the most invasive
because it changes the lesson model — and through it, the calendar, invoice
generation, and lesson-status flows.

---

## What you're building

1. A schema change: lessons can now have multiple students. Either via a
   join table OR by reusing the existing `lessons` table with one row per
   student per slot, linked by a `groupId`.
2. Group-template support: recurring weekly slots that materialize one row
   per student per occurrence.
3. UI: a new "Group lesson" creation flow on the calendar. Multi-select
   students; pick a per-student rate (or a flat rate split across them).
4. Calendar rendering: collapse same-time same-place rows into a single
   visual slot.
5. Invoice generation: each student's parent gets billed for their share,
   exactly as today's per-student logic already does.
6. Plan gating: hidden + endpoint-blocked unless `studio.plan === "studio"`.

No new dependencies. ~6 files, 1 migration.

---

## Data model decision

**Use one `lessons` row per student per slot, linked by `lessonGroupId`.**
This is the change that ripples least.

Alternative: a `lesson_attendees` join table with one `lesson` row and
many attendees. That's cleaner conceptually but it forces every existing
query — calendar, invoice, status — to JOIN through a new table.

The "row per student" approach:
- All existing queries (`SELECT * FROM lessons WHERE studioId = ...`)
  keep working.
- Status (held / cancelled / makeup) is per-student naturally — important
  because in a group of 3, two might attend and one might cancel.
- Rendering "this is a group" requires a JOIN by `lessonGroupId` only on
  the calendar UI, not in invoicing.

### Schema change

Add to `lessons`:

```ts
lessonGroupId: uuid("lesson_group_id"), // null for solo lessons
```

Index it: `index("lessons_group_idx").on(t.lessonGroupId)`.

Add to `lesson_templates`:

```ts
templateGroupId: uuid("template_group_id"), // null for solo templates
```

Both are simple nullable UUIDs. Generated when a group lesson/template is
created; shared by all rows in that group.

Migration name: `add_lesson_groups`.

---

## Group-creation flow

`/dashboard/calendar/group/new` (new page) — wizard:

1. Pick recurrence: one-off or weekly recurring (re-uses the existing
   recurring template logic).
2. Pick day/time/duration. Same fields as the solo lesson form.
3. Multi-select students (use a checkbox list, not a single dropdown).
   Optionally allow new-student-on-the-fly creation.
4. Per-student rate: default each student's `defaultRateCents`, allow
   override. Show the group total at the bottom.
5. "Create group lesson" submits.

Server action `createGroupLesson(input)`:

- Validates: at least 2 students, all belong to this studio, plan
  allows group lessons.
- For one-off: insert one `lessons` row per student with the same
  `lessonGroupId`, `startsAt`, `durationMinutes`. Each row has its own
  `rateCents` and `studentId`.
- For recurring: insert one `lesson_templates` row per student with the
  same `templateGroupId`, then materialize concrete lessons via the
  existing `materialize.ts` logic — but tag each materialized lesson with
  the group's `lessonGroupId`. (Easiest: when materializing from a
  template that has a `templateGroupId`, write the same UUID to
  `lessonGroupId` on the resulting lessons. Reuse the same UUID across
  the whole group + week.)

Materialization needs careful handling: today's `materialize.ts` runs
per-template. With group templates, run as before — each per-student
template independently materializes its rows. The shared `templateGroupId`
becomes the shared `lessonGroupId` on the produced lessons via a small
join + write.

---

## Calendar rendering

In `src/app/dashboard/calendar/page.tsx`:

- After fetching lessons, group them by `(lessonGroupId, startsAt)`. If a
  group has 2+ rows, render one combined block: "Theory class — 4
  students" with a subtitle listing the names.
- Solo lessons (where `lessonGroupId` is null) render as today.
- Clicking a group block opens an edit page that lets the teacher add /
  remove students from this occurrence (just inserts/deletes rows in
  `lessons`, not the template).

For status tracking: each student's status is independent — you can mark
one student "held" and another "cancelled by student" within the same
group lesson. Use a per-student status row in the edit UI.

---

## Invoice generation

No change required. Today's invoice logic already iterates per-student
held lessons. Each row in a group is its own student-billing event.

Edge case: a parent paying for two students who are both in the same
group lesson — they get one invoice with both line items, exactly as
they would for solo lessons. The existing parent-rollup logic handles it.

---

## Plan gating

In every action that creates or edits group lessons, call
`canUseFeature(studio, "group_lessons")`. Return an error if false.

Hide the "Group lesson" button on `/dashboard/calendar` for non-Studio
plans. Show a small "Studio plan" badge next to it.

---

## QA checklist

1. As a Studio-tier teacher, click "New group lesson" on the calendar.
2. Pick 3 students, set a one-off Sunday 3pm 60-minute slot at $25/each.
3. Submit → 3 rows created in `lessons`, all sharing one
   `lessonGroupId`.
4. Calendar shows one combined block with all 3 names.
5. Click into the block → mark student A held, student B cancelled,
   student C held. Each row's status updates independently.
6. Run invoice generation cron → student A's parent + student C's parent
   billed for $25 each. Student B's parent: nothing (or whatever the
   cancel-policy logic does today).
7. Create a recurring weekly group: 3 students, Tuesdays 5pm, $30 each
   for 4 weeks → 12 rows in `lessons` after materialization, all 3
   per-week sharing a `lessonGroupId`, but different week's groups have
   different IDs.
8. As a Solo-tier teacher: "New group lesson" button is hidden.
   Manually visit `/dashboard/calendar/group/new` → bounced to upgrade.
9. As a Studio-tier teacher: try to add a student who belongs to a
   different studio → action rejects.
10. Run `npm run typecheck`, `npm run lint`, `npm run build` — clean.

---

## Constraints

- Use one row per student per slot, linked by `lessonGroupId`. Don't
  introduce an attendees join table.
- Per-student rate, not flat-then-split. Different students legitimately
  have different rates in the same group (e.g., a more advanced student
  who used to take solos at a higher rate).
- Status is per-student. Never collapse "held" / "cancelled" to a single
  group status.
- A group lesson with only 1 student remaining (others archived /
  removed) is still a valid lesson — it just renders as a solo from the
  calendar's perspective. Don't auto-delete the lessonGroupId when only
  one student remains.
- Don't try to support changing a solo lesson into a group lesson via
  edit. Cancel the solo, create a group. Less code, fewer foot-guns.

---

## The prompt to paste into Claude Code

```
I'm building group lessons (Task #5d of the pre-launch sequence). The
complete spec is in ../docs/18-week13-group-lessons.md. Read it
end-to-end first.

Implement in this order:
1. Schema: add lessonGroupId to lessons and templateGroupId to
   lesson_templates. Add the lessons.group_idx index. Generate migration.
2. Materialization: edit src/lib/materialize.ts so when a template has
   templateGroupId set, the resulting lessons share a single lessonGroupId
   (one UUID per occurrence, shared across all per-student rows for that
   week).
3. Server actions: createGroupLesson (one-off + recurring) in
   src/actions/groups.ts. addStudentToGroupLesson and
   removeStudentFromGroupLesson for single-occurrence edits.
4. Group-creation page: src/app/dashboard/calendar/group/new/page.tsx
   with the wizard. Multi-select students, per-student rate.
5. Calendar updates: in src/app/dashboard/calendar/page.tsx, group rows
   by (lessonGroupId, startsAt) and render one block per group.
6. Group-edit page: a per-occurrence edit view at
   src/app/dashboard/calendar/group/[lessonGroupId]/[date]/page.tsx
   showing each student's status row.
7. Plan gate: hide / 403 if canUseFeature(studio, "group_lessons") is
   false.
8. Run typecheck, lint, build. Walk me through the QA checklist.

After step 1, pause for migration review. After step 2, walk me
through how a recurring group materializes — I want to confirm the
shared-UUID-per-week behavior before testing.

Constraints: see spec. Row-per-student. Per-student rate. Per-student
status.

Start by reading the spec, then plan step 1.
```

---

## Why this is structured this way

- **Row-per-student over attendees join table** — every existing query
  about lessons keeps working unchanged. The trade-off is one
  `GROUP BY lessonGroupId` in the calendar render and nowhere else.
- **Per-student rate** — group lessons in private music studios are
  almost never one-flat-rate. Older students charge more; family
  discounts vary; some teachers waive fees for sibling pairs.
- **No "convert solo to group" flow** — the conversion is rare, the
  edge cases are nasty (in-flight invoices, materialized recurring
  rows). Better to cancel + recreate.
- **Group lesson with one remaining student is still valid** — sibling
  pairs split up, students leave mid-semester, etc. Force-deleting the
  groupId would lose history.

---

## After this is done

All four phase-2 features are shipped: auto-charge, parent portal,
practice log, group lessons. Combined with #1-#4, you have a complete
pre-launch product. Only **Task #6** (full QA pass) remains before
marketing.
