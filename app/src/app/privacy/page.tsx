import Link from "next/link";

export const metadata = { title: "Privacy Policy — Cadence" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: May 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">What we collect</h2>
          <p>We collect the information you give us directly: your name, email address, and studio details when you sign up. We also collect the data you enter into Cadence — students, lessons, invoices, and parent contact information — to provide the service.</p>
          <p className="mt-3">We collect usage data (pages visited, features used) to understand how to improve the product. We do not sell this data.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">How we use it</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To run the Cadence service and send you transactional emails (invoices, reminders, receipts)</li>
            <li>To process payments via Stripe (we never store card numbers)</li>
            <li>To send product updates — you can unsubscribe at any time</li>
            <li>To diagnose errors and improve reliability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Third-party services</h2>
          <p>Cadence uses the following third-party services, each with their own privacy policies:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Resend</strong> — transactional email delivery</li>
            <li><strong>Google</strong> — sign-in authentication</li>
            <li><strong>Vercel</strong> — hosting and infrastructure</li>
            <li><strong>Neon</strong> — database</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Data retention and deletion</h2>
          <p>You can export all your data (students, lessons, invoices) as CSV at any time from your dashboard. To delete your account and all associated data, email us at <a href="mailto:cole@cadence.app" className="text-brand-500 hover:underline">cole@cadence.app</a> and we will process it within 7 days.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Contact</h2>
          <p>Questions? Email <a href="mailto:cole@cadence.app" className="text-brand-500 hover:underline">cole@cadence.app</a>.</p>
        </section>
      </div>
    </main>
  );
}
