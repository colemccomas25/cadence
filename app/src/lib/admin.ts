import { auth } from "@/lib/auth";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<{ email: string; userId: string }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  const user = session!.user as { id?: string };
  return { email: email!, userId: user.id ?? "" };
}
