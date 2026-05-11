import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET() {
  return NextResponse.redirect(`${APP_URL}/parent-card-saved?cancelled=1`);
}
