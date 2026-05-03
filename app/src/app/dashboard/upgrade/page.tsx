import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import Link from "next/link";

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  if (studio.plan !== "free") {
    redirect("/dashboard");
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Upgrade your plan</h1>
      <p className="text-slate-500 text-sm mb-8">
        You're on the free plan (up to 5 students). Upgrade to unlock auto-invoicing and reminders.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <PlanCard
          name="Solo"
          price="$19"
          features={["Up to 30 students", "Auto-invoicing via Stripe", "Family billing", "Lesson reminders", "Make-up tracking"]}
          priceKey="solo_monthly"
        />
        <PlanCard
          name="Studio"
          price="$39"
          highlight
          features={["Unlimited students", "Auto-charge saved cards", "Group lessons", "Practice log", "Priority support"]}
          priceKey="studio_monthly"
        />
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center">
        Cancel anytime. No long-term contract. Billed monthly.
      </p>
    </div>
  );
}

function PlanCard({
  name, price, features, priceKey, highlight,
}: {
  name: string; price: string; features: string[]; priceKey: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-6 ${highlight ? "border-brand-500 ring-2 ring-brand-500/20" : "border-slate-200"}`}>
      <div className="font-semibold text-slate-900 mb-1">{name}</div>
      <div className="mb-4">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-slate-400 text-sm"> / month</span>
      </div>
      <ul className="space-y-2 mb-6 text-sm text-slate-600">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-brand-500">✓</span> {f}
          </li>
        ))}
      </ul>
      <Link
        href={`/api/stripe/checkout/subscription?price=${priceKey}`}
        className={`block text-center rounded-md py-2 text-sm font-medium transition-colors ${
          highlight
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
        }`}
      >
        Subscribe to {name}
      </Link>
    </div>
  );
}
