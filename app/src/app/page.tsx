import Link from "next/link";
import dynamic from "next/dynamic";
import { Check } from "lucide-react";
import { NavBar } from "@/components/nav-bar";
import { HeroScreenshot } from "@/components/hero-screenshot";

const PricingSection = dynamic(() =>
  import("@/components/pricing-section").then((m) => ({ default: m.PricingSection }))
);

export default function HomePage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-16">

        {/* Hero */}
        <section className="text-center mb-24 pt-8">
          <h1 className="text-6xl md:text-7xl font-display tracking-tight leading-[1.05] text-ink mb-6">
            Studio software for private music teachers.
          </h1>
          <p className="text-lg md:text-xl text-inkMuted max-w-xl mx-auto mb-8 leading-relaxed">
            Cadence handles your recurring weekly lessons, monthly invoices, and parent
            reminders — without the spreadsheet, the missing payments, or the seven tabs
            you have open right now.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="rounded-sm bg-accent px-6 py-3 text-white font-medium hover:bg-accentHover transition-colors min-h-[48px] flex items-center"
            >
              Start free — up to 5 students
            </Link>
            <Link href="#how" className="text-sm text-inkSubtle hover:text-ink transition-colors">
              See how it works ↓
            </Link>
          </div>
          <p className="mt-4 text-sm text-inkSubtle">
            No credit card required · Imports your spreadsheet in 2 minutes · Cancel anytime
          </p>

          <HeroScreenshot />

          <p className="mt-5 text-sm text-inkSubtle">
            Built for the 130k+ private music teachers running studios out of their homes.
          </p>
        </section>

        {/* Problem */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-display tracking-tight text-center mb-12">
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
          <h2 className="text-3xl md:text-4xl font-display tracking-tight text-center mb-12">
            Set up your studio in under 10 minutes.
          </h2>
          <ol className="space-y-6 max-w-2xl mx-auto">
            <Step
              n="01"
              title="Add your students."
              body="Paste from your spreadsheet — name, parent email, instrument, default rate. Done."
            />
            <Step
              n="02"
              title="Schedule recurring lessons."
              body='Click an empty slot. Pick the student. Pick "weekly" or "biweekly." Cadence handles the rest, including holidays.'
            />
            <Step
              n="03"
              title="Get paid on the 1st."
              body="Cadence emails parents a Stripe invoice for last month's lessons. They click → pay. You see the total collected on your dashboard."
            />
          </ol>
        </section>

        {/* Features */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-display tracking-tight text-center mb-12">
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
            ].map(([title, desc]) => (
              <div
                key={title}
                className="flex gap-3 bg-surface rounded-lg border border-line p-4 hover:bg-muted transition-colors"
              >
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-ink text-sm">{title}</div>
                  <div className="text-inkMuted text-sm">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Founder note */}
        <section className="mb-24">
          <div className="max-w-2xl mx-auto bg-muted rounded-xl border border-line p-8">
            <blockquote className="text-2xl font-display leading-snug text-ink mb-4">
              &ldquo;I built Cadence after watching a close family friend track 22 weekly piano
              students in a Google Sheet that broke every time the school year started.&rdquo;
            </blockquote>
            <p className="text-inkMuted leading-relaxed text-sm">
              The existing tools all promised &ldquo;studio management&rdquo; and delivered software
              that needed studio management. Cadence does the small set of things you actually do
              every week, and does them well.
            </p>
            <p className="text-sm text-inkSubtle mt-4">— Cole, founder</p>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <section id="faq" className="mb-24">
          <h2 className="text-3xl md:text-4xl font-display tracking-tight text-center mb-12">
            Frequently asked questions.
          </h2>
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
              <div key={q as string} className="border-b border-line pb-6">
                <h3 className="font-medium text-ink mb-2">{q}</h3>
                <p className="text-inkMuted text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-16 text-center bg-muted rounded-xl py-16 px-8 border border-line">
          <div className="text-2xl font-display text-accent mb-6 tracking-tight">Cadence.</div>
          <h2 className="text-3xl md:text-4xl font-display tracking-tight text-ink mb-4">
            Get your studio running this weekend.
          </h2>
          <p className="text-inkMuted mb-8 max-w-md mx-auto">
            Setup takes 10 minutes. Cancel anytime. Built for one teacher running a real studio.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-sm bg-accent text-white font-semibold px-8 py-3 hover:bg-accentHover transition-colors"
          >
            Start free — up to 5 students
          </Link>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-inkSubtle pt-8 border-t border-line space-y-2">
          <div className="flex items-center justify-center gap-6">
            <Link href="#pricing" className="hover:text-ink transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-ink transition-colors">FAQ</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <a href="mailto:cole@cadence.app" className="hover:text-ink transition-colors">Contact</a>
          </div>
          <p>Built and supported by Cole. Reply to any email — that&apos;s me.</p>
          <p>© {new Date().getFullYear()} Cadence.</p>
        </footer>
      </main>
    </>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-line p-6 bg-surface">
      <h3 className="font-medium text-base mb-2 text-ink">{title}</h3>
      <p className="text-inkMuted text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 font-mono text-accent text-sm tracking-wider pt-0.5">
        {n} /
      </div>
      <div>
        <h3 className="font-medium mb-1 text-ink">{title}</h3>
        <p className="text-inkMuted">{body}</p>
      </div>
    </li>
  );
}
