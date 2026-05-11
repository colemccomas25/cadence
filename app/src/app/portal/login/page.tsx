import { PortalLoginForm } from "./portal-login-form";

export default function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-2xl font-display tracking-tight text-ink mb-1">
          Cadence<span className="text-accent">.</span>
        </div>
        <h1 className="text-lg font-semibold text-ink mt-4 mb-1">Sign in to your parent portal</h1>
        <p className="text-sm text-inkSubtle mb-6">
          Enter your email and we&apos;ll send you a sign-in link.
        </p>
        <PortalLoginForm />
      </div>
    </div>
  );
}
