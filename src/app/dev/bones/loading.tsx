import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

function BonesSectionLoading({ rows = 1 }: { rows?: number }) {
  return (
    <section className="space-y-3">
      <LoadingSkeleton className="h-4 w-40 rounded-md" />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {Array.from({ length: rows }).map((_, index) => (
          <LoadingSkeleton
            key={index}
            className="h-56 rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </section>
  );
}

export default function BonesCaptureLoading() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <LoadingSkeleton className="h-4 w-32 rounded-md" />
          <LoadingSkeleton className="h-8 w-72 rounded-xl" />
        </header>

        <BonesSectionLoading rows={3} />
        <BonesSectionLoading rows={2} />
        <BonesSectionLoading rows={2} />
      </div>
    </main>
  );
}
