"use client";

import {
  Suspense,
  startTransition,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useRef, useState } from "react";
import {
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Avatar, Badge, Container, SidebarSectionLabel } from "@/design-system";
import {
  AuthenticatedAccountDropdown,
  AUTHENTICATED_ACCOUNT_MENU_ACCOUNT_LINKS,
  AUTHENTICATED_ACCOUNT_MENU_CREATOR_LINKS,
} from "@/components/layout/account/AuthenticatedAccountDropdown";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { NavbarBrand } from "@/components/layout/NavbarBrand";
import {
  MarketplaceAvatarPlaceholder,
  MarketplaceLibraryPlaceholder,
  NavbarShell,
} from "@/components/layout/NavbarShell";
import { NavbarItem } from "@/components/layout/navbar/NavbarItem";
import {
  beginResourcesNavigation,
  isResourcesSubtreePath,
} from "@/components/marketplace/resourcesNavigationState";
import { beginDashboardNavigation } from "@/components/layout/dashboard/dashboardNavigationState";
import { isDashboardGroupPath } from "@/components/providers/dashboardNavigationOverlayShared";
import {
  clearCachedAuthViewer,
  primeAuthViewer,
  useAuthViewer,
} from "@/lib/auth/use-auth-viewer";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: routes.marketplace, label: "มาร์เก็ตเพลส" },
  { href: routes.dashboardV2Library, label: "คลังของฉัน" },
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
const PROTECTED_AREA_PREFETCH_TARGETS = [
  routes.dashboardV2,
  routes.dashboardV2Library,
  routes.dashboardV2Purchases,
  routes.dashboardV2Settings,
  routes.dashboardV2Membership,
] as const;

type ProtectedAreaLinkHandler = (
  event: ReactMouseEvent<HTMLAnchorElement>,
  href: string,
  afterNavigation?: () => void,
) => void;

function PublicAccountDrawerSection({
  label,
  items,
  onWarmProtectedAreaTargets,
  onProtectedAreaLinkClick,
  onClose,
}: {
  label: string;
  items: readonly { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  onWarmProtectedAreaTargets: () => void;
  onProtectedAreaLinkClick: ProtectedAreaLinkHandler;
  onClose: () => void;
}) {
  return (
    <div>
      <SidebarSectionLabel className="mb-1 mt-0 px-1">{label}</SidebarSectionLabel>
      <div className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <IntentPrefetchLink
              key={item.href}
              href={item.href}
              data-dashboard-account-link={item.href}
              prefetchLimit={6}
              prefetchScope="public-account-menu"
              onMouseEnter={onWarmProtectedAreaTargets}
              onFocus={onWarmProtectedAreaTargets}
              onClick={(event) => {
                onProtectedAreaLinkClick(event, item.href, onClose);
              }}
              className="inline-flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
            >
              <Icon aria-hidden className="h-[18px] w-[18px] shrink-0 opacity-80" />
              {item.label}
            </IntentPrefetchLink>
          );
        })}
      </div>
    </div>
  );
}

function isMarketplaceCategoryActive(currentCategory: string | null, itemCategory: string | null) {
  if (itemCategory === null) {
    return currentCategory === null;
  }

  return currentCategory === itemCategory;
}

