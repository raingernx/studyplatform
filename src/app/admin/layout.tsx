"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface AdminLayoutProps {
  children: ReactNode;
}

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
] as const;

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-border-subtle bg-white">
      <div className="px-4 py-4">
        {/* Logo / Admin label */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-secondary">
            Admin
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 text-sm">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-text-primary"
                    : "text-text-secondary hover:bg-muted hover:text-text-primary",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom area (placeholder for future items) */}
      <div className="px-4 py-4 text-xs text-text-muted">
        <p>PaperDock Admin</p>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface-50">
      <AdminSidebar />

      <div className="flex min-h-screen flex-1 flex-col bg-muted-50">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-white px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
              Admin
            </p>
            <p className="text-sm font-semibold text-text-primary">
              Control panel
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden items-center gap-2 rounded-full border border-border-subtle bg-surface-50 px-3 py-1.5 text-sm text-text-secondary md:flex">
              <Search className="h-4 w-4 text-text-muted" />
              <input
                type="search"
                placeholder="Search admin…"
                className="bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-white text-text-secondary shadow-card hover:bg-muted"
            >
              <Bell className="h-4 w-4" />
            </button>

            {/* User pill – placeholder */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-border-subtle bg-white px-3 py-1.5 text-sm text-text-primary shadow-card hover:bg-muted"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[11px] font-bold text-white">
                U
              </span>
              <span className="max-w-[120px] truncate text-xs font-medium">
                Admin user
              </span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}


