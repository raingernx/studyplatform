"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import {
  LayoutDashboard,
  BookOpen,
  Download,
  ShoppingBag,
  Store,
  CreditCard,
  Settings,
  ChevronRight,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react";
import type { DashboardUser } from "./DashboardLayout";
import { Logo } from "@/components/brand/Logo";
import {
  SidebarBadge,
  SidebarContainer,
  SidebarNav,
  SidebarSection,
  SidebarSectionLabel,
} from "@/components/ui/sidebar";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string | number;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Dashboard",
    items: [
      {
        href: routes.dashboard,
        label: "Overview",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: routes.library, label: "My Library", icon: BookOpen },
      { href: routes.downloads, label: "Downloads", icon: Download },
      {
        href: routes.purchases,
        label: "Purchases",
        icon: ShoppingBag,
      },
    ],
  },
  {
    label: "Explore",
    items: [
      { href: routes.marketplace, label: "Marketplace", icon: Store, exact: true },
    ],
  },
  {
    label: "Account",
    items: [
      { href: routes.subscription, label: "Membership", icon: CreditCard },
      { href: routes.settings, label: "Settings", icon: Settings },
    ],
  },
];

interface DashboardSidebarProps {
  user: DashboardUser;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({
  user,
  isOpen = false,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(th|en)(?=\/|$)/, "");

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return normalizedPath === href;
    if (href === "/resources") return normalizedPath.startsWith("/resources");
    return normalizedPath === href || normalizedPath.startsWith(href + "/");
  };

  const isSubscribed = user.subscriptionStatus === "ACTIVE";

  const content = (
    <SidebarContainer className="h-full">
      {/* Logo */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-100 px-5">
        <Logo variant="full" size="sidebar" />
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* User profile */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-neutral-100 px-4 py-3.5">
        {user.image ? (
          <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-neutral-100">
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={32}
              height={32}
              sizes="32px"
              className="h-8 w-8 object-cover"
            />
          </div>
        ) : (
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-[13px] font-bold text-white">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-neutral-900">
            {user.name ?? "Student"}
          </p>
          <p className="truncate text-[11px] text-neutral-400">{user.email}</p>
        </div>
      </div>

      {/* Membership badge */}
      <div className="flex-shrink-0 px-4 pt-3">
        {isSubscribed ? (
          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[12px] font-semibold text-white">
              Pro Member
            </span>
          </div>
        ) : (
          <Link
            href="/subscription"
            onClick={onClose}
            className="group flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200/80 transition-all hover:bg-amber-100 hover:ring-amber-300"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[12px] font-semibold text-amber-700">
                Upgrade to Pro
              </span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <SidebarNav className="pt-3">
        {NAV_SECTIONS.map((section, si) => (
          <SidebarSection key={section.label} className={cn(si > 0 && "mt-5")}>
            <SidebarSectionLabel className="mt-0 px-3 text-[10px] tracking-widest text-neutral-400">
              {section.label}
            </SidebarSectionLabel>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        active && "bg-slate-900 font-semibold text-white"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="flex w-full items-center gap-2">
                        <span className="flex items-center gap-3">
                          {Icon && (
                            <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                          )}
                          <span>{item.label}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SidebarSection>
        ))}
      </SidebarNav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-neutral-100 px-4 py-3">
        <a
          href="mailto:support@paperdock.app"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-neutral-400 transition hover:bg-neutral-50 hover:text-neutral-600"
        >
          <HelpCircle className="h-4 w-4" />
          Help &amp; Support
        </a>
      </div>
    </SidebarContainer>
  );

  return (
    <>
      {/* ── Desktop: always visible ──────────────────────────────── */}
      <div className="hidden flex-shrink-0 lg:block">{content}</div>

      {/* ── Mobile: slide-in drawer ──────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] transition-transform duration-200 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </div>
    </>
  );
}