function handleProtectedAreaNavigation(href: string) {
  if (
    href === routes.dashboardV2 ||
    href === routes.dashboardV2Library ||
    href === routes.dashboardV2Downloads ||
    href === routes.dashboardV2Purchases ||
    href === routes.dashboardV2Settings ||
    href === routes.dashboardV2Membership ||
    href.startsWith("/dashboard-v2/")
  ) {
    beginDashboardNavigation(href, { overlay: true });
  }
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

function NavbarAuthPlaceholder() {
  return (
    <div className="flex items-center gap-2">
      <div
        aria-hidden="true"
        className="h-10 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="h-10 w-28 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const authViewer = useAuthViewer({ hydrateFromCache: false });
  const authUser = authViewer.user;
  const isMarketplaceNavbar = Boolean(headerSearch);
  const currentCategory = searchParams.get("category");
  const mobileMoreRef = useRef<HTMLDetailsElement | null>(null);
  const protectedAreaPrefetchedRef = useRef(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const warmAuthViewer = useCallback(() => {
    void primeAuthViewer();
  }, []);
  const warmProtectedAreaTargets = useCallback(() => {
    warmAuthViewer();

    if (protectedAreaPrefetchedRef.current) {
      return;
    }

    protectedAreaPrefetchedRef.current = true;

    for (const href of PROTECTED_AREA_PREFETCH_TARGETS) {
      startTransition(() => {
        router.prefetch(href);
      });
    }
  }, [router, warmAuthViewer]);

  const visibleMobileCategoryItems = MARKETPLACE_CATEGORY_ITEMS.slice(0, MOBILE_VISIBLE_CATEGORY_COUNT);
  const overflowMobileCategoryItems = MARKETPLACE_CATEGORY_ITEMS.slice(MOBILE_VISIBLE_CATEGORY_COUNT);
  const isMoreMenuActive = overflowMobileCategoryItems.some((item) =>
    isMarketplaceCategoryActive(currentCategory, item.category),
  );

  function closeMobileMoreMenu() {
    mobileMoreRef.current?.removeAttribute("open");
  }

  useEffect(() => {
    protectedAreaPrefetchedRef.current = false;
  }, [authUser?.id]);

  function closeAll() {
    setMobileOpen(false);
    closeMobileMoreMenu();
  }

  function handleHomeNavigation(href: string) {
    if (href === routes.marketplace) {
      beginResourcesNavigation("discover", href, {
        overlay: !isResourcesSubtreePath(pathname),
      });
      return;
    }

    handleProtectedAreaNavigation(href);
  }

  function handlePrimaryNavigation(href: string) {
    if (href === routes.marketplace) {
      handleHomeNavigation(href);
      return;
    }

    handleProtectedAreaNavigation(href);
  }

  function handleMarketplaceNavigation(mode: "discover" | "listing", href: string) {
    beginResourcesNavigation(mode, href, {
      overlay: !isResourcesSubtreePath(pathname),
    });
    closeMobileMoreMenu();
  }

  function shouldIgnoreLinkEvent(event: ReactMouseEvent<HTMLAnchorElement>) {
    return (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    );
  }

  function handleProtectedAreaLinkClick(
    href: string,
    afterNavigation?: () => void,
  ) {
    const useDashboardEntryOverlay =
      !isDashboardGroupPath(pathname) &&
      href !== routes.dashboardV2Settings &&
      href !== routes.dashboardV2Membership;

    if (
      href === routes.dashboardV2 ||
      href === routes.dashboardV2Library ||
      href === routes.dashboardV2Downloads ||
      href === routes.dashboardV2Purchases ||
      href === routes.dashboardV2Settings ||
      href === routes.dashboardV2Membership ||
      href.startsWith("/dashboard-v2/")
    ) {
      beginDashboardNavigation(href, { overlay: useDashboardEntryOverlay });
    }
  }

  function commitProtectedAreaNavigation(
    href: string,
    afterNavigation?: () => void,
  ) {
    handleProtectedAreaLinkClick(href);
    startTransition(() => {
      router.push(href);
    });

    afterNavigation?.();
  }

  function handleProtectedAreaAnchorClick(
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string,
    afterNavigation?: () => void,
  ) {
    if (shouldIgnoreLinkEvent(event)) {
      return;
    }

    event.preventDefault();
    commitProtectedAreaNavigation(href, afterNavigation);
  }

  function handlePrimaryLinkClick(
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string,
    afterNavigation?: () => void,
  ) {
    if (shouldIgnoreLinkEvent(event)) {
      return;
    }

    if (href === routes.marketplace) {
      handlePrimaryNavigation(href);
      afterNavigation?.();
      return;
    }

    handleProtectedAreaAnchorClick(event, href, afterNavigation);
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
                className="ml-auto hidden min-w-[176px] items-center justify-end gap-2.5 lg:flex"
                onPointerEnter={warmProtectedAreaTargets}
                onFocusCapture={warmProtectedAreaTargets}
              >
                {authUser ? (
                  <>
                    <IntentPrefetchLink
                      href={routes.dashboardV2Library}
                      data-public-library-link="true"
                      prefetchLimit={6}
                      prefetchScope="public-navbar"
                      onMouseEnter={warmProtectedAreaTargets}
                      onFocus={warmProtectedAreaTargets}
                      onClick={(event) => handleProtectedAreaAnchorClick(event, routes.dashboardV2Library)}
                      className={MARKETPLACE_ACTION_LINK_CLASS_NAME}
                    >
                      คลังของฉัน
                    </IntentPrefetchLink>
                    <AuthenticatedAccountDropdown
                      viewer={{
                        name: authUser.name ?? "Account",
                        email: authUser.email,
                        image: authUser.image,
                      }}
                      isSigningOut={isSigningOut}
                      onSignOut={() => {
                        void handleSignOut();
                      }}
                      onWarmTargets={warmProtectedAreaTargets}
                      onNavigate={handleProtectedAreaLinkClick}
                      ariaLabel="เปิดเมนูบัญชี"
                    />
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
                  <>
                    <MarketplaceLibraryPlaceholder />
                    <MarketplaceAvatarPlaceholder />
                  </>
                )}
              </div>

              {/* Scrollable links — overflow-x-auto would clip an absolute
                  dropdown, so the avatar button lives outside this div. */}
              <div
                className={cn("ml-auto flex min-w-0 max-w-[68vw] items-center gap-1.5 lg:hidden", HORIZONTAL_SCROLL_CLASS_NAME)}
                onPointerEnter={warmProtectedAreaTargets}
                onFocusCapture={warmProtectedAreaTargets}
              >
                {authUser ? (
                  <IntentPrefetchLink
                    href={routes.dashboardV2Library}
                    data-public-library-link="true"
                    prefetchLimit={6}
                    prefetchScope="public-navbar"
                    onMouseEnter={warmProtectedAreaTargets}
                    onFocus={warmProtectedAreaTargets}
                    onClick={(event) => handleProtectedAreaAnchorClick(event, routes.dashboardV2Library)}
                    className="inline-flex h-10 shrink-0 items-center rounded-full px-3 text-[14px] leading-[22px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
                  >
                    คลังของฉัน
                  </IntentPrefetchLink>
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
                  <MarketplaceLibraryPlaceholder />
                )}
              </div>

              {/* Avatar sits outside overflow-x-auto so its dropdown is not clipped */}
              {authUser ? (
                <div className="shrink-0 lg:hidden">
                  <AuthenticatedAccountDropdown
                    viewer={{
                      name: authUser.name ?? "Account",
                      email: authUser.email,
                      image: authUser.image,
                    }}
                    isSigningOut={isSigningOut}
                    onSignOut={() => {
                      void handleSignOut();
                    }}
                    onWarmTargets={warmProtectedAreaTargets}
                    onNavigate={handleProtectedAreaLinkClick}
                    ariaLabel="เปิดเมนูบัญชี"
                  />
                </div>
              ) : !authViewer.isReady ? (
                <div className="shrink-0 lg:hidden">
                  <MarketplaceAvatarPlaceholder />
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
            onPointerEnter={warmProtectedAreaTargets}
            onFocusCapture={warmProtectedAreaTargets}
          >
            <nav className="hidden items-center gap-2 lg:flex" aria-label="เมนูหลัก">
              {NAV_LINKS.filter(({ href }) => href !== routes.dashboardV2Library || Boolean(authUser)).map(({ href, label }) => (
                <NavbarItem
                  key={href}
                  href={href}
                  onClick={(event) => handlePrimaryLinkClick(event, href)}
                  variant="default"
                  className="h-10 rounded-full px-4 text-[14px] leading-[22px] font-semibold"
                >
                  {label}
                </NavbarItem>
              ))}
            </nav>

            {authUser ? (
              <div className="relative">
                <AuthenticatedAccountDropdown
                  viewer={{
                    name: authUser.name ?? "Account",
                    email: authUser.email,
                    image: authUser.image,
                  }}
                  isSigningOut={isSigningOut}
                  onSignOut={() => {
                    void handleSignOut();
                  }}
                  onWarmTargets={warmProtectedAreaTargets}
                  onNavigate={handleProtectedAreaLinkClick}
                  ariaLabel="เปิดเมนูบัญชี"
                />
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
            {NAV_LINKS.filter(({ href }) => href !== routes.dashboardV2Library || Boolean(authUser)).map(({ href, label }) => (
              <NavbarItem
                key={href}
                href={href}
                onClick={(event) => {
                  handlePrimaryLinkClick(event, href, closeAll);
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

                <IntentPrefetchLink
                  href={routes.dashboardV2Membership}
                  prefetchLimit={6}
                  prefetchScope="public-account-menu"
                  onMouseEnter={warmProtectedAreaTargets}
                  onFocus={warmProtectedAreaTargets}
                  onClick={(event) => {
                    handleProtectedAreaAnchorClick(event, routes.dashboardV2Membership, closeAll);
                  }}
                  className="group flex items-center gap-3 rounded-2xl border border-highlight-500/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.20),transparent_55%),linear-gradient(135deg,rgba(91,33,182,0.10),rgba(15,23,42,0.02))] px-3.5 py-3 text-left transition-all hover:border-highlight-500/35 hover:bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),transparent_58%),linear-gradient(135deg,rgba(91,33,182,0.14),rgba(15,23,42,0.04))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-highlight-500/15 text-highlight-600">
                    <CreditCard aria-hidden className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">Membership</span>
                      <Badge variant="featured" className="px-1.5 py-0 text-[10px] leading-4">
                        Plans
                      </Badge>
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      Plans, perks, and account benefits in one place.
                    </span>
                  </span>
                </IntentPrefetchLink>

                <PublicAccountDrawerSection
                  label="ACCOUNT"
                  items={AUTHENTICATED_ACCOUNT_MENU_ACCOUNT_LINKS}
                  onWarmProtectedAreaTargets={warmProtectedAreaTargets}
                  onProtectedAreaLinkClick={handleProtectedAreaAnchorClick}
                  onClose={closeAll}
                />

                <PublicAccountDrawerSection
                  label="CREATOR"
                  items={AUTHENTICATED_ACCOUNT_MENU_CREATOR_LINKS}
                  onWarmProtectedAreaTargets={warmProtectedAreaTargets}
                  onProtectedAreaLinkClick={handleProtectedAreaAnchorClick}
                  onClose={closeAll}
                />

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
    <Suspense
      fallback={
        <NavbarShell hasMarketplaceShell={Boolean(props.headerSearch)} />
      }
    >
      <NavbarInner {...props} />
    </Suspense>
  );
}
