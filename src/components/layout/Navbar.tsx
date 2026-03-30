"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useId, useRef, useState } from "react";
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  Menu,
  Settings,
  ShoppingBag,
  X,
} from "lucide-react";
import { Avatar } from "@/design-system";
import { AccountTrigger } from "@/components/layout/account/AccountTrigger";
import { NavbarBrand } from "@/components/layout/NavbarBrand";
import { NavbarItem } from "@/components/layout/navbar/NavbarItem";
import { Container } from "@/components/layout/container";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: routes.marketplace, label: "มาร์เก็ตเพลส" },
  { href: routes.library, label: "คลังของฉัน" },
];

const MARKETPLACE_CATEGORY_ITEMS = [
  { href: routes.marketplace, label: "สำรวจ", category: null, mode: "discover" as const },
  { href: routes.marketplaceCategory("all"), label: "ทั้งหมด", category: "all", mode: "listing" as const },
  {
    href: routes.marketplaceCategory("art-creativity"),
    label: "ศิลปะและความคิดสร้างสรรค์",
    category: "art-creativity",
    mode: "listing" as const,
  },
  {
    href: routes.marketplaceCategory("early-learning"),
    label: "ปฐมวัย",
    category: "early-learning",
    mode: "listing" as const,
  },
  {
    href: routes.marketplaceCategory("humanities"),
    label: "มนุษยศาสตร์",
    category: "humanities",
    mode: "listing" as const,
  },
  { href: routes.marketplaceCategory("language"), label: "ภาษา", category: "language", mode: "listing" as const },
  {
    href: routes.marketplaceCategory("mathematics"),
    label: "คณิตศาสตร์",
    category: "mathematics",
    mode: "listing" as const,
  },
  {
    href: routes.marketplaceCategory("science"),
    label: "วิทยาศาสตร์",
    category: "science",
    mode: "listing" as const,
  },
  {
    href: routes.marketplaceCategory("study-skills"),
    label: "ทักษะการเรียน",
    category: "study-skills",
    mode: "listing" as const,
  },
  {
    href: routes.marketplaceCategory("test-prep"),
    label: "Test Prep",
    category: "test-prep",
    mode: "listing" as const,
  },
];

const MOBILE_VISIBLE_CATEGORY_COUNT = 2;
const HORIZONTAL_SCROLL_CLASS_NAME =
  "overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";
const MARKETPLACE_ACTION_LINK_CLASS_NAME =
  "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[14px] leading-[22px] font-medium text-text-secondary transition-colors hover:bg-surface-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2";
const MARKETPLACE_PRIMARY_ACTION_CLASS_NAME =
  "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-brand-600 px-4 text-[14px] leading-[22px] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2";
const MARKETPLACE_PREMIUM_ACTION_CLASS_NAME =
  "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-amber-200 bg-[linear-gradient(135deg,#fff8dc,#fff4bf)] px-4 text-[14px] leading-[22px] font-semibold text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors hover:border-amber-300 hover:bg-[linear-gradient(135deg,#fff9e7,#fff1b0)] hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 focus-visible:ring-offset-2";
const MARKETPLACE_CATEGORY_ITEM_CLASS_NAME =
  "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-4 text-[14px] leading-[22px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2";

function isMarketplaceCategoryActive(currentCategory: string | null, itemCategory: string | null) {
  if (itemCategory === null) {
    return currentCategory === null;
  }

  return currentCategory === itemCategory;
}

function marketplaceCategoryClassName(active: boolean) {
  return cn(
    MARKETPLACE_CATEGORY_ITEM_CLASS_NAME,
    active
      ? "border-surface-300 bg-surface-100 text-text-primary shadow-sm"
      : "border-transparent bg-white text-text-secondary hover:bg-surface-50 hover:text-text-primary",
  );
}

function marketplaceCategoryItemClassName(
  active: boolean,
  itemCategory: string | null,
) {
  if (itemCategory === null) {
    return marketplaceCategoryClassName(active);
  }

  return cn(
    MARKETPLACE_CATEGORY_ITEM_CLASS_NAME,
    active
      ? "border-surface-300 bg-surface-100 text-text-primary shadow-sm"
      : "border-transparent bg-white text-text-secondary shadow-none hover:bg-surface-50 hover:text-text-primary",
  );
}

function NavbarFallback({
  hasMarketplaceShell,
}: {
  hasMarketplaceShell: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200 bg-white">
      <Container className={hasMarketplaceShell ? "py-3 sm:py-4" : "h-16"}>
        <div className="flex h-10 items-center">
          <NavbarBrand />
        </div>
      </Container>
    </header>
  );
}

