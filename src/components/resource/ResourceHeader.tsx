import Link from "next/link";

export interface ResourceHeaderBreadcrumb {
  label: string;
  href: string;
}

interface ResourceHeaderProps {
  /** Breadcrumb segments (e.g. [{ label: "Home", href: "/" }, { label: "Category", href: "/categories/..." }]). Last segment (current page) is appended from title. */
  breadcrumb: ResourceHeaderBreadcrumb[];
  title: string;
  /** Creator display name */
  creatorName: string | null;
  /** Optional creator profile URL */
  creatorHref?: string | null;
  featured?: boolean;
}

export function ResourceHeader({
  breadcrumb,
  title,
  creatorName,
  creatorHref,
  featured = false,
}: ResourceHeaderProps) {
  return (
    <header className="mb-6">
      <nav className="flex items-center gap-2 text-[13px] text-zinc-400">
        {breadcrumb.map((item) => (
          <span key={item.href} className="flex items-center gap-2">
            <Link href={item.href} className="transition hover:text-zinc-600">
              {item.label}
            </Link>
            <span>/</span>
          </span>
        ))}
        <span className="truncate text-zinc-600">{title}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {featured && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
            Featured
          </span>
        )}
      </div>

      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        {title}
      </h1>

      {creatorName && (
        <p className="mt-1 text-[14px] text-zinc-500">
          {creatorHref ? (
            <Link href={creatorHref} className="hover:text-zinc-700 underline-offset-2 hover:underline">
              {creatorName}
            </Link>
          ) : (
            creatorName
          )}
        </p>
      )}
    </header>
  );
}
