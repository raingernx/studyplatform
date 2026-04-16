"use client";

import { useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import {
  CircleDollarSign,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";

import {
  Avatar,
  Badge,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  SidebarSectionLabel,
} from "@/design-system";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface AuthenticatedAccountDropdownViewer {
  name: string;
  email: string | null;
  image: string | null;
}

export type AccountDropdownNavigateHandler = (href: string) => void;

export const AUTHENTICATED_ACCOUNT_MENU_ACCOUNT_LINKS = [
  { href: routes.dashboardV2, label: "Dashboard home", icon: Home },
  { href: routes.dashboardV2Settings, label: "Settings", icon: Settings },
] as const;

export const AUTHENTICATED_ACCOUNT_MENU_CREATOR_LINKS = [
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

function isMenuLinkActive(pathname: string | null, href: string) {
  if (href === routes.dashboardV2) {
    return pathname === routes.dashboardV2;
  }

  if (href === routes.dashboardV2Membership) {
    return pathname === routes.dashboardV2Membership;
  }

  if (href === routes.dashboardV2Settings) {
    return pathname === routes.dashboardV2Settings;
  }

  if (href === routes.dashboardV2Creator) {
    return (
      pathname === routes.dashboardV2Creator ||
      pathname === routes.dashboardV2CreatorAnalytics ||
      pathname === routes.dashboardV2CreatorApply
    );
  }

  if (href === routes.dashboardV2CreatorResources) {
    return (
      pathname === routes.dashboardV2CreatorResources ||
      pathname?.startsWith(`${routes.dashboardV2CreatorResources}/`) === true
    );
  }

  if (href === routes.dashboardV2CreatorSales) {
    return (
      pathname === routes.dashboardV2CreatorSales ||
      pathname === routes.dashboardV2CreatorPayouts
    );
  }
  return pathname === href;
}

function AccountMenuTrigger({
  viewer,
  open,
}: {
  viewer: AuthenticatedAccountDropdownViewer;
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
        name={viewer.name}
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
  viewer: AuthenticatedAccountDropdownViewer;
}) {
  return (
    <div className="mb-2 border-b border-border-subtle px-2.5 pb-2 pt-1">
      <p className="flex min-w-0 items-baseline gap-1 text-xs font-medium text-foreground">
        <span className="shrink-0">Signed in as</span>
        <span className="min-w-0 truncate">{viewer.name}</span>
      </p>
      {viewer.email ? (
        <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">
          {viewer.email}
        </p>
      ) : null}
    </div>
  );
}

function MembershipItem({
  onWarmTargets,
  onNavigate,
  active,
}: {
  onWarmTargets?: () => void;
  onNavigate: AccountDropdownNavigateHandler;
  active: boolean;
}) {
  return (
    <IntentPrefetchLink
      href={routes.dashboardV2Membership}
      data-dashboard-account-link={routes.dashboardV2Membership}
      onMouseEnter={onWarmTargets}
      onFocus={onWarmTargets}
      onClick={() => {
        onNavigate(routes.dashboardV2Membership);
      }}
      className={cn(
        "mb-3 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
        active
          ? "border-highlight-500/35 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.22),transparent_56%),linear-gradient(135deg,rgba(91,33,182,0.14),rgba(15,23,42,0.05))]"
          : "border-highlight-500/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_52%),linear-gradient(135deg,rgba(91,33,182,0.08),rgba(15,23,42,0.02))] hover:bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.20),transparent_55%),linear-gradient(135deg,rgba(91,33,182,0.12),rgba(15,23,42,0.04))]",
      )}
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-highlight-500/15 text-highlight-600">
        <CreditCard aria-hidden className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-semibold text-foreground">
          Membership
        </span>
        <Badge
          variant="featured"
          className="shrink-0 px-1.5 py-0 text-[10px] leading-4"
        >
          Plans
        </Badge>
      </span>
    </IntentPrefetchLink>
  );
}

function MenuSection({
  label,
  items,
  onWarmTargets,
  onNavigate,
  pathname,
}: {
  label: string;
  items: readonly {
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }[];
  onWarmTargets?: () => void;
  onNavigate: AccountDropdownNavigateHandler;
  pathname: string | null;
}) {
  return (
    <div>
      <SidebarSectionLabel className="mb-1 mt-0 px-2.5">
        {label}
      </SidebarSectionLabel>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = isMenuLinkActive(pathname, item.href);

        return (
          <IntentPrefetchLink
            key={item.href}
            href={item.href}
            data-dashboard-account-link={item.href}
            onMouseEnter={onWarmTargets}
            onFocus={onWarmTargets}
            onClick={() => {
              onNavigate(item.href);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
              isActive
                ? "border-transparent bg-muted text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon
              aria-hidden
              className="h-[18px] w-[18px] shrink-0 opacity-80"
            />
            <span className="whitespace-nowrap text-[15px] leading-6">
              {item.label}
            </span>
          </IntentPrefetchLink>
        );
      })}
    </div>
  );
}

export function AuthenticatedAccountDropdown({
  viewer,
  isSigningOut,
  onSignOut,
  onNavigate,
  onWarmTargets,
  ariaLabel = "Open account menu",
}: {
  viewer: AuthenticatedAccountDropdownViewer;
  isSigningOut: boolean;
  onSignOut: () => void;
  onNavigate: AccountDropdownNavigateHandler;
  onWarmTargets?: () => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dropdown
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onWarmTargets?.();
        }
        setOpen(nextOpen);
      }}
    >
      <DropdownTrigger asChild>
        <button
          type="button"
          onMouseEnter={onWarmTargets}
          onFocus={onWarmTargets}
          aria-label={ariaLabel}
          data-dashboard-account-trigger="true"
          data-dashboard-account-ready="true"
          className="group inline-flex size-11 items-center justify-center rounded-full outline-none"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <AccountMenuTrigger viewer={viewer} open={open} />
        </button>
      </DropdownTrigger>

      <DropdownMenu
        align="end"
        className="w-[min(18rem,calc(100vw-1rem))] rounded-xl border-border-subtle bg-card p-0 shadow-card-lg"
        data-dashboard-account-menu="true"
        sideOffset={8}
      >
        <div className="p-2">
          <AccountDropdownContext viewer={viewer} />

          <MembershipItem
            active={isMenuLinkActive(pathname, routes.dashboardV2Membership)}
            onWarmTargets={onWarmTargets}
            onNavigate={onNavigate}
          />

          <MenuSection
            label="ACCOUNT"
            items={AUTHENTICATED_ACCOUNT_MENU_ACCOUNT_LINKS}
            onWarmTargets={onWarmTargets}
            onNavigate={onNavigate}
            pathname={pathname}
          />

          <div className="mt-3">
            <MenuSection
              label="CREATOR"
              items={AUTHENTICATED_ACCOUNT_MENU_CREATOR_LINKS}
              onWarmTargets={onWarmTargets}
              onNavigate={onNavigate}
              pathname={pathname}
            />
          </div>

          <DropdownSeparator />

          <DropdownItem
            className="rounded-xl px-2.5 py-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground"
            onSelect={(event) => {
              event.preventDefault();
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut
              aria-hidden
              className="h-[18px] w-[18px] shrink-0 opacity-80"
            />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </DropdownItem>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
}
