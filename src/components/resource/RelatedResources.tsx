import { ResourceCard, type ResourceCardResource } from "@/components/resources/ResourceCard";

interface RelatedResourcesProps {
  resources: ResourceCardResource[];
  ownedIds?: string[];
}

export function RelatedResources({ resources, ownedIds = [] }: RelatedResourcesProps) {
  if (resources.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-zinc-900">More like this</h2>
      <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
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
