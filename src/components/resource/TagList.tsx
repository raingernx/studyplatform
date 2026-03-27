import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";

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
    <section className="space-y-4 border-t border-surface-200 pt-6">
      <h2 className="font-display text-lg font-semibold text-zinc-900">Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <IntentPrefetchLink
            key={tag.slug}
            href={`/resources?tag=${encodeURIComponent(tag.slug)}`}
            prefetchMode="intent"
            prefetchScope="resource-detail-tags"
            prefetchLimit={4}
            resourcesNavigationMode="listing"
            className="inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-small font-medium text-zinc-700 transition hover:border-surface-300 hover:bg-white hover:text-zinc-900"
          >
            {tag.name}
          </IntentPrefetchLink>
        ))}
      </div>
    </section>
  );
}
