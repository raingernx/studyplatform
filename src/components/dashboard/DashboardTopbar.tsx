"use client";

import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Search,
  Bell,
  BookOpen,
  ShoppingBag,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { AccountTrigger } from "@/components/layout/account/AccountTrigger";
import type { DashboardUser } from "./DashboardLayout";
import { DashboardTopbar as SharedDashboardTopbar } from "@/components/layout/dashboard/DashboardTopbar";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";
import { beginDashboardNavigation } from "@/components/layout/dashboard/dashboardNavigationState";

interface DashboardTopbarProps {
  user: DashboardUser;
  onMenuToggle: () => void;
}

const AVATAR_MENU = [
  { href: routes.library,   label: "My Library", icon: BookOpen },
  { href: routes.purchases, label: "Purchases",  icon: ShoppingBag },
  { href: routes.settings,  label: "Settings",   icon: Settings },
];

export function DashboardTopbar({ user, onMenuToggle }: DashboardTopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  function handleDashboardNavigation(href: string) {
    beginDashboardNavigation(href);
  }

  function handleMarketplaceNavigation(href: string) {
    beginResourcesNavigation("discover", href, { overlay: true });
  }

  function handleMarketplaceLinkClick(
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    handleMarketplaceNavigation(href);

    window.requestAnimationFrame(() => {
      router.push(href);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      const href = `${routes.marketplace}?search=${encodeURIComponent(q)}`;
      handleMarketplaceNavigation(href);
      router.push(href);
      searchRef.current?.blur();
    }
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setAvatarOpen(false);

    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <SharedDashboardTopbar
      variant={user.isCreator ? "creator" : "user"}
      onMenuToggle={onMenuToggle}
      left={
        <form
          onSubmit={handleSearch}
          className="relative hidden max-w-lg flex-1 sm:block"
        >
          <Search
              className={cn(
                "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                searchFocused ? "text-primary-700" : "text-muted-foreground"
              )}
            />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search worksheets, flashcards, templates…"
            className="w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-10 text-small text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary-300 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary-500/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      }
      rightClassName="gap-1.5"
      right={
        <>
          {isHydrated ? (
            <Link
              href={routes.marketplace}
              onClick={(event) => handleMarketplaceLinkClick(event, routes.marketplace)}
              className="hidden items-center rounded-xl border border-border bg-card px-3 py-2 text-small font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground sm:flex"
            >
              Browse resources
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className="hidden items-center rounded-xl border border-border bg-card px-3 py-2 text-small font-medium text-muted-foreground sm:flex"
            >
              Browse resources
            </span>
          )}

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition hover:border-border hover:bg-accent hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div ref={avatarRef} className="relative">
            <button
              type="button"
              onClick={() => setAvatarOpen((o) => !o)}
              className="group transition"
            >
              <AccountTrigger
                name={user.name?.split(" ")[0] ?? "Account"}
                image={user.image}
                email={user.email}
                isOpen={avatarOpen}
                className="hidden sm:inline-flex"
              />
              <AccountTrigger
                name={user.name?.split(" ")[0] ?? "Account"}
                image={user.image}
                email={user.email}
                isOpen={avatarOpen}
                className="sm:hidden"
              />
            </button>

            {avatarOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-small font-semibold text-foreground">
                    {user.name ?? "Account"}
                  </p>
                  <p className="mt-0.5 truncate text-caption text-muted-foreground">
                    {user.email}
                  </p>
                </div>

                <div className="p-1.5">
                  {AVATAR_MENU.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          handleDashboardNavigation(item.href);
                          setAvatarOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-small text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </Link>
                    );
                  })}

                  <div className="mt-1 border-t border-border pt-1">
                    <button
                      type="button"
                      disabled={isSigningOut}
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-small text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {isSigningOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      }
    />
  );
}
