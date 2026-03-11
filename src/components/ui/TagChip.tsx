interface TagChipProps {
  slug: string;
  label: string;
}

export function TagChip({ label }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
      {label.toLowerCase()}
    </span>
  );
}
