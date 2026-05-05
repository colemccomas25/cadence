import Link from "next/link";
import dynamic from "next/dynamic";

const PricingSection = dynamic(() =>
  import("@/components/pricing-section").then((m) => ({ default: m.PricingSection }))
);

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {/* Nav */}
      <nav className="flex items-center justify-between mb-20">
        <div className="text-xl font-semibold tracking-tight">
          Cadence<span className="text-brand-500">.</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <Link href="#pricing" className="hidden sm:block text-slate-600 hover:text-slate-900">Pricing</Link>
          <Link href="#faq" className="hidden sm:block text-slate-600 hover:text-slate-900">FAQ</Link>
          <Link href="/login" className="hidden sm:block text-slate-600 hover:text-slate-900">Log in</Link>
          <Link href="/login" className="rounded-md bg-cta px-3 py-2 text-white font-medium hover:opacity-90 transition-opacity min-h-[44px] flex items-center">
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center mb-24">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          Studio software for private music teachers.
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          Cadence handles your recurring weekly lessons, monthly invoices, and parent
          reminders — without the spreadsheet, the missing payments, or the seven tabs
          you have open right now.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-cta px-5 py-3 text-white font-medium hover:opacity-90 transition-opacity min-h-[48px] flex items-center"
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

        {/* Hero screenshot — replace with <Image> of your weekly calendar */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden aspect-[16/9] flex items-center justify-center text-slate-400 text-sm">
          Screenshot: weekly calendar with one lesson highlighted
        </div>

        {/* Loom demo — paste your video ID to activate */}
        {/*
        <div className="mt-8 rounded-2xl overflow-hidden aspect-video">
          <iframe
            src="https://www.loom.com/embed/YOUR_VIDEO_ID_HERE"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
        */}
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
            body="Cadence emails parents a Stripe invoice for last month's lessons. They click → pay. You see the total collected on your dashboard."
          />
        </ol>
      </section>

      {/* Features */}
      <section className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Built for music teachers, not &ldquo;lesson businesses.&rdquo;
        </h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            ["Family billing", "One invoice for two siblings, no math."],
            ["Recurring weekly slots", `Not "round robin" or "one-off booking."`],
            ["24h parent reminders", "Automated — you never send the text yourself."],
            ["Stripe-powered payments", "Fast, no merchant account, works in 40+ countries."],
            ["Spreadsheet import", "Bring your roster over in 2 minutes."],
            ["Cancellation policies", "Paid-cancel vs. free-cancel rules per student."],
            ["Group lessons", "Theory class, ensemble, summer camps. (Studio plan)"],
            ["Practice notes", "Quick log after each lesson, visible to parents. (Studio plan)"],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-3 bg-white rounded-lg border border-slate-200 p-4">
              <span className="text-brand-500 font-bold mt-0.5">✓</span>
              <div>
                <div className="font-medium text-slate-900 text-sm">{title}</div>
                <div className="text-slate-500 text-sm">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Founder note */}
      <section className="mb-24">
        <div className="max-w-2xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold mb-4">Why I built Cadence.</h2>
          <p className="text-slate-600 leading-relaxed">
            I built Cadence after watching a close family friend track 22 weekly piano students in a
            Google Sheet that broke every time the school year started. The existing tools all promised
            "studio management" and delivered software that needed studio management. Cadence does the
            small set of things you actually do every week, and does them well.
          </p>
          <p className="text-slate-500 text-sm mt-4">— Cole, founder</p>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <section id="faq" className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions.</h2>
        <div className="max-w-2xl mx-auto space-y-6">
          {[
            ["Can I import my students from a spreadsheet?",
              "Yes. Upload a CSV with name, parent email, instrument, and rate — Cadence handles the rest."],
            ["What happens if I have more than 5 students on the free plan?",
              "You won't be charged automatically. Your first 5 students stay active; extras are paused until you upgrade or archive someone."],
            ["Do you charge fees on payments?",
              "No. You pay Stripe's standard 2.9% + 30¢ directly — Cadence takes nothing on top. This is rare in our category."],
            ["Will you raise prices on me later?",
              "Your monthly price is locked for as long as you stay subscribed. Price changes only apply to new customers."],
            ["What about make-up lessons and cancellation policies?",
              "Cadence supports the most common rules: free 24h+ cancel, charge for late cancel, credit make-up to next invoice. You set the policy per student."],
            ["Can I get my data out?",
              "Always. Export students, lessons, and invoices to CSV at any time. No lock-in."],
          ].map(([q, a]) => (
            <div key={q as string} className="border-b border-slate-200 pb-6">
              <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mb-16 text-center bg-brand-500 rounded-2xl py-16 px-8">
        <h2 className="text-3xl font-bold text-white mb-4">Get your studio running this weekend.</h2>
        <p className="text-brand-100 mb-8">
          Setup takes 10 minutes. Cancel anytime. Built for one teacher running a real studio.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-white text-brand-600 font-semibold px-8 py-3 hover:bg-brand-50 transition-colors"
        >
          Start free — up to 5 students
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-slate-500 pt-8 border-t space-y-2">
        <div className="flex items-center justify-center gap-6">
          <Link href="#pricing" className="hover:text-slate-900">Pricing</Link>
          <Link href="#faq" className="hover:text-slate-900">FAQ</Link>
          <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-900">Terms</Link>
          <a href="mailto:cole@cadence.app" className="hover:text-slate-900">Contact</a>
        </div>
        <p>Built and supported by Cole. Reply to any email — that&apos;s me.</p>
        <p>© {new Date().getFullYear()} Cadence.</p>
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
