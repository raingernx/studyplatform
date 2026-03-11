"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Overview",    icon: LayoutDashboard, exact: true },
  { href: "/library",      label: "My Library",  icon: BookOpen },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/settings",     label: "Settings",    icon: Settings },
];

interface DashboardSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    subscriptionStatus?: string;
  };
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const isSubscribed = user.subscriptionStatus === "ACTIVE";

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-100 bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.03)]">
      {/* User info */}
      <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? "User"}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-zinc-100"
          />
        ) : (
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-sm">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-zinc-900">
            {user.name ?? "Student"}
          </p>
          <p className="truncate text-[11px] text-zinc-400">{user.email}</p>
        </div>
      </div>

      {/* Subscription badge */}
      <div className="px-4 pt-4">
        {isSubscribed ? (
          /* Gradient-border trick — same as PricingCard highlighted */
          <div className="rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600 p-px shadow-sm">
            <div className="flex items-center gap-2 rounded-[calc(0.75rem-1px)] bg-zinc-950 px-3 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-[12px] font-semibold text-white">Pro Member</span>
            </div>
          </div>
        ) : (
          <Link
            href="/membership"
            className="group flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5 ring-1 ring-orange-200/80 transition-all hover:bg-orange-100 hover:ring-orange-300"
          >
            <span className="text-[12px] font-semibold text-orange-700">
              Upgrade to Pro
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-orange-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 pt-3">
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Menu
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-colors",
                      active ? "text-blue-600" : "text-zinc-400"
                    )}
                  />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom help link */}
      <div className="border-t border-zinc-100 px-4 py-4">
        <a
          href="mailto:support@studyplatform.dev"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500">
            ?
          </span>
          Help &amp; Support
        </a>
      </div>
    </aside>
  );
}
