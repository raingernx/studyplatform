"use client";

import type { FilterCategory } from "@/components/resources/ResourceFilters";
import { Card } from "@/design-system";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/** Optional category filter sidebar. Categories link to marketplace with ?category=slug */
interface CategorySidebarProps {
  categories: FilterCategory[];
  className?: string;
}

export function CategorySidebar({ categories, className }: CategorySidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "";

  function setCategory(slug: string | null) {
    if (!slug) {
      router.push("/resources");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("category", slug);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className={className}>
      <Card className="sticky top-6 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-tight text-zinc-500">
          Categories
        </h3>
        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
              !active ? "bg-zinc-100 font-medium" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            Discover
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(active === cat.slug ? "" : cat.slug)}
              className={cn(
                "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                active === cat.slug ? "bg-zinc-100 font-medium" : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </Card>
    </aside>
  );
}
