"use client";

import { createContext, useContext } from "react";
import { PLATFORM_DEFAULTS } from "@/lib/platform/platform-defaults";
import type { PlatformConfig } from "@/lib/platform/platform.types";

const PlatformConfigContext = createContext<PlatformConfig>(PLATFORM_DEFAULTS);

interface PlatformConfigProviderProps {
  children: React.ReactNode;
  initialConfig: PlatformConfig;
}

export function PlatformConfigProvider({
  children,
  initialConfig,
}: PlatformConfigProviderProps) {
  return (
    <PlatformConfigContext.Provider value={initialConfig}>
      {children}
    </PlatformConfigContext.Provider>
  );
}

export function usePlatformConfig() {
  return useContext(PlatformConfigContext);
}
