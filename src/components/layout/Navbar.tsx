"use client";

import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Upload,
  ShoppingBag,
  Settings,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {useTranslations, useLocale} from "next-intl";
import {getLocalizedPath, type RouteKey} from "@/lib/routeTranslations";
import type {Locale} from "@/i18n/config";

/* ── Config ──────────────────────────────────────────────────────────────── */

const NAV_LINKS: {key: RouteKey}[] = [
  { key: "marketplace" },
  { key: "library" },
  { key: "membership" },
];

/* ── Navbar ──────────────────────────────────────────────────────────────── */

export function Navbar() {
  const t = useTranslations("navbar");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router   = useRouter();
  const isLoading = status === "loading";

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [search,       setSearch]       = useState("");

  const initials = session?.user?.name?.[0]?.toUpperCase() ?? "U";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/resources?search=${encodeURIComponent(q)}` : "/resources");
    setMobileOpen(false);
  }

  function closeAll() {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }

  /* ── render ─────────────────────────────────────────────────────────── */

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200 bg-white/95 backdrop-blur-sm">

      {/* ── Main bar ─────────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-6">

        {/* Logo — full (icon + paper/dock) on desktop, icon-only on mobile */}
        <Logo variant="full" size="sm" className="hidden sm:flex" />
        <Logo variant="icon" size="sm" className="flex sm:hidden" />

        {/* Search — visible md+ */}
        <form
          onSubmit={handleSearch}
          className="relative hidden flex-1 md:flex"
          style={{ maxWidth: "26rem" }}
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className={[
              "w-full rounded-lg border border-surface-200 bg-surface-50 font-thai",
              "py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted",
              "outline-none transition-all duration-150",
              "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15",
            ].join(" ")}
          />
        </form>

        {/* Spacer — pushes nav + actions right */}
        <div className="flex-1" />

        {/* Nav links — visible lg+ */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map(({ key }) => {
            const href = getLocalizedPath(key, locale as Locale);
            const normalizedPath = pathname.replace(/^\/(th|en)(?=\/|$)/, "");
            const active = normalizedPath.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 font-thai",
                  active
                    ? "bg-brand-50 text-brand-600"
                    : "text-text-secondary hover:bg-surface-100 hover:text-text-primary"
                )}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* Right actions — visible md+ */}
        <div className="hidden items-center gap-3 md:flex">

          {/* Upload — only when signed in */}
          {session?.user && (
            <Button variant="secondary" size="sm" asChild className="h-[34px] rounded-xl font-thai">
              <Link href="/admin/resources/new">
                <Upload className="h-3.5 w-3.5" />
                {t("upload")}
              </Link>
            </Button>
          )}

          {/* Auth section */}
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-full bg-surface-100" />
          ) : session?.user ? (
            /* ── User dropdown ──────────────────────────────────────────── */
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white",
                  "px-2.5 py-1.5 shadow-card transition-all duration-150",
                  "hover:border-surface-300 hover:shadow-card-md",
                  userMenuOpen && "border-brand-300 shadow-card-md",
                )}
              >
                <Avatar
                  src={session.user.image}
                  broken={avatarBroken}
                  initials={initials}
                  onBroken={() => setAvatarBroken(true)}
                  size={20}
                />
                <span className="max-w-[96px] truncate text-[13px] font-medium text-text-primary">
                  {session.user.name?.split(" ")[0]}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-text-muted transition-transform duration-150",
                    userMenuOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {userMenuOpen && (
                <>
                  {/* Click-away backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setUserMenuOpen(false)}
                  />
                    {/* Menu panel */}
                    <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-lg">
                      {/* User info */}
                      <div className="border-b border-surface-100 px-4 py-3">
                        <p className="truncate text-[13px] font-semibold text-text-primary">
                          {session.user.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-text-muted">
                          {session.user.email}
                        </p>
                      </div>

                      {/* Grouped menu items */}
                      <div className="p-1.5">
                        {/* Dashboard / Library / Purchases */}
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
                        >
                          <LayoutDashboard
                            className="h-3.5 w-3.5 text-text-muted"
                            aria-hidden
                          />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/resources"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
                        >
                          <BookOpen
                            className="h-3.5 w-3.5 text-text-muted"
                            aria-hidden
                          />
                          My Library
                        </Link>
                        <Link
                          href="/dashboard/purchases"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
                        >
                          <ShoppingBag
                            className="h-3.5 w-3.5 text-text-muted"
                            aria-hidden
                          />
                          Purchases
                        </Link>

                        <div className="my-1.5 border-t border-surface-100" />

                        {/* Upload Resource */}
                        <Link
                          href="/upload"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
                        >
                          <Upload
                            className="h-3.5 w-3.5 text-text-muted"
                            aria-hidden
                          />
                          Upload Resource
                        </Link>

                        <div className="my-1.5 border-t border-surface-100" />

                        {/* Settings + Sign out */}
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
                        >
                          <Settings
                            className="h-3.5 w-3.5 text-text-muted"
                            aria-hidden
                          />
                          Settings
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            closeAll();
                            signOut({ callbackUrl: "/" });
                          }}
                          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-3.5 w-3.5" aria-hidden />
                          Sign out
                        </button>
                      </div>
                    </div>
                </>
              )}
            </div>
          ) : (
            /* ── Logged out ─────────────────────────────────────────────── */
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-100 hover:text-text-primary font-thai"
              >
                {t("signIn")}
              </Link>
              <Button size="sm" asChild className="font-thai">
                <Link href="/auth/register">{t("getStarted")}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="ml-auto rounded-lg p-1.5 text-text-secondary hover:bg-surface-100 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

      </div>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-b border-surface-200 bg-white px-4 pb-5 pt-3 shadow-card-md md:hidden">

          {/* Search */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 font-thai"
            />
          </form>

          {/* Nav links */}
          <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ key }) => {
              const href = getLocalizedPath(key, locale as Locale);
              const normalizedPath = pathname.replace(/^\/(th|en)(?=\/|$)/, "");
              const active = normalizedPath.startsWith(href);
              return (
              <Link
                  key={key}
                  href={href}
                  onClick={closeAll}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors font-thai",
                    active
                      ? "bg-brand-50 text-brand-600"
                      : "text-text-secondary hover:bg-surface-100 hover:text-text-primary"
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          {/* Auth section */}
          <div className="mt-4 flex flex-col gap-2 border-t border-surface-100 pt-4">
            {session?.user ? (
              <>
                {/* User info pill */}
                <div className="flex items-center gap-3 rounded-xl bg-surface-50 px-3 py-2.5">
                  <Avatar
                    src={session.user.image}
                    broken={avatarBroken}
                    initials={initials}
                    onBroken={() => setAvatarBroken(true)}
                    size={28}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {session.user.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/resources/new"
                  onClick={closeAll}
                  className="flex items-center gap-2.5 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-50"
                >
                  <Upload className="h-4 w-4 text-text-muted" aria-hidden /> Upload Resource
                </Link>

                <Link
                  href="/dashboard"
                  onClick={closeAll}
                  className="flex items-center gap-2.5 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-50"
                >
                  <LayoutDashboard className="h-4 w-4 text-text-muted" aria-hidden /> Dashboard
                </Link>

                <button
                  type="button"
                  onClick={() => { closeAll(); signOut({ callbackUrl: "/" }); }}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={closeAll}
                  className="rounded-xl border border-surface-200 px-4 py-2.5 text-center text-sm font-medium text-text-secondary hover:bg-surface-50 font-thai"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={closeAll}
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700 font-thai"
                >
                  {t("getStarted")}
                </Link>
              </>
            )}
          </div>

        </div>
      )}
    </header>
  );
}

/* ── Avatar helper ───────────────────────────────────────────────────────── */

function Avatar({
  src,
  broken,
  initials,
  onBroken,
  size,
}: {
  src?: string | null;
  broken: boolean;
  initials: string;
  onBroken: () => void;
  size: number;
}) {
  if (src && !broken) {
    return (
      <div
        className="overflow-hidden rounded-full ring-1 ring-surface-200"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          className="h-full w-full object-cover"
          onError={onBroken}
        />
      </div>
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.45) }}
    >
      {initials}
    </span>
  );
}
