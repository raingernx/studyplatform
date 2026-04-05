"use client"

import * as React from "react"
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dropdown(props: React.ComponentProps<typeof DropdownPrimitive.Root>) {
  return <DropdownPrimitive.Root data-slot="dropdown" {...props} />
}

function DropdownTrigger(props: React.ComponentProps<typeof DropdownPrimitive.Trigger>) {
  return <DropdownPrimitive.Trigger data-slot="dropdown-trigger" {...props} />
}

function DropdownPortal(props: React.ComponentProps<typeof DropdownPrimitive.Portal>) {
  return <DropdownPrimitive.Portal {...props} />
}

function DropdownMenu({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPortal>
      <DropdownPrimitive.Content
        data-slot="dropdown-menu"
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-40 rounded-xl border border-border bg-popover p-1 shadow-card-lg",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
          "duration-100 outline-none",
          className,
        )}
        {...props}
      />
    </DropdownPortal>
  )
}

function DropdownItem({
  className,
  destructive = false,
  inset = false,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Item> & {
  destructive?: boolean
  inset?: boolean
}) {
  return (
    <DropdownPrimitive.Item
      data-slot="dropdown-item"
      data-destructive={destructive || undefined}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2",
        "text-sm text-foreground outline-none transition-colors",
        "focus:bg-muted focus:text-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-40",
        destructive && "text-red-600 focus:bg-red-50 focus:text-red-600",
        inset && "pl-8",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

function DropdownLabel({
  className,
  inset = false,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Label> & { inset?: boolean }) {
  return (
    <DropdownPrimitive.Label
      data-slot="dropdown-label"
      className={cn(
        "px-3 py-1.5 font-ui text-caption tracking-[0.12em] text-muted-foreground",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  )
}

function DropdownSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      data-slot="dropdown-separator"
      className={cn("-mx-1 my-1 h-px bg-border/70", className)}
      {...props}
    />
  )
}

function DropdownCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.CheckboxItem>) {
  return (
    <DropdownPrimitive.CheckboxItem
      data-slot="dropdown-checkbox-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-lg py-2 pl-8 pr-3",
        "text-sm text-foreground outline-none transition-colors",
        "focus:bg-muted focus:text-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-40",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-brand-600" />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.CheckboxItem>
  )
}

function DropdownRadioGroup(props: React.ComponentProps<typeof DropdownPrimitive.RadioGroup>) {
  return <DropdownPrimitive.RadioGroup data-slot="dropdown-radio-group" {...props} />
}

function DropdownRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.RadioItem>) {
  return (
    <DropdownPrimitive.RadioItem
      data-slot="dropdown-radio-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-lg py-2 pl-8 pr-3",
        "text-sm text-foreground outline-none transition-colors",
        "focus:bg-muted focus:text-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-brand-600 text-brand-600" />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.RadioItem>
  )
}

function DropdownSub(props: React.ComponentProps<typeof DropdownPrimitive.Sub>) {
  return <DropdownPrimitive.Sub data-slot="dropdown-sub" {...props} />
}

function DropdownSubTrigger({
  className,
  inset = false,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <DropdownPrimitive.SubTrigger
      data-slot="dropdown-sub-trigger"
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2",
        "text-sm text-foreground outline-none transition-colors",
        "focus:bg-muted data-[state=open]:bg-muted",
        inset && "pl-8",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </DropdownPrimitive.SubTrigger>
  )
}

function DropdownSubMenu({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.SubContent>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.SubContent
        data-slot="dropdown-sub-menu"
        className={cn(
          "z-50 min-w-32 rounded-xl border border-border bg-popover p-1 shadow-card-lg",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
          "duration-100 outline-none",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  )
}

export {
  Dropdown,
  DropdownTrigger,
  DropdownPortal,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownCheckboxItem,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSub,
  DropdownSubTrigger,
  DropdownSubMenu,
}
