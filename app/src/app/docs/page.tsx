import Link from "next/link";

const ARTICLES = [
  { href: "/docs/getting-started", label: "Getting started", desc: "Add your first student and schedule your first lesson in under 10 minutes." },
  { href: "/docs/importing-students", label: "Importing students", desc: "Bring your existing roster over from a spreadsheet using CSV import." },
  { href: "/docs/recurring-lessons", label: "Recurring lessons", desc: "Set up weekly or biweekly slots that repeat automatically across the school year." },
  { href: "/docs/invoicing", label: "Invoicing", desc: "How automatic monthly invoicing works and how to send one-off invoices." },
  { href: "/docs/cancellations", label: "Cancellations & make-ups", desc: "Configure your cancellation policy and track make-up lessons per student." },
];

export default function DocsIndex() {
  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Help center</h1>
      <p className="text-slate-500 mb-8">Everything you need to get your studio running on Cadence.</p>
      <ul className="space-y-4 not-prose">
        {ARTICLES.map((a) => (
          <li key={a.href}>
            <Link href={a.href} className="block rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:bg-slate-50 transition-colors">
              <div className="font-semibold text-slate-900 mb-1">{a.label}</div>
              <div className="text-sm text-slate-500">{a.desc}</div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
