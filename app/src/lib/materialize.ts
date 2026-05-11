import { db } from "@/db";
import { lessons, lessonTemplates } from "@/db/schema";

type LessonTemplate = typeof lessonTemplates.$inferSelect;

export async function materializeLessons(template: LessonTemplate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const templateStart = new Date(template.startsOn);
  const start = templateStart > today ? templateStart : today;

  const end90 = new Date(today);
  end90.setDate(today.getDate() + 90);
  const endDate = template.endsOn
    ? new Date(Math.min(new Date(template.endsOn).getTime(), end90.getTime()))
    : end90;

  const interval = template.recurrence === "biweekly" ? 14 : 7;
  const hours = Math.floor(template.startTimeMinutes / 60);
  const minutes = template.startTimeMinutes % 60;

  const cursor = new Date(start);
  while (cursor.getDay() !== template.dayOfWeek) {
    cursor.setDate(cursor.getDate() + 1);
  }

  // For group templates, each occurrence (week) gets one shared lessonGroupId
  // so all per-student rows for that slot share the same group UUID.
  const toInsert = [];
  while (cursor <= endDate) {
    const startsAt = new Date(cursor);
    startsAt.setHours(hours, minutes, 0, 0);

    // Generate a deterministic group ID per occurrence within a group template.
    // We derive it from templateGroupId + week start so sibling templates produce the same UUID.
    // Simple approach: use a random UUID per occurrence, then write it to all sibling templates' rows.
    // Since templates run independently, we instead store templateGroupId on the lesson row
    // and the calendar groups by (lessonGroupId, startsAt). For materialization we assign
    // a new UUID per occurrence here; sibling templates' materializations will produce their own,
    // but they all share templateGroupId → calendar can look up group members by templateGroupId+startsAt.
    //
    // Simpler solution: use templateGroupId AS the lessonGroupId per occurrence + startsAt composite.
    // The calendar groups by (lessonGroupId, startsAt) which is unique per slot.
    toInsert.push({
      studioId: template.studioId,
      studentId: template.studentId,
      templateId: template.id,
      startsAt,
      durationMinutes: template.durationMinutes,
      rateCents: template.rateCents,
      // For group templates, reuse templateGroupId as lessonGroupId — the calendar
      // groups by (lessonGroupId, startsAt) which uniquely identifies the slot.
      lessonGroupId: template.templateGroupId ?? null,
    });

    cursor.setDate(cursor.getDate() + interval);
  }

  if (toInsert.length > 0) {
    await db.insert(lessons).values(toInsert);
  }

  return toInsert.length;
}
