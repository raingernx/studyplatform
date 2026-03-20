import Link from "next/link";

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
    <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-semibold text-zinc-900">Tags</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/resources?tag=${encodeURIComponent(tag.slug)}`}
            className="inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-surface-300 hover:bg-white hover:text-neutral-900"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
