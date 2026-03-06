import Link from "next/link";
import { FileText, Download, ArrowUpRight, Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatPrice } from "@/lib/utils";

export interface ResourceCardData {
  id: string;
  title: string;
  slug: string;
  description: string;
  isFree: boolean;
  price: number;
  previewUrl?: string | null;
  downloadCount: number;
  author: { name?: string | null };
  category?: { name: string; slug: string } | null;
  tags?: { tag: { name: string; slug: string } }[];
  _count?: { purchases: number; reviews: number };
}

interface ResourceCardProps {
  resource: ResourceCardData;
  owned?: boolean;
}

// Rich gradient palettes per category — from → to + accent
const CATEGORY_PALETTE: Record<string, { from: string; to: string; icon: string }> = {
  mathematics: { from: "#1e40af", to: "#1d4ed8",   icon: "#93c5fd" },
  science:     { from: "#065f46", to: "#047857",   icon: "#6ee7b7" },
  humanities:  { from: "#5b21b6", to: "#6d28d9",   icon: "#c4b5fd" },
  languages:   { from: "#9a3412", to: "#c2410c",   icon: "#fdba74" },
  default:     { from: "#1e293b", to: "#334155",   icon: "#94a3b8" },
};

export function ResourceCard({ resource, owned = false }: ResourceCardProps) {
  const palette =
    CATEGORY_PALETTE[resource.category?.slug ?? "default"] ??
    CATEGORY_PALETTE.default;

  const isFreeResource = resource.isFree || resource.price === 0;

  return (
    <Link
      href={`/resources/${resource.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white
                 ring-1 ring-black/[0.05] shadow-card
                 transition-all duration-200 ease-out
                 hover:shadow-card-lg hover:-translate-y-1 hover:ring-black/[0.08]"
    >
      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <div
        className="relative flex h-[140px] flex-shrink-0 items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
        }}
      >
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-dot-dark opacity-30" />

        {/* Shine line on hover */}
        <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent
                        via-white/10 to-transparent transition-transform duration-700
                        group-hover:translate-x-[100%]" />

        {resource.previewUrl ? (
          <img
            src={resource.previewUrl}
            alt={resource.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileText style={{ color: palette.icon }} className="h-10 w-10 opacity-60" />
          </div>
        )}

        {/* Price pill — top-right */}
        <div className="absolute right-3 top-3">
          {isFreeResource ? (
            <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold
                             text-white shadow-sm ring-1 ring-emerald-400/30">
              Free
            </span>
          ) : owned ? (
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold
                             text-white shadow-sm">
              Owned
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5
                             text-[11px] font-bold text-white shadow-sm backdrop-blur-sm
                             ring-1 ring-white/10">
              <Lock className="h-2.5 w-2.5 text-orange-300" />
              {formatPrice(resource.price)}
            </span>
          )}
        </div>

        {/* Arrow icon — appears on hover */}
        <div className="absolute right-3 bottom-3 flex h-7 w-7 items-center justify-center
                        rounded-full bg-white/10 opacity-0 ring-1 ring-white/20 backdrop-blur-sm
                        transition-all duration-200 group-hover:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Category badge */}
        {resource.category && (
          <div className="flex items-center gap-1.5">
            <Badge variant="blue">{resource.category.name}</Badge>
            {resource.tags?.slice(0, 1).map(({ tag }) => (
              <Badge key={tag.slug} variant="gray">{tag.name}</Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-zinc-900
                       transition-colors duration-150 group-hover:text-blue-700">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="line-clamp-2 flex-1 text-[12px] leading-relaxed text-zinc-400">
          {resource.description}
        </p>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
          <span className="truncate text-[11px] text-zinc-400 font-medium">
            {resource.author.name ?? "Unknown"}
          </span>
          <div className="flex flex-shrink-0 items-center gap-3">
            {resource._count && resource._count.reviews > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-zinc-400">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {resource._count.reviews}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Download className="h-3 w-3" />
              {resource.downloadCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
export function ResourceCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-card">
      <div className="h-[140px] skeleton" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-20 rounded-full skeleton" />
        <div className="h-4 w-4/5 rounded-lg skeleton" />
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-2/3 rounded skeleton" />
        <div className="flex justify-between border-t border-zinc-100 pt-3">
          <div className="h-3 w-16 rounded skeleton" />
          <div className="h-3 w-10 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}
