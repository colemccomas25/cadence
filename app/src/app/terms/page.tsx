import Link from "next/link";

export const metadata = { title: "Terms of Service — Cadence" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: May 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Acceptance</h2>
          <p>By using Cadence, you agree to these terms. If you do not agree, do not use the service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">2. What Cadence is</h2>
          <p>Cadence is a scheduling and billing tool for private music teachers. It is not a financial advisor, attorney, or payment processor. Payments are processed by Stripe, Inc. under their terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Your account</h2>
          <p>You are responsible for keeping your login credentials secure and for all activity under your account. You must be at least 18 years old to use Cadence.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Subscriptions and billing</h2>
          <p>Paid plans are billed monthly. Your price is locked for as long as you remain subscribed. You may cancel at any time; cancellation takes effect at the end of the current billing period. No refunds are issued for partial months.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Your data</h2>
          <p>You own your data. We do not sell it. You can export it at any time and request deletion by emailing us. See our Privacy Policy for details.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Acceptable use</h2>
          <p>You agree not to use Cadence for any illegal purpose, to spam parents, or to attempt to circumvent the student limits of your plan.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Limitation of liability</h2>
          <p>Cadence is provided "as is." We are not liable for missed payments, scheduling errors, or data loss beyond what's recoverable from our backups. Our total liability is limited to the amount you paid us in the last 3 months.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Changes</h2>
          <p>We may update these terms. We will notify you by email at least 14 days before material changes take effect. Continued use after that date constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Contact</h2>
          <p>Questions? Email <a href="mailto:cole@cadence.app" className="text-brand-500 hover:underline">cole@cadence.app</a>.</p>
        </section>
      </div>
    </main>
  );
}
