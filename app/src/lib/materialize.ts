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

  // Walk forward from start until we land on the right day of week
  const cursor = new Date(start);
  while (cursor.getDay() !== template.dayOfWeek) {
    cursor.setDate(cursor.getDate() + 1);
  }

  const toInsert = [];
  while (cursor <= endDate) {
    const startsAt = new Date(cursor);
    startsAt.setHours(hours, minutes, 0, 0);

    toInsert.push({
      studioId: template.studioId,
      studentId: template.studentId,
      templateId: template.id,
      startsAt,
      durationMinutes: template.durationMinutes,
      rateCents: template.rateCents,
    });

    cursor.setDate(cursor.getDate() + interval);
  }

  if (toInsert.length > 0) {
    await db.insert(lessons).values(toInsert);
  }

  return toInsert.length;
}
