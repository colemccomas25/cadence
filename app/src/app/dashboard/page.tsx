import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">
          Cadence<span className="text-brand-500">.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{session.user?.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Welcome, {session.user?.name ?? session.user?.email}
        </h1>
        <p className="text-slate-500">
          Your dashboard is coming in Week 2. Students, lessons, and invoices will live here.
        </p>
      </div>
    </main>
  );
}
