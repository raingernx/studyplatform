import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { Avatar } from "@/design-system";
import { routes } from "@/lib/routes";

export interface CreatorCardCreator {
  id: string;
  name: string | null;
  image: string | null;
  creatorSlug: string | null;
  bio?: string | null;
}

interface CreatorCardProps {
  creator: CreatorCardCreator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const displayName = creator.name ?? "Creator";

  return (
    <section className="space-y-4 border-t border-surface-200 pt-6">
      <h2 className="font-display text-lg font-semibold text-zinc-900">Creator</h2>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar
          src={creator.image}
          alt={displayName}
          name={displayName}
          size={56}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-zinc-900 truncate">{displayName}</p>
          <p className="mt-1 text-small leading-6 text-zinc-600 line-clamp-2">
            {creator.bio ?? "Marketplace creator sharing practical learning resources."}
          </p>
          {creator.creatorSlug && (
            <IntentPrefetchLink
              href={routes.creatorPublicProfile(creator.creatorSlug)}
              className="mt-3 inline-flex items-center gap-1 text-small font-medium text-primary-700 transition hover:text-primary-800"
              prefetchScope="creator-card"
              prefetchLimit={2}
            >
              View profile
            </IntentPrefetchLink>
          )}
        </div>
      </div>
    </section>
  );
}
