"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useId, useRef, useState } from "react";
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
import { Container } from "@/design-system";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";
import {
  clearCachedAuthViewer,
  primeAuthViewer,
  useAuthViewer,
} from "@/lib/auth/use-auth-viewer";
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
  "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[14px] leading-[22px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2";
const MARKETPLACE_PRIMARY_ACTION_CLASS_NAME =
  "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-brand-600 px-4 text-[14px] leading-[22px] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2";
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
      ? "border-border-strong bg-secondary text-secondary-foreground"
      : "border-transparent bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
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
      ? "border-border-strong bg-secondary text-secondary-foreground"
      : "border-transparent bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
  );
}

function NavbarFallback({
  hasMarketplaceShell,
}: {
  hasMarketplaceShell: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <Container className={hasMarketplaceShell ? "py-3 sm:py-4" : "h-16"}>
        <div className="flex h-10 items-center">
          <NavbarBrand />
        </div>
      </Container>
    </header>
  );
}

function NavbarAuthPlaceholder({
  marketplace = false,
  mobile = false,
}: {
  marketplace?: boolean;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <div className="flex items-center gap-2">
        <div
          aria-hidden="true"
          className="h-10 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="h-10 w-10 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", marketplace ? "" : "gap-2")}>
      <div
        aria-hidden="true"
        className={cn(
          "animate-pulse rounded-full bg-muted motion-reduce:animate-none",
          marketplace ? "h-10 w-28" : "h-10 w-24",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "animate-pulse rounded-full bg-muted motion-reduce:animate-none",
          marketplace ? "h-10 w-10" : "h-10 w-28",
        )}
      />
    </div>
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
  const authViewer = useAuthViewer({ strategy: "idle", idleTimeoutMs: 800 });
  const authUser = authViewer.user;
  const isMarketplaceNavbar = Boolean(headerSearch);
  const currentCategory = searchParams.get("category");
  const userMenuId = useId();
  const mobileMoreRef = useRef<HTMLDetailsElement | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const warmAuthViewer = useCallback(() => {
    void primeAuthViewer();
  }, []);

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
    clearCachedAuthViewer();

    try {
      await signOut({ callbackUrl: routes.home });
    } catch {
      setIsSigningOut(false);
    }
  }

  function renderUserMenu() {
    if (!authUser) {
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
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {authUser.name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {authUser.email}
              </p>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              href={routes.membership}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center rounded-lg px-3 py-2 text-[13px] font-medium text-amber-700 transition-colors hover:bg-amber-50"
            >
              KC Premium
            </Link>
            <div className="my-1 border-t border-border-subtle" />
            <Link
              href={routes.dashboard}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2.5">
                <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span>Dashboard</span>
              </span>
            </Link>
            <Link
              href={routes.library}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2.5">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span>My Library</span>
              </span>
            </Link>
            <Link
              href={routes.purchases}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2.5">
                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span>Purchases</span>
              </span>
            </Link>

            <div className="my-1.5 border-t border-border-subtle" />

            <Link
              href={routes.settings}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2.5">
                <Settings className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
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
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <Container className="py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
              <div className="flex h-11 shrink-0 items-center">
                <NavbarBrand />
              </div>

              <div className="hidden min-w-0 lg:block">
                {headerSearch}
              </div>

              <div
                className="ml-auto hidden items-center gap-2.5 lg:flex"
                onPointerEnter={warmAuthViewer}
                onFocusCapture={warmAuthViewer}
              >
                {authUser ? (
                  <>
                    <Link href={routes.library} className={MARKETPLACE_ACTION_LINK_CLASS_NAME}>
                      คลังของฉัน
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
                          name={authUser.name?.split(" ")[0] ?? "Account"}
                          image={authUser.image}
                          email={authUser.email}
                          isOpen={userMenuOpen}
                        />
                      </button>
                      {userMenuOpen ? renderUserMenu() : null}
                    </div>
                  </>
                ) : authViewer.isReady ? (
                  <>
                    <Link href={routes.login} className={cn(MARKETPLACE_CATEGORY_ITEM_CLASS_NAME, "border-border-strong bg-secondary text-secondary-foreground hover:border-border hover:bg-accent")}>
                      เข้าสู่ระบบ
                    </Link>
                    <Link href={routes.register} className={MARKETPLACE_PRIMARY_ACTION_CLASS_NAME}>
                      เริ่มต้นใช้งาน
                    </Link>
                  </>
                ) : (
                  <NavbarAuthPlaceholder marketplace />
                )}
              </div>

              {/* Scrollable links — overflow-x-auto would clip an absolute
                  dropdown, so the avatar button lives outside this div. */}
              <div
                className={cn("ml-auto flex min-w-0 max-w-[68vw] items-center gap-1.5 lg:hidden", HORIZONTAL_SCROLL_CLASS_NAME)}
                onPointerEnter={warmAuthViewer}
                onFocusCapture={warmAuthViewer}
              >
                {authUser ? (
                  <Link href={routes.library} className="inline-flex h-10 shrink-0 items-center rounded-full px-3 text-[14px] leading-[22px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2">
                    คลังของฉัน
                  </Link>
                ) : authViewer.isReady ? (
                  <>
                    <Link href={routes.login} className={cn(MARKETPLACE_CATEGORY_ITEM_CLASS_NAME, "border-border-strong bg-secondary px-3 text-secondary-foreground hover:border-border hover:bg-accent")}>
                      เข้าสู่ระบบ
                    </Link>
                    <Link href={routes.register} className="inline-flex h-10 shrink-0 items-center rounded-full bg-brand-600 px-3 text-[14px] leading-[22px] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2">
                      เริ่มต้นใช้งาน
                    </Link>
                  </>
                ) : (
                  <NavbarAuthPlaceholder mobile />
                )}
              </div>

              {/* Avatar sits outside overflow-x-auto so its dropdown is not clipped */}
              {authUser ? (
                <div className="relative shrink-0 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
                    aria-label="เปิดเมนูบัญชี"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-controls={userMenuId}
                  >
                    <Avatar
                      src={authUser.image}
                      name={authUser.name}
                      email={authUser.email}
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

                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-xl border border-border bg-card p-1.5">
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
                              ? "bg-secondary text-secondary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
      className={`sticky top-0 z-40 w-full bg-background ${
        secondaryRow ? "" : "border-b border-border"
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
          <div
            className="hidden shrink-0 items-center gap-3.5 lg:flex"
            onPointerEnter={warmAuthViewer}
            onFocusCapture={warmAuthViewer}
          >
            <nav className="hidden items-center gap-2 lg:flex" aria-label="เมนูหลัก">
              {NAV_LINKS.filter(({ href }) => href !== routes.library || Boolean(authUser)).map(({ href, label }) => (
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

            {authUser ? (
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
                    name={authUser.name?.split(" ")[0] ?? "Account"}
                    image={authUser.image}
                    email={authUser.email}
                    isOpen={userMenuOpen}
                  />
                </button>

                {userMenuOpen ? renderUserMenu() : null}
              </div>
            ) : authViewer.isReady ? (
              <div className="flex items-center gap-2">
                <NavbarItem href={routes.login} variant="active" className="rounded-full">เข้าสู่ระบบ</NavbarItem>
                <NavbarItem href={routes.register} variant="secondary">
                  เริ่มต้นใช้งาน
                </NavbarItem>
              </div>
            ) : (
              <NavbarAuthPlaceholder />
            )}
          </div>

          <button
            type="button"
            className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 lg:hidden"
            onClick={() => {
              warmAuthViewer();
              setMobileOpen((open) => !open);
            }}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {mobileOpen ? (
        <div className="border-b border-border bg-background px-4 pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
            {NAV_LINKS.filter(({ href }) => href !== routes.library || Boolean(authUser)).map(({ href, label }) => (
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

          <div className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4">
            {authUser ? (
              <>
                <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5">
                  <Avatar
                    src={authUser.image}
                    name={authUser.name}
                    email={authUser.email}
                    size={28}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {authUser.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{authUser.email}</p>
                  </div>
                </div>

                <Link
                  href={routes.membership}
                  onClick={closeAll}
                  className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
                >
                  KC Premium
                </Link>

                <Link
                  href={routes.dashboard}
                  onClick={closeAll}
                  className="flex items-center gap-2.5 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" aria-hidden />
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
            ) : authViewer.isReady ? (
              <>
                <Link
                  href={routes.login}
                  onClick={closeAll}
                  className="rounded-lg border border-border-strong bg-card px-4 py-2.5 text-center font-thai text-sm font-medium text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground"
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
            ) : (
              <div className="grid gap-2">
                <div
                  aria-hidden="true"
                  className="h-10 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
                />
                <div
                  aria-hidden="true"
                  className="h-10 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
                />
              </div>
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
