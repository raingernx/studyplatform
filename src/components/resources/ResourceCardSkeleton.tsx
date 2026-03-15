export function ResourceCardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm animate-pulse">
      {/* Image placeholder — 4:3 ratio, matches card */}
      <div
        className="aspect-[4/3] w-full rounded-t-xl rounded-b-none bg-muted"
        aria-hidden
      />

      {/* Body: title + author + price */}
      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-4 w-1/4 rounded bg-muted" />
      </div>
    </div>
  );
}
