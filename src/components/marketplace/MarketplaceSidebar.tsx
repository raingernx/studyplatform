import { FilterSidebar, type FilterCategory } from "@/components/marketplace/FilterSidebar";

interface MarketplaceSidebarProps {
  categories: FilterCategory[];
}

export function MarketplaceSidebar({ categories }: MarketplaceSidebarProps) {
  return <FilterSidebar categories={categories} />;
}

