import type { ComponentProps, ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// Container + Layout
// ──────────────────────────────────────────────────────────────────────────────

interface SidebarContainerProps
  extends Omit<ComponentProps<"aside">, "children"> {
  children: ReactNode;
  collapsed?: boolean;
}

export function SidebarContainer({
  children,
  className,
  collapsed = false,
  ...props
}: SidebarContainerProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col bg-white border-r border-gray-200",
        collapsed ? "w-16" : "w-64",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

interface SidebarNavProps extends ComponentProps<"div"> {
  children: ReactNode;
}

export function SidebarNav({ children, className, ...props }: SidebarNavProps) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-3 py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sections
// ──────────────────────────────────────────────────────────────────────────────

interface SidebarSectionProps extends ComponentProps<"div"> {
  children: ReactNode;
}

export function SidebarSection({
  children,
  className,
  ...props
}: SidebarSectionProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

interface SidebarSectionLabelProps extends ComponentProps<"p"> {
  children: ReactNode;
}

export function SidebarSectionLabel({
  children,
  className,
  ...props
}: SidebarSectionLabelProps) {
  return (
    <p
      className={cn(
        "mt-6 mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Icon + Badge
// ──────────────────────────────────────────────────────────────────────────────

interface IconWrapperProps {
  icon: ComponentType<{ className?: string }>;
  className?: string;
}

export function IconWrapper({ icon: Icon, className }: IconWrapperProps) {
  return (
    <Icon
      className={cn(
        "h-[18px] w-[18px] shrink-0 opacity-80",
        className,
      )}
    />
  );
}

interface SidebarBadgeProps extends ComponentProps<"span"> {
  children: ReactNode;
}

export function SidebarBadge({
  children,
  className,
  ...props
}: SidebarBadgeProps) {
  return (
    <span
      className={cn(
        "ml-auto text-[13px] font-semibold text-red-500",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Item
// ──────────────────────────────────────────────────────────────────────────────

interface SidebarItemProps extends ComponentProps<"button"> {
  icon?: ComponentType<{ className?: string }>;
  active?: boolean;
  badgeCount?: number;
  children: ReactNode;
}

export function SidebarItem({
  icon,
  active,
  badgeCount,
  children,
  className,
  ...props
}: SidebarItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-slate-900 font-semibold text-white",
        className,
      )}
      {...props}
    >
      <span className="flex w-full items-center gap-2">
        <span className="flex items-center gap-3">
          {icon && <IconWrapper icon={icon} />}
          <span>{children}</span>
        </span>
        {typeof badgeCount === "number" && badgeCount > 0 && (
          <SidebarBadge>{badgeCount}</SidebarBadge>
        )}
      </span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Footer + Avatar
// ──────────────────────────────────────────────────────────────────────────────

interface AvatarProps extends ComponentProps<"div"> {
  initials: string;
}

export function Avatar({ initials, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold",
        className,
      )}
      {...props}
    >
      {initials}
    </div>
  );
}

interface SidebarFooterProps extends ComponentProps<"div"> {
  name: string;
  role: string;
  initials?: string;
}

export function SidebarFooter({
  name,
  role,
  initials = name[0]?.toUpperCase() ?? "U",
  className,
  ...props
}: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-gray-200 px-4 py-3",
        className,
      )}
      {...props}
    >
      <Avatar initials={initials} />
      <div className="flex flex-col leading-tight">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Divider + NavGroup
// ──────────────────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <div className={cn("border-t border-gray-200", className)} />;
}

interface NavGroupProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

export function NavGroup({ label, children, className }: NavGroupProps) {
  return (
    <SidebarSection className={className}>
      <SidebarSectionLabel>{label}</SidebarSectionLabel>
      <div className="flex flex-col gap-2">{children}</div>
    </SidebarSection>
  );
}

