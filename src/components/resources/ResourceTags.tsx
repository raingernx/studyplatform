import { cn } from "@/lib/utils";

/** Tag shape: { tag: { id?, name, slug } } or flat string[] for simple use */
export type ResourceTagItem =
  | { tag: { id?: string; name: string; slug: string } }
  | string;

interface ResourceTagsProps {
  tags: ResourceTagItem[];
  /** Max visible before +N. Default 2. */
  maxVisible?: number;
  className?: string;
}

/** Tags for ResourceCard: lowercase, max 2 visible, then +N. Neutral style. */
export function ResourceTags({
  tags,
  maxVisible = 2,
  className,
}: ResourceTagsProps) {
  const normalized = tags.map((t) =>
    typeof t === "string" ? { id: t, name: t, slug: t } : t.tag
  );
  const visible = normalized.slice(0, maxVisible);
  const extra = normalized.length - maxVisible;

  if (normalized.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((tag) => (
        <span
          key={tag.id ?? tag.slug}
          className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
        >
          {tag.name.toLowerCase()}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
          +{extra}
        </span>
      )}
    </div>
  );
}
