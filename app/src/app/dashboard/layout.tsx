import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden md:flex w-60 bg-surface border-r border-line flex-col fixed inset-y-0 z-10">
        <div className="px-4 py-5 border-b border-line">
          <div className="text-lg font-display tracking-tight text-ink">
            Cadence<span className="text-accent">.</span>
          </div>
          <div className="text-xs text-inkSubtle mt-0.5 truncate">{studio.name}</div>
        </div>

        <SidebarNav />

        <div className="px-4 py-4 border-t border-line">
          <div className="text-xs text-inkSubtle truncate mb-2">{session.user.email}</div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-inkSubtle hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 md:ml-60 pb-16 md:pb-0">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