function NavbarInner({
  secondaryRow,
  headerSearch,
}: {
  secondaryRow?: ReactNode;
  headerSearch?: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isMarketplaceNavbar = Boolean(headerSearch);
  const currentCategory = searchParams.get("category");
  const userMenuId = useId();
  const mobileMoreRef = useRef<HTMLDetailsElement | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const visibleMobileCategoryItems = MARKETPLACE_CATEGORY_ITEMS.slice(0, MOBILE_VISIBLE_CATEGORY_COUNT);
  const overflowMobileCategoryItems = MARKETPLACE_CATEGORY_ITEMS.slice(MOBILE_VISIBLE_CATEGORY_COUNT);
  const isMoreMenuActive = overflowMobileCategoryItems.some((item) =>
    isMarketplaceCategoryActive(currentCategory, item.category),
  );

  function closeMobileMoreMenu() {
    mobileMoreRef.current?.removeAttribute("open");
  }

  function closeAll() {
    setMobileOpen(false);
    setUserMenuOpen(false);
    closeMobileMoreMenu();
  }

  function handleHomeNavigation(href: string) {
    if (href === routes.marketplace) {
      beginResourcesNavigation("discover", href);
    }
  }

  function handleMarketplaceNavigation(mode: "discover" | "listing", href: string) {
    beginResourcesNavigation(mode, href);
    closeMobileMoreMenu();
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    closeAll();

    try {
      await signOut({ callbackUrl: routes.home });
    } catch {
      setIsSigningOut(false);
    }
  }

  function renderUserMenu() {
    if (!session?.user) {
      return null;
    }

    return (
      <>
        <div
          className="fixed inset-0 z-10"
          aria-hidden
          onClick={() => setUserMenuOpen(false)}
        />
        <div
          id={userMenuId}
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card-lg"
        >
          <div className="border-b border-surface-100 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-text-primary">
                {session.user.name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-text-muted">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              href={routes.dashboard}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
            >
              <span className="inline-flex items-center gap-2.5">
                <LayoutDashboard className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                <span>Dashboard</span>
              </span>
            </Link>
            <Link
              href={routes.library}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
            >
              <span className="inline-flex items-center gap-2.5">
                <BookOpen className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                <span>My Library</span>
              </span>
            </Link>
            <Link
              href={routes.purchases}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
            >
              <span className="inline-flex items-center gap-2.5">
                <ShoppingBag className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                <span>Purchases</span>
              </span>
            </Link>

            <div className="my-1.5 border-t border-surface-100" />

            <Link
              href={routes.settings}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-primary"
            >
              <span className="inline-flex items-center gap-2.5">
                <Settings className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                <span>Settings</span>
              </span>
            </Link>
            <button
              type="button"
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (isMarketplaceNavbar) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-surface-200 bg-white">
        <Container className="py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
              <div className="flex h-11 shrink-0 items-center">
                <NavbarBrand />
              </div>

              <div className="hidden min-w-0 lg:block">
                {headerSearch}
              </div>

              <div className="ml-auto hidden items-center gap-2.5 lg:flex">
                <Link href={routes.library} className={MARKETPLACE_ACTION_LINK_CLASS_NAME}>
                  คลังของฉัน
                </Link>

                {isLoading ? (
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-24 animate-pulse rounded-full bg-surface-100" />
                    <div className="h-10 w-10 animate-pulse rounded-full bg-surface-100" />
                  </div>
                ) : session?.user ? (
                  <>
                    <Link href={routes.membership} className={MARKETPLACE_PREMIUM_ACTION_CLASS_NAME}>
                      KC Premium
                    </Link>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setUserMenuOpen((open) => !open)}
                        className="group transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
                        aria-label="เปิดเมนูบัญชี"
                        aria-haspopup="menu"
                        aria-expanded={userMenuOpen}
                        aria-controls={userMenuId}
                      >
                        <AccountTrigger
                          name={session.user.name?.split(" ")[0] ?? "Account"}
                          image={session.user.image}
                          email={session.user.email}
                          isOpen={userMenuOpen}
                        />
                      </button>
                      {userMenuOpen ? renderUserMenu() : null}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href={routes.login} className={cn(MARKETPLACE_CATEGORY_ITEM_CLASS_NAME, "border-surface-300 bg-surface-100 text-text-primary shadow-sm")}>
                      เข้าสู่ระบบ
                    </Link>
                    <Link href={routes.register} className={MARKETPLACE_PRIMARY_ACTION_CLASS_NAME}>
                      เริ่มต้นใช้งาน
                    </Link>
                  </>
                )}
              </div>

              {/* Scrollable links — overflow-x-auto would clip an absolute
                  dropdown, so the avatar button lives outside this div. */}
              <div className={cn("ml-auto flex min-w-0 max-w-[68vw] items-center gap-1.5 lg:hidden", HORIZONTAL_SCROLL_CLASS_NAME)}>
                <Link href={routes.library} className="inline-flex h-10 shrink-0 items-center rounded-full px-3 text-[14px] leading-[22px] font-medium text-text-secondary transition-colors hover:bg-surface-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2">
                  คลังของฉัน
                </Link>

                {isLoading ? (
                  <div className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-surface-100" />
                ) : session?.user ? (
                  <Link href={routes.membership} className="inline-flex h-10 shrink-0 items-center rounded-full border border-amber-200 bg-[linear-gradient(135deg,#fff8dc,#fff4bf)] px-3 text-[14px] leading-[22px] font-semibold text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors hover:border-amber-300 hover:bg-[linear-gradient(135deg,#fff9e7,#fff1b0)] hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 focus-visible:ring-offset-2">
                    KC Premium
                  </Link>
                ) : (
                  <>
                    <Link href={routes.login} className={cn(MARKETPLACE_CATEGORY_ITEM_CLASS_NAME, "border-surface-300 bg-surface-100 px-3 text-text-primary shadow-sm")}>
                      เข้าสู่ระบบ
                    </Link>
                    <Link href={routes.register} className="inline-flex h-10 shrink-0 items-center rounded-full bg-brand-600 px-3 text-[14px] leading-[22px] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2">
                      เริ่มต้นใช้งาน
                    </Link>
                  </>
                )}
              </div>

              {/* Avatar sits outside overflow-x-auto so its dropdown is not clipped */}
              {isLoading ? (
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-100 lg:hidden" />
              ) : session?.user ? (
                <div className="relative shrink-0 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-200 bg-white shadow-sm transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
                    aria-label="เปิดเมนูบัญชี"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-controls={userMenuId}
                  >
                    <Avatar
                      src={session.user.image}
                      name={session.user.name}
                      email={session.user.email}
                      size={30}
                    />
                  </button>
                  {userMenuOpen ? renderUserMenu() : null}
                </div>
              ) : null}
            </div>

            <div className="min-w-0 lg:hidden">
              {headerSearch}
            </div>

            <nav className="hidden sm:block" aria-label="หมวดหมู่ทรัพยากร">
              <div className={cn("flex items-center gap-2 whitespace-nowrap", HORIZONTAL_SCROLL_CLASS_NAME)}>
                {MARKETPLACE_CATEGORY_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => handleMarketplaceNavigation(item.mode, item.href)}
                    className={marketplaceCategoryItemClassName(
                      pathname === routes.marketplace &&
                        isMarketplaceCategoryActive(currentCategory, item.category),
                      item.category,
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="flex items-center gap-2 sm:hidden">
              {visibleMobileCategoryItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => handleMarketplaceNavigation(item.mode, item.href)}
                  className={marketplaceCategoryItemClassName(
                    pathname === routes.marketplace &&
                      isMarketplaceCategoryActive(currentCategory, item.category),
                    item.category,
                  )}
                >
                  {item.label}
                </Link>
              ))}

              <details ref={mobileMoreRef} className="relative ml-auto shrink-0">
                <summary
                  className={cn(
                    marketplaceCategoryItemClassName(
                      pathname === routes.marketplace && isMoreMenuActive,
                      "__more__",
                    ),
                    "list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden",
                  )}
                >
                  More
                </summary>

                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-2xl border border-surface-200 bg-white p-1.5 shadow-card-lg">
                  <ul className="flex flex-col gap-1" aria-label="หมวดหมู่เพิ่มเติม">
                    {overflowMobileCategoryItems.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => handleMarketplaceNavigation(item.mode, item.href)}
                          className={cn(
                            "flex rounded-xl px-3 py-2.5 text-[14px] leading-[22px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
                            pathname === routes.marketplace &&
                              isMarketplaceCategoryActive(currentCategory, item.category)
                              ? "bg-surface-100 text-text-primary"
                              : "text-text-secondary hover:bg-surface-50 hover:text-text-primary",
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </div>
          </div>
        </Container>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white ${
        secondaryRow ? "" : "border-b border-surface-200"
      }`}
    >
      <Container
        className={
          headerSearch
            ? "grid gap-2.5 py-2.5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-5 lg:py-2"
            : "flex h-16 items-center justify-between gap-4 lg:gap-8"
        }
      >
        <div className="flex h-10 items-center lg:h-12">
          <NavbarBrand />
        </div>

        {headerSearch ? (
          <div className="order-3 min-w-0 lg:order-2 lg:mx-auto lg:w-full lg:max-w-[780px]">
            {headerSearch}
          </div>
        ) : null}

        <div className={headerSearch ? "order-2 ml-auto lg:order-3 lg:ml-0" : "ml-auto"}>
          <div className="hidden shrink-0 items-center gap-3.5 lg:flex">
            <nav className="hidden items-center gap-2 lg:flex" aria-label="เมนูหลัก">
              {NAV_LINKS.map(({ href, label }) => (
                <NavbarItem
                  key={href}
                  href={href}
                  onClick={() => handleHomeNavigation(href)}
                  variant="default"
                  className="h-10 rounded-full px-4 text-[14px] leading-[22px] font-semibold"
                >
                  {label}
                </NavbarItem>
              ))}
            </nav>

            {!isLoading && session?.user ? (
              <>
                <NavbarItem
                  href={routes.membership}
                  variant="default"
                  className="h-10 rounded-full border border-amber-200 bg-[linear-gradient(135deg,#fff8dc,#fff4bf)] px-4 text-[14px] leading-[22px] font-semibold text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-amber-300 hover:bg-[linear-gradient(135deg,#fff9e7,#fff1b0)] hover:text-amber-950"
                >
                  KC Plus
                </NavbarItem>
                <div className="mx-1 h-5 w-px bg-surface-200/70" aria-hidden />
              </>
            ) : null}

            {isLoading ? (
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-24 animate-pulse rounded-full bg-surface-100" />
                <div className="h-10 w-10 animate-pulse rounded-full bg-surface-100" />
              </div>
            ) : session?.user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="group transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
                  aria-label="เปิดเมนูบัญชี"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-controls={userMenuId}
                >
                  <AccountTrigger
                    name={session.user.name?.split(" ")[0] ?? "Account"}
                    image={session.user.image}
                    email={session.user.email}
                    isOpen={userMenuOpen}
                  />
                </button>

                {userMenuOpen ? renderUserMenu() : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavbarItem href={routes.login} variant="active" className="rounded-full">เข้าสู่ระบบ</NavbarItem>
                <NavbarItem href={routes.register} variant="secondary">
                  เริ่มต้นใช้งาน
                </NavbarItem>
              </div>
            )}
          </div>

          <button
            type="button"
            className="ml-auto rounded-lg p-1.5 text-text-secondary hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {mobileOpen ? (
        <div className="border-b border-surface-200 bg-white px-4 pb-5 pt-3 shadow-card-md lg:hidden">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <NavbarItem
                key={href}
                href={href}
                onClick={() => {
                  handleHomeNavigation(href);
                  closeAll();
                }}
                variant="default"
                mobile
              >
                {label}
              </NavbarItem>
            ))}
          </nav>

          {session?.user ? (
            <div className="mt-4">
              <NavbarItem
                href={routes.membership}
                onClick={closeAll}
                variant="default"
                mobile
                className="border border-amber-200 bg-[linear-gradient(135deg,#fff8dc,#fff4bf)] text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-amber-300 hover:bg-[linear-gradient(135deg,#fff9e7,#fff1b0)] hover:text-amber-950"
              >
                KC Plus
              </NavbarItem>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 border-t border-surface-100 pt-4">
            {session?.user ? (
              <>
                <div className="flex items-center gap-3 rounded-lg bg-surface-50 px-3 py-2.5">
                  <Avatar
                    src={session.user.image}
                    name={session.user.name}
                    email={session.user.email}
                    size={28}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {session.user.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">{session.user.email}</p>
                  </div>
                </div>

                <Link
                  href={routes.dashboard}
                  onClick={closeAll}
                  className="flex items-center gap-2.5 rounded-lg border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-50"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-text-muted" aria-hidden />
                    <span>Dashboard</span>
                  </span>
                </Link>

                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => void handleSignOut()}
                  className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={routes.login}
                  onClick={closeAll}
                  className="rounded-lg border border-surface-200 px-4 py-2.5 text-center font-thai text-sm font-medium text-text-secondary hover:bg-surface-50"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href={routes.register}
                  onClick={closeAll}
                  className="rounded-lg bg-brand-600 px-4 py-2.5 text-center font-thai text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  เริ่มต้นใช้งาน
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}

      {secondaryRow}
    </header>
  );
}

export function Navbar(props: {
  secondaryRow?: ReactNode;
  headerSearch?: ReactNode;
}) {
  return (
    <Suspense fallback={<NavbarFallback hasMarketplaceShell={Boolean(props.headerSearch)} />}>
      <NavbarInner {...props} />
    </Suspense>
  );
}
