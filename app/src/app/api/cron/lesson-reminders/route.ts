import { NextResponse } from "next/server";
import { db } from "@/db";
import { lessons, students, studentParents, parentContacts, studios } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { sendEmail, lessonReminderHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Find lessons starting between 22h and 26h from now (4h window around 24h out).
  const now = new Date();
  const windowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const upcoming = await db
    .select({
      lessonId: lessons.id,
      startsAt: lessons.startsAt,
      studioId: lessons.studioId,
      studentId: lessons.studentId,
      studentName: students.name,
      studioTimezone: studios.timezone,
    })
    .from(lessons)
    .innerJoin(students, eq(students.id, lessons.studentId))
    .innerJoin(studios, eq(studios.id, lessons.studioId))
    .where(
      and(
        eq(lessons.status, "scheduled"),
        gte(lessons.startsAt, windowStart),
        lt(lessons.startsAt, windowEnd),
      ),
    );

  let sent = 0;
  let failed = 0;

  for (const lesson of upcoming) {
    const parentLinks = await db
      .select({ parentId: studentParents.parentId, isPrimary: studentParents.isPrimary })
      .from(studentParents)
      .where(eq(studentParents.studentId, lesson.studentId));

    const primaryLink = parentLinks.find((p) => p.isPrimary) ?? parentLinks[0];
    if (!primaryLink) continue;

    const [parent] = await db
      .select({ email: parentContacts.email, name: parentContacts.name })
      .from(parentContacts)
      .where(eq(parentContacts.id, primaryLink.parentId))
      .limit(1);

    if (!parent?.email) continue;

    const whenLocal = new Date(lesson.startsAt).toLocaleString("en-US", {
      timeZone: lesson.studioTimezone,
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const ok = await sendEmail({
      to: parent.email,
      subject: `Reminder: ${lesson.studentName}'s lesson tomorrow`,
      html: lessonReminderHtml({ parentName: parent.name, studentName: lesson.studentName, whenLocal }),
      studioId: lesson.studioId,
      type: "lesson_reminder",
    });

    ok ? sent++ : failed++;
  }

  return NextResponse.json({ checked: upcoming.length, sent, failed });
}
