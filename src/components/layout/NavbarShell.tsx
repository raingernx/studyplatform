"use client";

import type { ReactNode } from "react";

import { NavbarBrand } from "@/components/layout/NavbarBrand";
import { Container } from "@/design-system";
import { cn } from "@/lib/utils";

const HORIZONTAL_SCROLL_CLASS_NAME =
  "overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const MARKETPLACE_CATEGORY_SKELETON_ITEMS = [
  { width: "w-[54px]", active: true },
  { width: "w-[52px]", active: false },
  { width: "w-[176px]", active: false },
  { width: "w-[56px]", active: false },
  { width: "w-[84px]", active: false },
  { width: "w-[40px]", active: false },
  { width: "w-[76px]", active: false },
  { width: "w-[88px]", active: false },
  { width: "w-[110px]", active: false },
  { width: "w-[64px]", active: false },
] as const;

export function NavbarShellAuthPlaceholder() {
  return (
    <div className="flex items-center gap-2">
      <div
        aria-hidden="true"
        className="h-10 w-24 rounded-full bg-muted"
      />
      <div
        aria-hidden="true"
        className="h-10 w-10 rounded-full bg-muted"
      />
    </div>
  );
}

export function MarketplaceLibraryPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="h-10 w-[108px] shrink-0 rounded-full bg-muted"
    />
  );
}

export function MarketplaceAvatarPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-card/90"
    >
      <div className="h-8 w-8 rounded-full bg-muted" />
    </div>
  );
}

export function NavbarShell({
  hasMarketplaceShell = false,
  headerSearch,
  secondaryRow,
}: {
  hasMarketplaceShell?: boolean;
  headerSearch?: ReactNode;
  secondaryRow?: ReactNode;
}) {
  if (hasMarketplaceShell) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <Container className="py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
              <div className="flex h-11 shrink-0 items-center">
                <NavbarBrand />
              </div>

              <div className="hidden min-w-0 lg:block">
                {headerSearch ?? (
                  <div
                    aria-hidden="true"
                    className="h-11 w-full rounded-full border border-border bg-background"
                  />
                )}
              </div>

              <div className="ml-auto hidden min-w-[176px] items-center justify-end gap-2.5 lg:flex">
                <MarketplaceLibraryPlaceholder />
                <MarketplaceAvatarPlaceholder />
              </div>

              <div
                className={cn(
                  "ml-auto flex min-w-0 max-w-[68vw] items-center gap-1.5 lg:hidden",
                  HORIZONTAL_SCROLL_CLASS_NAME,
                )}
              >
                <MarketplaceLibraryPlaceholder />
              </div>

              <div className="shrink-0 lg:hidden">
                <MarketplaceAvatarPlaceholder />
              </div>
            </div>

            {secondaryRow ?? (
              <div
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap",
                  HORIZONTAL_SCROLL_CLASS_NAME,
                )}
              >
                {MARKETPLACE_CATEGORY_SKELETON_ITEMS.map((item, index) => (
                  <div
                    key={`${item.width}-${index}`}
                    aria-hidden="true"
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4",
                      item.active
                        ? "border border-border-strong bg-secondary"
                        : "bg-transparent",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 rounded bg-muted",
                        item.width,
                        item.active && "bg-muted-foreground/45",
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <Container className="h-16">
        <div className="flex h-10 items-center justify-between gap-3">
          <NavbarBrand />
          <NavbarShellAuthPlaceholder />
        </div>
      </Container>
    </header>
  );
}
