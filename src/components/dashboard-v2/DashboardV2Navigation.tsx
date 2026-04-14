"use client";

import { useEffect, useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowDownToLine,
  Bell,
  CircleDollarSign,
  CreditCard,
  FileText,
  Home,
  Library,
  LogIn,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
  SearchInput,
  SidebarItem,
  SidebarSectionLabel,
} from "@/design-system";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

type NavKey =
  | "home"
  | "library"
  | "downloads"
  | "purchases"
  | "membership"
  | "settings"
  | "creator"
  | "creator-resources"
  | "creator-earnings";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  activeKey?: NavKey;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export interface DashboardV2Viewer {
  displayName: string;
  email: string | null;
  image: string | null;
  role: string | null;
  subscriptionStatus: string | null;
  isAuthenticated: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { label: "Home", icon: Home, href: routes.dashboardV2, activeKey: "home" },
      {
        label: "Library",
        icon: Library,
        href: routes.dashboardV2Library,
        activeKey: "library",
      },
      {
        label: "Downloads",
        icon: ArrowDownToLine,
        href: routes.dashboardV2Downloads,
        activeKey: "downloads",
      },
      {
        label: "Purchases",
        icon: ReceiptText,
        href: routes.dashboardV2Purchases,
        activeKey: "purchases",
      },
    ],
  },
  {
    label: "Creator",
    items: [
      {
        label: "Workspace",
        icon: Sparkles,
        href: routes.dashboardV2Creator,
        activeKey: "creator",
      },
      {
        label: "Resources",
        icon: FileText,
        href: routes.dashboardV2CreatorResources,
        activeKey: "creator-resources",
      },
      {
        label: "Earnings",
        icon: CircleDollarSign,
        href: routes.dashboardV2CreatorSales,
        activeKey: "creator-earnings",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Membership",
        icon: CreditCard,
        href: routes.dashboardV2Membership,
        activeKey: "membership",
      },
      {
        label: "Settings",
        icon: Settings,
        href: routes.dashboardV2Settings,
        activeKey: "settings",
      },
    ],
  },
];

const ACCOUNT_LINKS = [
  { href: routes.dashboardV2, label: "Dashboard home", icon: Home },
  {
    href: routes.dashboardV2Membership,
    label: "Membership",
    icon: CreditCard,
  },
  { href: routes.dashboardV2Settings, label: "Settings", icon: Settings },
] as const;

const CREATOR_LINKS = [
  {
    href: routes.dashboardV2Creator,
    label: "Creator workspace",
    icon: Sparkles,
  },
  {
    href: routes.dashboardV2CreatorResources,
    label: "Creator resources",
    icon: FileText,
  },
  {
    href: routes.dashboardV2CreatorSales,
    label: "Creator earnings",
    icon: CircleDollarSign,
  },
] as const;

function getAccountStatusBadge(status: DashboardV2Viewer["subscriptionStatus"]) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return { label: "Active", variant: "success" as const };
    case "CANCELED":
      return { label: "Ending", variant: "warning" as const };
    case "PAST_DUE":
      return { label: "Action needed", variant: "warning" as const };
    default:
      return null;
  }
}

function getActiveKey(pathname: string | null): NavKey {
  if (pathname === routes.dashboardV2Library) return "library";
  if (pathname === routes.dashboardV2Downloads) return "downloads";
  if (pathname === routes.dashboardV2Purchases) return "purchases";
  if (pathname === routes.dashboardV2Membership) return "membership";
  if (pathname === routes.dashboardV2Settings) return "settings";
  if (pathname === routes.dashboardV2CreatorResources) return "creator-resources";
  if (pathname?.startsWith(`${routes.dashboardV2CreatorResources}/`)) {
    return "creator-resources";
  }
  if (pathname === routes.dashboardV2CreatorAnalytics) return "creator";
  if (pathname === routes.dashboardV2CreatorSales) return "creator-earnings";
  if (pathname === routes.dashboardV2CreatorPayouts) return "creator-earnings";
  if (pathname === routes.dashboardV2CreatorProfile) return "creator";
  if (pathname === routes.dashboardV2CreatorSettings) return "creator";
  if (pathname?.startsWith(routes.dashboardV2Creator)) return "creator";
  return "home";
}

