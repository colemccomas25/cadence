import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { Check } from "lucide-react";

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  if (studio.plan !== "free") {
    redirect("/dashboard");
  }

  return (
    <div className="px-4 py-8 md:px-12 max-w-2xl">
      <h1 className="text-3xl font-display tracking-tight text-ink mb-2">Upgrade your plan</h1>
      <p className="text-inkMuted text-sm mb-8">
        You&apos;re on the free plan (up to 5 students). Upgrade to unlock auto-invoicing and parent reminders.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <PlanCard
          name="Solo"
          price="$19"
          features={["Up to 30 students", "Auto-invoicing via Stripe", "Family billing", "24h parent reminders", "Make-up tracking"]}
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

      <p className="text-xs text-inkSubtle text-center">
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
    <div className={`bg-surface rounded-xl border p-6 flex flex-col ${highlight ? "border-accent ring-2 ring-accent/20" : "border-line"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="font-semibold text-ink">{name}</div>
        {highlight && (
          <span className="rounded-full bg-accentSoft px-2 py-0.5 text-xs font-semibold text-accent">
            Recommended
          </span>
        )}
      </div>
      <div className="mb-4">
        <span className="text-3xl font-bold font-mono text-ink">{price}</span>
        <span className="text-inkSubtle text-sm"> / month</span>
      </div>
      <ul className="space-y-2 mb-6 text-sm text-inkMuted flex-1">
        {features.map((f) => (
          <li key={f} className="flex gap-2 items-start">
            <Check size={14} className="text-accent mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <a
        href={`/api/stripe/checkout/subscription?price=${priceKey}`}
        className={`block text-center rounded-md py-2.5 text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center ${
          highlight
            ? "bg-accent text-white hover:bg-accentHover"
            : "bg-muted text-ink hover:bg-stone-200"
        }`}
      >
        Subscribe to {name}
      </a>
    </div>
  );
}
