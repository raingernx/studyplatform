"use client";

import { useState, useRef, useEffect } from "react";
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

  function handleDashboardNavigation(href: string) {
    beginDashboardNavigation(href);
  }

  function handleMarketplaceNavigation(href: string) {
    beginResourcesNavigation("discover", href);
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
              "absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors",
              searchFocused ? "text-neutral-600" : "text-neutral-400"
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
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-9 text-[13px] text-neutral-900 transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      }
      rightClassName="gap-1.5"
      right={
        <>
          <Link
            href={routes.marketplace}
            onClick={() => handleMarketplaceNavigation(routes.marketplace)}
            className="hidden items-center rounded-md bg-neutral-900 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-neutral-700 sm:flex"
          >
            Browse
          </Link>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
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
              <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-lg border border-zinc-100 bg-white shadow-card-md">
                <div className="border-b border-neutral-100 px-4 py-3">
                  <p className="text-[13px] font-semibold text-neutral-900">
                    {user.name ?? "Account"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-neutral-400">
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
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] text-neutral-700 transition hover:bg-neutral-50"
                      >
                        <Icon className="h-3.5 w-3.5 text-neutral-400" />
                        {item.label}
                      </Link>
                    );
                  })}

                  <div className="mt-1 border-t border-neutral-100 pt-1">
                    <button
                      type="button"
                      disabled={isSigningOut}
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
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
