import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-2xl font-semibold tracking-tight mb-6">
          Cadence<span className="text-brand-500">.</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-lg font-semibold mb-2">Check your email</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            We sent you a magic link. Click it to sign in — no password needed.
          </p>
        </div>
        <Link href="/login" className="mt-6 inline-block text-sm text-slate-400 hover:text-slate-600">
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
