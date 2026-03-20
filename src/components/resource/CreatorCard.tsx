import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { getPlatform } from "@/services/platform.service";

export interface CreatorCardCreator {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
}

interface CreatorCardProps {
  creator: CreatorCardCreator;
}

export async function CreatorCard({ creator }: CreatorCardProps) {
  const platform = await getPlatform();
  const displayName = creator.name ?? "Creator";

  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card sm:p-6">
      <h2 className="mb-4 font-display text-lg font-semibold text-zinc-900">Creator</h2>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar
          src={creator.image}
          alt={displayName}
          name={displayName}
          size={56}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-zinc-900 truncate">{displayName}</p>
          <p className="mt-0.5 text-[13px] text-zinc-600 line-clamp-2">
            {creator.bio ?? `Creator on ${platform.platformShortName}`}
          </p>
          <Link
            href={`/creators/${creator.id}`}
            className="mt-3 inline-flex rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-[13px] font-medium text-blue-600 transition hover:border-surface-300 hover:bg-white hover:text-blue-700"
          >
            View profile
          </Link>
        </div>
      </div>
    </section>
  );
}
