import Link from "next/link";

export default function ParentCardSavedPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-2xl font-display tracking-tight text-ink mb-4">
          Cadence<span className="text-accent">.</span>
        </div>
        <h1 className="text-xl font-semibold text-ink mb-3">Card saved.</h1>
        <p className="text-sm text-inkSubtle mb-6">
          Your teacher can now charge your card for monthly lesson invoices.
          You can remove it at any time by replying to a future invoice email.
        </p>
        <Link href="/portal" className="text-sm text-accent hover:underline">
          Go to your portal →
        </Link>
      </div>
    </div>
  );
}
