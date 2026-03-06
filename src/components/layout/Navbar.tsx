"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Menu, X, ChevronDown, LogOut, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/resources",  label: "Library"    },
  { href: "/membership", label: "Membership" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const loading = status === "loading";

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/"
            className="flex flex-shrink-0 items-center gap-2 text-[15px] font-semibold text-zinc-900
                       transition-opacity hover:opacity-70">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg
                             bg-gradient-to-br from-blue-600 to-violet-600 shadow-sm">
              <BookOpen className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </span>
            Study<span className="text-blue-600">Platform</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className={cn(
                    "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                    active
                      ? "text-zinc-900 bg-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70"
                  )}>
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-px h-px bg-blue-500/50 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop auth */}
          <div className="hidden items-center gap-2 md:flex">
            {loading ? (
              <div className="h-7 w-24 animate-pulse rounded-full bg-zinc-100" />
            ) : session?.user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white
                             px-2.5 py-1.5 text-sm font-medium text-zinc-700 shadow-card
                             transition-all duration-150 hover:border-zinc-300 hover:shadow-card-md">
                  {session.user.image ? (
                    <img src={session.user.image} alt={session.user.name ?? ""}
                      className="rounded-full object-cover ring-1 ring-zinc-200"
                      style={{ height: 20, width: 20 }} />
                  ) : (
                    <span className="flex items-center justify-center rounded-full
                                     bg-gradient-to-br from-blue-500 to-violet-500 text-[10px] font-bold text-white"
                          style={{ height: 20, width: 20 }}>
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </span>
                  )}
                  <span className="max-w-[100px] truncate text-[13px]">
                    {session.user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className={cn("h-3 w-3 text-zinc-400 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl
                                    border border-zinc-100 bg-white shadow-card-lg ring-1 ring-black/[0.04]">
                      <div className="border-b border-zinc-100 px-4 py-3">
                        <p className="truncate text-[13px] font-semibold text-zinc-900">{session.user.name}</p>
                        <p className="truncate text-[11px] text-zinc-400 mt-0.5">{session.user.email}</p>
                      </div>
                      <div className="p-1.5">
                        {[
                          { href: "/dashboard",         label: "Dashboard", icon: LayoutDashboard },
                          { href: "/dashboard/profile", label: "Profile",   icon: User           },
                        ].map((item) => (
                          <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px]
                                       text-zinc-700 transition-colors hover:bg-zinc-50">
                            <item.icon className="h-3.5 w-3.5 text-zinc-400" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-zinc-100 p-1.5">
                        <button onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2
                                     text-[13px] text-red-600 transition-colors hover:bg-red-50">
                          <LogOut className="h-3.5 w-3.5" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login"
                  className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-zinc-600
                             transition-colors hover:text-zinc-900 hover:bg-zinc-100">
                  Sign in
                </Link>
                <Link href="/auth/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5
                             text-[13px] font-semibold text-white shadow-card
                             transition-all duration-150 hover:bg-zinc-700">
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="ml-auto rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b border-zinc-200 bg-white px-4 pb-5 pt-3 shadow-card-md md:hidden">
          <nav className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4">
            {session?.user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-200 px-4 py-2.5
                             text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  <LayoutDashboard className="h-4 w-4 text-zinc-400" /> Dashboard
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  Sign in
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-zinc-700">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
