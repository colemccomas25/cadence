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
  { feature: "Students",            starter: "5",   solo: "30",  studio: "Unlimited" },
  { feature: "Calendar & tracking", starter: true,  solo: true,  studio: true },
  { feature: "Manual invoice CSV",  starter: true,  solo: true,  studio: true },
  { feature: "Auto-invoicing",      starter: false, solo: true,  studio: true },
  { feature: "Family billing",      starter: false, solo: true,  studio: true },
  { feature: "Parent reminders",    starter: false, solo: true,  studio: true },
  { feature: "Make-up tracking",    starter: false, solo: true,  studio: true },
  { feature: "Auto-charge cards",   starter: false, solo: false, studio: true },
  { feature: "Group lessons",       starter: false, solo: false, studio: true },
  { feature: "Practice log",        starter: false, solo: false, studio: true },
  { feature: "Priority support",    starter: false, solo: false, studio: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-accent font-semibold">✓</span>;
  if (value === false) return <span className="text-inkSubtle">—</span>;
  return <span className="text-ink font-medium">{value}</span>;
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="mb-24">
      <h2 className="text-3xl md:text-4xl font-display tracking-tight text-center mb-6">
        Pricing that scales with your studio.
      </h2>

      {/* Annual toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!annual ? "text-ink" : "text-inkSubtle"}`}>Monthly</span>
        <button
          onClick={() => setAnnual((v) => !v)}
          aria-label="Toggle billing period"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${annual ? "bg-accent" : "bg-stone-200"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-ink" : "text-inkSubtle"}`}>
          Annual{" "}
          <span className="ml-1 rounded-full bg-accentSoft px-2 py-0.5 text-xs font-semibold text-accent">
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
              className={`rounded-lg border p-6 flex flex-col bg-surface ${
                plan.highlight ? "border-2 border-accent" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-ink">{plan.name}</span>
                {plan.highlight && (
                  <span className="rounded-full bg-accentSoft px-2 py-0.5 text-xs font-semibold text-accent">
                    Most popular
                  </span>
                )}
              </div>

              <div className="mb-1">
                <span className="text-4xl font-bold font-mono text-ink">{price}</span>
                {plan.monthly > 0 && <span className="text-inkMuted text-sm ml-1">/mo</span>}
              </div>
              <p className="text-xs text-inkSubtle mb-5">{sub}</p>

              <ul className="space-y-2 mb-6 text-sm text-ink flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-accent">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`block text-center rounded-sm py-2.5 font-medium min-h-[44px] flex items-center justify-center transition-colors ${
                  plan.highlight
                    ? "bg-accent text-white hover:bg-accentHover"
                    : "bg-muted text-ink hover:bg-stone-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="overflow-x-auto rounded-lg border border-line mb-12">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-muted">
              <th className="px-4 py-3 text-left font-medium text-inkMuted w-1/2">Feature</th>
              <th className="px-4 py-3 text-center font-medium text-inkMuted">Starter</th>
              <th className="px-4 py-3 text-center font-medium text-accent">Solo</th>
              <th className="px-4 py-3 text-center font-medium text-inkMuted">Studio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {COMPARISON.map((row) => (
              <tr key={row.feature} className="hover:bg-muted transition-colors">
                <td className="px-4 py-3 text-inkMuted">{row.feature}</td>
                <td className="px-4 py-3 text-center"><Cell value={row.starter} /></td>
                <td className="px-4 py-3 text-center"><Cell value={row.solo} /></td>
                <td className="px-4 py-3 text-center"><Cell value={row.studio} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
}
