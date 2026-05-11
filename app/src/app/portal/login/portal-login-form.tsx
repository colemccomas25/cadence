"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { requestParentMagicLink } from "@/actions/parent-auth";

export function PortalLoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await requestParentMagicLink(email);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="bg-surface rounded-xl border border-line p-6 text-center">
        <p className="text-sm text-ink font-medium mb-1">Check your inbox</p>
        <p className="text-sm text-inkSubtle">
          If that email is on file, we sent a sign-in link. It expires in 20 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-line p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Email address</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-line px-3 py-2 text-sm bg-surface text-ink placeholder:text-inkSubtle focus:outline-none focus:ring-2 focus:ring-cta/40"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-cta px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Send me a link
      </button>
    </form>
  );
}
