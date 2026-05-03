import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { SidebarNav } from "@/components/sidebar-nav";

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
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-52 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10">
        <div className="px-4 py-5 border-b border-slate-100">
          <div className="text-lg font-semibold tracking-tight">
            Cadence<span className="text-brand-500">.</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">{studio.name}</div>
        </div>

        <SidebarNav />

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 truncate mb-2">{session.user.email}</div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 ml-52">{children}</main>
    </div>
  );
}
