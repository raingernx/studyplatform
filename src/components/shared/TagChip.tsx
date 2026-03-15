import { cn } from "@/lib/utils";

/** Shared tag chip: lowercase, neutral style. Max 2 in cards; overflow as +N. */
interface TagChipProps {
  slug?: string;
  label: string;
  className?: string;
}

export function TagChip({ label, className }: TagChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700",
        className
      )}
    >
      {label.toLowerCase()}
    </span>
  );
}
