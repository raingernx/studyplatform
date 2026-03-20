import { ResourceCard, type ResourceCardResource } from "@/design-system";

interface RelatedResourcesProps {
  resources: ResourceCardResource[];
  ownedIds?: string[];
}

export function RelatedResources({ resources, ownedIds = [] }: RelatedResourcesProps) {
  if (resources.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-zinc-900">You might also like</h2>
        <p className="text-sm leading-6 text-zinc-500">
          Related picks from the same study flow, kept below the main decision area so you can compare after you decide.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id ?? resource.slug ?? resource.title}
            resource={resource}
            variant="marketplace"
            owned={ownedIds.includes(resource.id ?? "")}
          />
        ))}
      </div>
    </section>
  );
}
