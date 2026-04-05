"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
};

export interface ModalRootProps extends React.ComponentProps<typeof DialogPrimitive.Root> {}

function ModalRoot(props: ModalRootProps) {
  return <DialogPrimitive.Root data-slot="modal" {...props} />;
}

export interface ModalTriggerProps extends React.ComponentProps<typeof DialogPrimitive.Trigger> {}

function ModalTrigger(props: ModalTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="modal-trigger" {...props} />;
}

function ModalClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="modal-close" {...props} />;
}

function ModalOverlay(props: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="modal-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        props.className,
      )}
      {...props}
    />
  );
}

export interface ModalContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  size?: ModalSize;
  showCloseButton?: boolean;
}

function ModalContent({
  className,
  children,
  size = "md",
  showCloseButton = true,
  ...props
}: ModalContentProps) {
  return (
    <DialogPrimitive.Portal>
      <ModalOverlay />
      <DialogPrimitive.Content
        data-slot="modal-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
          sizeClasses[size],
          "rounded-2xl border border-border bg-card shadow-card-lg",
          "flex flex-col overflow-hidden outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "duration-150",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-3 h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export interface ModalHeaderProps extends React.ComponentProps<"div"> {}

function ModalHeader({ className, ...props }: ModalHeaderProps) {
  return (
    <div
      data-slot="modal-header"
      className={cn("flex flex-col gap-1 border-b border-border/70 px-5 py-4", className)}
      {...props}
    />
  );
}

export interface ModalTitleProps extends React.ComponentProps<typeof DialogPrimitive.Title> {}

function ModalTitle({ className, ...props }: ModalTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="modal-title"
      className={cn("font-display text-base font-semibold leading-snug text-foreground", className)}
      {...props}
    />
  );
}

export interface ModalDescriptionProps extends React.ComponentProps<typeof DialogPrimitive.Description> {}

function ModalDescription({ className, ...props }: ModalDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="modal-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export interface ModalContentBodyProps extends React.ComponentProps<"div"> {}

function ModalContentBody({ className, ...props }: ModalContentBodyProps) {
  return (
    <div
      data-slot="modal-content-body"
      className={cn("flex-1 overflow-auto px-5 py-4", className)}
      {...props}
    />
  );
}

export interface ModalFooterProps extends React.ComponentProps<"div"> {}

function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border/70 bg-muted/60 px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}

export const Modal = {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Close: ModalClose,
  Content: ModalContent,
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalContentBody,
  Footer: ModalFooter,
};
