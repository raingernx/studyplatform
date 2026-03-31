import { ResourceCard, type ResourceCardResource } from "@/design-system";

interface RelatedResourcesProps {
  resources: ResourceCardResource[];
}

export function RelatedResources({ resources }: RelatedResourcesProps) {
  if (resources.length === 0) return null;

  return (
    <section className="space-y-4 border-t border-surface-200 pt-7">
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold text-zinc-900">More like this</h2>
        <p className="text-small leading-6 text-zinc-500">
          Explore a few nearby options if you want another format, teaching style, or price point.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id ?? resource.slug ?? resource.title}
            resource={resource}
            variant="marketplace"
          />
        ))}
      </div>
    </section>
  );
}
