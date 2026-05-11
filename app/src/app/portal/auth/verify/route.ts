import { NextResponse } from "next/server";
import { consumeMagicLink, startSession } from "@/lib/parent-auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/portal/login?error=missing", req.url));
  const email = await consumeMagicLink(token);
  if (!email) return NextResponse.redirect(new URL("/portal/login?error=expired", req.url));
  await startSession(email);
  return NextResponse.redirect(new URL("/portal", req.url));
}
