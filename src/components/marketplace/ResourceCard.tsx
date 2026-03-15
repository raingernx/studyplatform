/**
 * Marketplace resource card. Re-exports unified ResourceCard with variant="marketplace".
 * Use this or import from @/components/resources/ResourceCard directly.
 */
import {
  ResourceCard as UnifiedResourceCard,
  type ResourceCardData,
} from "@/components/resources/ResourceCard";
interface MarketplaceResourceCardProps {
  resource: ResourceCardData;
  owned?: boolean;
}

export function ResourceCard({ resource, owned = false }: MarketplaceResourceCardProps) {
  return (
    <UnifiedResourceCard
      resource={resource}
      variant="marketplace"
      owned={owned}
    />
  );
}

export type { ResourceCardData } from "@/components/resources/ResourceCard";

