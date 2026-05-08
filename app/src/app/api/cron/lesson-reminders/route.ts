import { NextResponse } from "next/server";
import { runLessonReminders } from "@/lib/cron-lesson-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await runLessonReminders();
  return NextResponse.json(result);
}
