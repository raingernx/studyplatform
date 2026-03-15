import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

export interface CreatorCardCreator {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
}

interface CreatorCardProps {
  creator: CreatorCardCreator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const displayName = creator.name ?? "Creator";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-zinc-900 mb-3">Creator</h2>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar
          src={creator.image}
          alt={displayName}
          initials={initials}
          size={56}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-zinc-900 truncate">{displayName}</p>
          <p className="mt-0.5 text-[13px] text-zinc-600 line-clamp-2">
            {creator.bio ?? "Creator on PaperDock"}
          </p>
          <Link
            href={`/creators/${creator.id}`}
            className="mt-3 inline-flex text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            View profile
          </Link>
        </div>
      </div>
    </section>
  );
}