function NavigationList({ closeOnNavigate = false }: { closeOnNavigate?: boolean }) {
  const activeKey = getActiveKey(usePathname());
  const prefetchMode = closeOnNavigate ? "intent" : "viewport";
  const prefetchScope = closeOnNavigate
    ? "dashboard-v2-sidebar-drawer"
    : "dashboard-v2-sidebar-rail";

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = item.activeKey === activeKey;
              const link = (
                <SidebarItem
                  key={item.label}
                  active={isActive}
                  asChild
                  aria-current={isActive ? "page" : undefined}
                  icon={item.icon}
                >
                  <IntentPrefetchLink
                    href={item.href}
                    prefetchLimit={12}
                    prefetchMode={prefetchMode}
                    prefetchScope={prefetchScope}
                  >
                    {item.label}
                  </IntentPrefetchLink>
                </SidebarItem>
              );

              return closeOnNavigate ? (
                <DialogPrimitive.Close key={item.label} asChild>
                  {link}
                </DialogPrimitive.Close>
              ) : (
                link
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarIdentity() {
  return (
    <div className="border-b border-border-subtle px-5 py-4">
      <div className="flex items-center">
        <span
          className="theme-logo-stack theme-logo-stack--auto h-[36px] w-[148px]"
          aria-label="Krukraft logo"
        >
          <span className="theme-logo-layer theme-logo-layer--light">
            <img
              src="/brand/krukraft-logo.svg"
              alt=""
              width={121}
              height={40}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="block h-full w-full object-contain object-left"
            />
          </span>
          <span className="theme-logo-layer theme-logo-layer--dark">
            <img
              src="/brand/krukraft-logo-dark.svg"
              alt="Krukraft logo"
              width={121}
              height={40}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="block h-full w-full object-contain object-left"
            />
          </span>
        </span>
      </div>
    </div>
  );
}

function SidebarCallout({
  closeOnNavigate = false,
}: {
  closeOnNavigate?: boolean;
}) {
  const prefetchMode = closeOnNavigate ? "intent" : "viewport";
  const checklistButton = (
    <Button className="mt-3" size="sm" variant="secondary" fullWidth asChild>
      <IntentPrefetchLink
        href={routes.dashboardV2Creator}
        prefetchLimit={4}
        prefetchMode={prefetchMode}
        prefetchScope="dashboard-v2-sidebar-callout"
      >
        Open checklist
      </IntentPrefetchLink>
    </Button>
  );

  return (
    <div className="border-t border-border-subtle p-4">
      <div className="rounded-xl border border-border-subtle bg-muted/50 p-4">
        <Badge variant="featured">Creator-ready</Badge>
        <p className="mt-3 text-sm font-semibold text-foreground">
          Start selling resources
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Upload a worksheet pack and track sales from one workspace.
        </p>
        {closeOnNavigate ? (
          <DialogPrimitive.Close asChild>{checklistButton}</DialogPrimitive.Close>
        ) : (
          checklistButton
        )}
      </div>
    </div>
  );
}

function SidebarContent({
  closeOnNavigate = false,
}: {
  closeOnNavigate?: boolean;
}) {
  return (
    <>
      <SidebarIdentity />
      <NavigationList closeOnNavigate={closeOnNavigate} />
      <SidebarCallout closeOnNavigate={closeOnNavigate} />
    </>
  );
}

export function DashboardV2Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border-subtle bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:self-start lg:flex-col lg:overflow-hidden">
      <SidebarContent />
    </aside>
  );
}

