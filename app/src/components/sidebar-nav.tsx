"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  Mail,
  Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",          label: "Dashboard",  exact: true,  icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students",   exact: false, icon: Users },
  { href: "/dashboard/calendar", label: "Calendar",   exact: false, icon: CalendarDays },
  { href: "/dashboard/invoices", label: "Invoices",   exact: false, icon: Receipt },
  { href: "/dashboard/logs",     label: "Email logs", exact: false, icon: Mail },
  { href: "/dashboard/upgrade",  label: "Upgrade",    exact: false, icon: Sparkles },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-2 py-4 space-y-0.5">
      {NAV.map(({ href, label, exact, icon: Icon }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-accentSoft text-accent font-medium"
                : "text-inkMuted hover:bg-muted hover:text-ink"
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
