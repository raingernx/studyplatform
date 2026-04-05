import type { ComponentProps, ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SidebarContainerProps
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
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card",
        collapsed ? "w-16" : "w-[272px]",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

export interface SidebarNavProps extends ComponentProps<"div"> {
  children: ReactNode;
}

export function SidebarNav({
  children,
  className,
  ...props
}: SidebarNavProps) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-4 py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SidebarSectionProps extends ComponentProps<"div"> {
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

export interface SidebarSectionLabelProps extends ComponentProps<"p"> {
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
        "mb-2 mt-6 px-2 font-ui text-caption tracking-[0.08em] text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export interface IconWrapperProps {
  icon: ComponentType<{ className?: string }>;
  className?: string;
}

export function IconWrapper({ icon: Icon, className }: IconWrapperProps) {
  return (
    <Icon
      className={cn("h-[18px] w-[18px] shrink-0 opacity-80", className)}
    />
  );
}

export interface SidebarBadgeProps extends ComponentProps<"span"> {
  children: ReactNode;
}

export function SidebarBadge({
  children,
  className,
  ...props
}: SidebarBadgeProps) {
  return (
    <span
      className={cn("ml-auto text-small font-semibold text-red-500", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export interface SidebarItemProps extends ComponentProps<"button"> {
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
        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent font-semibold text-foreground hover:bg-accent hover:text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      <span className="flex w-full items-center gap-2">
        <span className="flex items-center gap-3">
          {icon ? <IconWrapper icon={icon} /> : null}
          <span>{children}</span>
        </span>
        {typeof badgeCount === "number" && badgeCount > 0 ? (
          <SidebarBadge>{badgeCount}</SidebarBadge>
        ) : null}
      </span>
    </button>
  );
}

interface SidebarAvatarProps extends ComponentProps<"div"> {
  initials: string;
}

export function SidebarAvatar({
  initials,
  className,
  ...props
}: SidebarAvatarProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground",
        className,
      )}
      {...props}
    >
      {initials}
    </div>
  );
}

export interface SidebarFooterProps extends ComponentProps<"div"> {
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
        "flex items-center gap-3 border-t border-border px-4 py-3",
        className,
      )}
      {...props}
    >
      <SidebarAvatar initials={initials} />
      <div className="flex flex-col leading-tight">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

export interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return <div className={cn("border-t border-border", className)} />;
}

export interface NavGroupProps {
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