function AccountMenuTrigger({
  viewer,
  open,
}: {
  viewer: DashboardV2Viewer;
  open: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border transition-all group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
        open
          ? "border-border bg-accent shadow-[0_6px_16px_rgba(15,23,42,0.12)]"
          : "border-border-subtle bg-card/90 hover:border-border hover:bg-muted/55",
      )}
    >
      <Avatar
        src={viewer.image}
        name={viewer.displayName}
        email={viewer.email}
        size={32}
        className="ring-1 ring-border-subtle"
      />
    </span>
  );
}

function AccountDropdownContext({
  viewer,
}: {
  viewer: DashboardV2Viewer;
}) {
  const detail = viewer.isAuthenticated
    ? viewer.email
    : "Sign in to unlock dashboard actions.";
  const statusBadge = viewer.isAuthenticated
    ? getAccountStatusBadge(viewer.subscriptionStatus)
    : null;

  return (
    <div className="mb-2 border-b border-border-subtle px-2.5 pb-2 pt-1">
      {viewer.isAuthenticated ? (
        <div className="flex min-w-0 items-center gap-2">
          <p className="flex min-w-0 flex-1 items-baseline gap-1 text-xs font-medium text-foreground">
            <span className="shrink-0">Signed in as</span>
            <span className="min-w-0 truncate">{viewer.displayName}</span>
          </p>
          {statusBadge ? (
            <Badge
              className="shrink-0 px-1.5 py-0 text-[10px] leading-4"
              variant={statusBadge.variant}
            >
              {statusBadge.label}
            </Badge>
          ) : null}
        </div>
      ) : (
        <p className="text-xs font-medium text-foreground">Preview access</p>
      )}
      {detail ? (
        <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function AccountDropdown({
  viewer,
}: {
  viewer: DashboardV2Viewer;
}) {
  const [open, setOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <Dropdown modal={false} open={open} onOpenChange={setOpen}>
      <DropdownTrigger asChild>
        <button
          type="button"
          aria-label="Open dashboard account menu"
          data-dashboard-account-trigger="true"
          data-dashboard-account-ready={isHydrated ? "true" : "false"}
          className="group inline-flex size-11 items-center justify-center rounded-full outline-none"
        >
          <AccountMenuTrigger viewer={viewer} open={open} />
        </button>
      </DropdownTrigger>

      <DropdownMenu
        align="end"
        className="w-[min(17rem,calc(100vw-1rem))] rounded-xl border-border-subtle bg-card p-0 shadow-card-lg"
        data-dashboard-account-menu="true"
        sideOffset={8}
      >
        <div className="p-2">
          <AccountDropdownContext viewer={viewer} />

          {viewer.isAuthenticated ? (
            <>
              <div>
                <SidebarSectionLabel className="mb-1 mt-0 px-2.5">
                  ACCOUNT
                </SidebarSectionLabel>
                {ACCOUNT_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownItem
                      key={item.href}
                      asChild
                      className="rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground"
                    >
                      <IntentPrefetchLink
                        href={item.href}
                        data-dashboard-account-link={item.href}
                        prefetchLimit={6}
                        prefetchScope="dashboard-v2-account-menu"
                      >
                        <Icon
                          aria-hidden
                          className="h-[18px] w-[18px] shrink-0 opacity-80"
                        />
                        {item.label}
                      </IntentPrefetchLink>
                    </DropdownItem>
                  );
                })}
              </div>

              <div>
                <SidebarSectionLabel className="mb-1 mt-3 px-2.5">
                  CREATOR
                </SidebarSectionLabel>
                {CREATOR_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownItem
                      key={item.href}
                      asChild
                      className="rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground"
                    >
                      <IntentPrefetchLink
                        href={item.href}
                        data-dashboard-account-link={item.href}
                        prefetchLimit={6}
                        prefetchScope="dashboard-v2-account-menu"
                      >
                        <Icon
                          aria-hidden
                          className="h-[18px] w-[18px] shrink-0 opacity-80"
                        />
                        {item.label}
                      </IntentPrefetchLink>
                    </DropdownItem>
                  );
                })}
              </div>

              <DropdownSeparator />

              <DropdownItem
                className="rounded-xl px-2.5 py-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground"
                onSelect={(event) => {
                  event.preventDefault();
                  setOpen(false);
                  void signOut({ callbackUrl: routes.home });
                }}
              >
                <LogOut
                  aria-hidden
                  className="h-[18px] w-[18px] shrink-0 opacity-80"
                />
                Sign out
              </DropdownItem>
            </>
          ) : (
            <>
              <div>
                <SidebarSectionLabel className="mb-1 mt-0 px-2.5">
                  GET STARTED
                </SidebarSectionLabel>
                <DropdownItem
                  asChild
                  className="rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground"
                >
                  <IntentPrefetchLink
                    href={routes.loginWithNext(routes.dashboardV2)}
                    data-dashboard-account-link={routes.loginWithNext(routes.dashboardV2)}
                    prefetchLimit={4}
                    prefetchScope="dashboard-v2-account-menu"
                  >
                    <LogIn
                      aria-hidden
                      className="h-[18px] w-[18px] shrink-0 opacity-80"
                    />
                    Sign in
                  </IntentPrefetchLink>
                </DropdownItem>
                <DropdownItem
                  asChild
                  className="rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground"
                >
                  <IntentPrefetchLink
                    href={routes.register}
                    data-dashboard-account-link={routes.register}
                    prefetchLimit={4}
                    prefetchScope="dashboard-v2-account-menu"
                  >
                    <Sparkles
                      aria-hidden
                      className="h-[18px] w-[18px] shrink-0 opacity-80"
                    />
                    Create account
                  </IntentPrefetchLink>
                </DropdownItem>
                <DropdownItem
                  asChild
                  className="rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground"
                >
                  <IntentPrefetchLink
                    href={routes.dashboardV2Membership}
                    data-dashboard-account-link={routes.dashboardV2Membership}
                    prefetchLimit={4}
                    prefetchScope="dashboard-v2-account-menu"
                  >
                    <CreditCard
                      aria-hidden
                      className="h-[18px] w-[18px] shrink-0 opacity-80"
                    />
                    Explore membership
                  </IntentPrefetchLink>
                </DropdownItem>
              </div>
            </>
          )}
        </div>
      </DropdownMenu>
    </Dropdown>
  );
}

