"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/design-system";
import {
  buildMarketplaceClearSearchHref,
  getMarketplaceInitialSearchValue,
  buildMarketplaceSearchHref,
  shouldSyncMarketplaceSearchValue,
} from "@/lib/search/marketplace-navigation";

export function ResourceSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const syncWithUrl = shouldSyncMarketplaceSearchValue(pathname);

  // Mirror the current ?search= value so the input stays in sync on navigation
  const [value, setValue] = useState(() =>
    getMarketplaceInitialSearchValue({ pathname, searchParams }),
  );

  useEffect(() => {
    if (!syncWithUrl) {
      return;
    }

    setValue(getMarketplaceInitialSearchValue({ pathname, searchParams }));
  }, [pathname, searchParams, syncWithUrl]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() && !syncWithUrl) {
      return;
    }

    router.push(
      buildMarketplaceSearchHref({
        pathname,
        searchParams,
        query: value,
      }),
    );
  }

  function handleClear() {
    setValue("");
    if (!syncWithUrl) {
      return;
    }

    router.push(
      buildMarketplaceClearSearchHref({
        pathname,
        searchParams,
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <SearchInput
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search resources..."
        onClear={handleClear}
      />
    </form>
  );
}
