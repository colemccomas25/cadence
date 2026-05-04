"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home", exact: true },
  { href: "/dashboard/calendar", label: "Calendar", exact: false },
  { href: "/dashboard/students", label: "Students", exact: false },
  { href: "/dashboard/invoices", label: "Invoices", exact: false },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 flex border-t border-slate-200 bg-white md:hidden">
      {TABS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium min-h-[48px] transition-colors ${
              active ? "text-brand-600" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <span className="text-base leading-none">{tabIcon(href)}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function tabIcon(href: string) {
  if (href === "/dashboard") return "⌂";
  if (href === "/dashboard/calendar") return "◫";
  if (href === "/dashboard/students") return "♪";
  if (href === "/dashboard/invoices") return "◈";
  return "•";
}