export function DashboardV2Topbar({ viewer }: { viewer: DashboardV2Viewer }) {
  return (
    <DialogPrimitive.Root>
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-background/95 px-4 pt-3 pb-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <DialogPrimitive.Trigger asChild>
            <Button
              aria-label="Open dashboard navigation"
              className="size-11 lg:hidden"
              onClick={() => {
                const activeElement = document.activeElement;
                if (activeElement instanceof HTMLElement) {
                  activeElement.blur();
                }
              }}
              size="icon"
              variant="ghost"
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </DialogPrimitive.Trigger>

          <div className="min-w-0 flex-1">
            <SearchInput
              aria-label="Search dashboard preview"
              className="h-11"
              containerClassName="max-w-2xl"
              disabled
              id="dashboard-v2-search-preview"
              name="dashboardPreviewSearch"
              placeholder="Search preview disabled in prototype"
              title="Prototype control: search is not wired yet"
            />
          </div>

          <Button
            aria-label="Notifications preview is disabled"
            className="size-11"
            disabled
            size="icon"
            title="Prototype control: notifications are not wired yet"
            variant="ghost"
          >
            <Bell className="size-5" aria-hidden />
          </Button>

          <AccountDropdown viewer={viewer} />
        </div>
      </header>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[hsl(var(--card)/0.78)] backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-border-subtle bg-card shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left lg:hidden">
          <DialogPrimitive.Title className="sr-only">
            Dashboard V2 navigation
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Navigate between Dashboard V2 prototype sections.
          </DialogPrimitive.Description>
          <DialogPrimitive.Close asChild>
            <Button
              aria-label="Close dashboard navigation"
              className="absolute right-3 top-3 size-11"
              size="icon"
              variant="ghost"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </DialogPrimitive.Close>
          <SidebarContent closeOnNavigate />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
