import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {/* Nav */}
      <nav className="flex items-center justify-between mb-20">
        <div className="text-xl font-semibold tracking-tight">
          Cadence<span className="text-brand-500">.</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Link href="#pricing" className="text-slate-600 hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-brand-500 px-3 py-1.5 text-white hover:bg-brand-600"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center mb-24">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-6">
          The studio software music teachers
          <br />
          <span className="text-brand-500">actually finish setting up.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          Cadence handles your recurring weekly lessons, monthly invoices, and parent
          reminders — without the spreadsheet, the missing payments, or the seven tabs
          you have open right now.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-brand-500 px-5 py-3 text-white font-medium hover:bg-brand-600"
          >
            Start free — up to 5 students
          </Link>
          <Link href="#how" className="text-slate-600 hover:text-slate-900 font-medium">
            See how it works ↓
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          No credit card required · Imports your spreadsheet in 2 minutes · Cancel anytime
        </p>
      </section>

      {/* Problem */}
      <section className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          You didn&apos;t become a music teacher to chase $40 invoices.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card
            title="Your invoices don't add up."
            body="Did Sarah pay for May? Was that make-up included? Existing tools (you know which ones) get this wrong every month."
          />
          <Card
            title="Recurring lessons should not be hard."
            body="Calendly can't handle 'every Tuesday at 4 with Jamie until June, except spring break.' Your students need exactly that."
          />
          <Card
            title="Parents need reminding."
            body="A 24-hour reminder cuts no-shows in half. You shouldn't have to text them yourself."
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Set up your studio in under 10 minutes.
        </h2>
        <ol className="space-y-6 max-w-2xl mx-auto">
          <Step
            n={1}
            title="Add your students."
            body="Paste from your spreadsheet — name, parent email, instrument, default rate. Done."
          />
          <Step
            n={2}
            title="Schedule recurring lessons."
            body='Click an empty slot. Pick the student. Pick "weekly" or "biweekly." Cadence handles the rest, including holidays.'
          />
          <Step
            n={3}
            title="Get paid on the 1st."
            body='Cadence emails parents a Stripe invoice for last month&apos;s lessons. They click → pay. You see "$1,840 collected this month" on your dashboard.'
          />
        </ol>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Pricing that scales with your studio.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <PriceCard
            name="Starter"
            price="$0"
            cadence="forever"
            features={[
              "Up to 5 students",
              "Calendar + lesson tracking",
              "Manual invoice export",
            ]}
            cta="Start free"
          />
          <PriceCard
            name="Solo"
            price="$19"
            cadence="per month"
            features={[
              "Up to 30 students",
              "Auto-invoicing via Stripe",
              "Family billing",
              "Lesson reminders",
              "Make-up tracking",
            ]}
            cta="Start 14-day trial"
            highlight
          />
          <PriceCard
            name="Studio"
            price="$39"
            cadence="per month"
            features={[
              "Unlimited students",
              "Auto-charge saved cards",
              "Group lessons",
              "Practice log",
              "Priority support",
            ]}
            cta="Start 14-day trial"
          />
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          All plans cancel anytime. Built and supported by a real human who replies to
          email within 24 hours.
        </p>
      </section>

      <footer className="text-center text-sm text-slate-500 pt-8 border-t">
        <p>© {new Date().getFullYear()} Cadence. Made for music teachers.</p>
      </footer>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-6 bg-slate-50">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500 text-white font-semibold flex items-center justify-center">
        {n}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-slate-600">{body}</p>
      </div>
    </li>
  );
}

function PriceCard({
  name,
  price,
  cadence,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-6 ${
        highlight ? "border-brand-500 ring-2 ring-brand-500/20" : "border-slate-200"
      }`}
    >
      <div className="font-semibold mb-2">{name}</div>
      <div className="mb-4">
        <span className="text-4xl font-bold">{price}</span>{" "}
        <span className="text-slate-500 text-sm">/ {cadence}</span>
      </div>
      <ul className="space-y-2 mb-6 text-sm text-slate-700">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-brand-500">✓</span> {f}
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`block text-center rounded-md py-2 font-medium ${
          highlight
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
