"use client";

import { SessionProvider } from "next-auth/react";

import { ToastProvider } from "@/design-system";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
