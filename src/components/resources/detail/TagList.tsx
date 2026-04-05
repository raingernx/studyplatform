import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { routes } from "@/lib/routes";

interface TagItem {
  name: string;
  slug: string;
}

interface TagListProps {
  tags: TagItem[];
}

export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) return null;

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <IntentPrefetchLink
            key={tag.slug}
            href={routes.marketplaceTag(tag.slug)}
            prefetchMode="intent"
            prefetchScope="resource-detail-tags"
            prefetchLimit={2}
            resourcesNavigationMode="listing"
            className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 text-small font-medium text-secondary-foreground transition hover:bg-accent hover:text-foreground"
          >
            {tag.name}
          </IntentPrefetchLink>
        ))}
      </div>
    </section>
  );
}
