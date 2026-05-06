"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Receipt } from "lucide-react";

const TABS = [
  { href: "/dashboard",          label: "Home",     exact: true,  icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Calendar", exact: false, icon: CalendarDays },
  { href: "/dashboard/students", label: "Students", exact: false, icon: Users },
  { href: "/dashboard/invoices", label: "Invoices", exact: false, icon: Receipt },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 flex border-t border-line bg-surface md:hidden">
      {TABS.map(({ href, label, exact, icon: Icon }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium min-h-[48px] transition-colors ${
              active ? "text-accent" : "text-inkSubtle hover:text-ink"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
