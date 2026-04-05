export function LoginFormSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <div className="mx-auto h-8 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
