import Link from "next/link";

const ARTICLES = [
  { href: "/docs/getting-started", label: "Getting started" },
  { href: "/docs/importing-students", label: "Importing students" },
  { href: "/docs/recurring-lessons", label: "Recurring lessons" },
  { href: "/docs/invoicing", label: "Invoicing" },
  { href: "/docs/cancellations", label: "Cancellations" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center gap-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Cadence<span className="text-brand-500">.</span>
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500">Help</span>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12 flex gap-12">
        <aside className="hidden md:block w-48 shrink-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Articles</p>
          <ul className="space-y-1">
            {ARTICLES.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="block text-sm text-slate-600 hover:text-slate-900 py-1"
                >
                  {a.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 min-w-0 prose prose-slate max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
