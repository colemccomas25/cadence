"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-paper transition-all ${
        scrolled ? "border-b border-line" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-display tracking-tight text-ink">
          Cadence<span className="text-accent">.</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <Link href="#pricing" className="hidden sm:block text-inkMuted hover:text-ink transition-colors">Pricing</Link>
          <Link href="#faq" className="hidden sm:block text-inkMuted hover:text-ink transition-colors">FAQ</Link>
          <Link href="/docs" className="hidden sm:block text-inkMuted hover:text-ink transition-colors">Help</Link>
          <Link href="/login" className="hidden sm:block text-inkMuted hover:text-ink transition-colors">Log in</Link>
          <Link
            href="/login"
            className="rounded-sm bg-accent px-3 py-2 text-white text-sm font-medium hover:bg-accentHover transition-colors min-h-[44px] flex items-center"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}
