import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-mono text-sm font-semibold text-ink">
            Cadence Admin
          </Link>
          <Link href="/dashboard" className="text-sm text-inkSubtle hover:text-ink">
            ← Back to app
          </Link>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-6">{children}</div>
    </div>
  );
}
