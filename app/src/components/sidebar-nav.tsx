"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/students", label: "Students", exact: false },
  { href: "/dashboard/calendar", label: "Calendar", exact: false },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-2 py-4 space-y-0.5">
      {NAV.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-brand-50 text-brand-600 font-medium"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
