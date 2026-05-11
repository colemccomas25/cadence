import { getCurrentParentEmail } from "@/lib/parent-auth";
import { redirect } from "next/navigation";
import { logoutParent } from "@/actions/parent-auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const email = await getCurrentParentEmail();
  if (!email) redirect("/portal/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-display text-sm tracking-tight text-ink">
            Cadence<span className="text-accent">.</span>
            <span className="text-inkSubtle font-normal ml-2">Parent portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-inkSubtle hidden sm:block">{email}</span>
            <form action={logoutParent}>
              <button type="submit" className="text-xs text-inkSubtle hover:text-ink transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
