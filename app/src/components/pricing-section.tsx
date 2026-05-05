"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    priceKey: null,
    monthly: 0,
    annualPerMonth: 0,
    annualTotal: 0,
    cadenceLabel: "forever",
    features: ["Up to 5 students", "Calendar + lesson tracking", "Manual invoice export"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Solo",
    priceKey: "solo",
    monthly: 19,
    annualPerMonth: 15.83,
    annualTotal: 190,
    cadenceLabel: "per month",
    features: [
      "Up to 30 students",
      "Auto-invoicing via Stripe",
      "Family billing",
      "24h parent reminders",
      "Make-up tracking",
    ],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Studio",
    priceKey: "studio",
    monthly: 39,
    annualPerMonth: 32.42,
    annualTotal: 389,
    cadenceLabel: "per month",
    features: [
      "Unlimited students",
      "Auto-charge saved cards",
      "Group lessons",
      "Practice log",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    highlight: false,
  },
];

const COMPARISON: { feature: string; starter: boolean | string; solo: boolean | string; studio: boolean | string }[] = [
  { feature: "Students",            starter: "5",         solo: "30",        studio: "Unlimited" },
  { feature: "Calendar & tracking", starter: true,        solo: true,        studio: true },
  { feature: "Manual invoice CSV",  starter: true,        solo: true,        studio: true },
  { feature: "Auto-invoicing",      starter: false,       solo: true,        studio: true },
  { feature: "Family billing",      starter: false,       solo: true,        studio: true },
  { feature: "Parent reminders",    starter: false,       solo: true,        studio: true },
  { feature: "Make-up tracking",    starter: false,       solo: true,        studio: true },
  { feature: "Auto-charge cards",   starter: false,       solo: false,       studio: true },
  { feature: "Group lessons",       starter: false,       solo: false,       studio: true },
  { feature: "Practice log",        starter: false,       solo: false,       studio: true },
  { feature: "Priority support",    starter: false,       solo: false,       studio: true },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your settings page at any moment. You keep full access until the end of your billing period — no proration, no penalty.",
  },
  {
    q: "What's your refund policy?",
    a: "If you're not happy in the first 30 days, email me and I'll refund you in full. No questions asked, by reply email.",
  },
  {
    q: "Will you raise prices on me?",
    a: "Your price is locked for as long as you stay subscribed. Price increases only ever apply to new customers.",
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-green-600 font-semibold">✓</span>;
  if (value === false) return <span className="text-slate-300">—</span>;
  return <span className="text-slate-700 font-medium">{value}</span>;
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="mb-24">
      <h2 className="text-3xl font-bold text-center mb-6">
        Pricing that scales with your studio.
      </h2>

      {/* Annual toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!annual ? "text-slate-900" : "text-slate-400"}`}>Monthly</span>
        <button
          onClick={() => setAnnual((v) => !v)}
          aria-label="Toggle billing period"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${annual ? "bg-brand-500" : "bg-slate-200"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-slate-900" : "text-slate-400"}`}>
          Annual{" "}
          <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Save 17%
          </span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan) => {
          const price = plan.monthly === 0
            ? "$0"
            : annual
              ? `$${plan.annualPerMonth.toFixed(2)}`
              : `$${plan.monthly}`;
          const sub = plan.monthly === 0
            ? "forever"
            : annual
              ? `per month · $${plan.annualTotal} billed annually`
              : "per month";
          const cadence = annual ? "yearly" : "monthly";
          const href = plan.priceKey
            ? `/login?callbackUrl=${encodeURIComponent(`/api/stripe/checkout/subscription?price=${plan.priceKey}_${cadence}`)}`
            : "/login";

          return (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlight
                  ? "border-cta ring-2 ring-orange-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900">{plan.name}</span>
                {plan.highlight && (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-cta border border-orange-200">
                    Most popular
                  </span>
                )}
              </div>

              <div className="mb-1">
                <span className="text-4xl font-bold text-slate-900">{price}</span>
                {plan.monthly > 0 && <span className="text-slate-500 text-sm ml-1">/mo</span>}
              </div>
              <p className="text-xs text-slate-400 mb-5">{sub}</p>

              <ul className="space-y-2 mb-6 text-sm text-slate-700 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className={plan.highlight ? "text-cta" : "text-brand-500"}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`block text-center rounded-md py-2.5 font-medium min-h-[44px] flex items-center justify-center transition-opacity ${
                  plan.highlight
                    ? "bg-cta text-white hover:opacity-90"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 mb-12">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-1/2">Feature</th>
              <th className="px-4 py-3 text-center font-medium text-slate-500">Starter</th>
              <th className="px-4 py-3 text-center font-medium text-cta">Solo</th>
              <th className="px-4 py-3 text-center font-medium text-slate-500">Studio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COMPARISON.map((row) => (
              <tr key={row.feature} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{row.feature}</td>
                <td className="px-4 py-3 text-center"><Cell value={row.starter} /></td>
                <td className="px-4 py-3 text-center"><Cell value={row.solo} /></td>
                <td className="px-4 py-3 text-center"><Cell value={row.studio} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pricing FAQs */}
      <div className="max-w-2xl mx-auto space-y-6">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="border-b border-slate-200 pb-6">
            <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
