"use client";

import { Logo } from "@/components/brand/Logo";

export function NavbarBrand() {
  return (
    <div className="flex items-center">
      <Logo
        variant="full"
        size="md"
        className="hidden sm:flex"
        preferRepoAsset
      />
      <Logo
        variant="icon"
        size="md"
        className="flex sm:hidden"
        preferRepoAsset
      />
    </div>
  );
}
