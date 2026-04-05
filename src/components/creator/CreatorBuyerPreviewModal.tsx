"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ResourceHeader } from "@/components/resources/detail/ResourceHeader";
import { ResourceGallery } from "@/components/resources/detail/ResourceGallery";
import { ResourceDescription } from "@/components/resources/detail/ResourceDescription";
import { ResourceFiles } from "@/components/resources/detail/ResourceFiles";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";

// ── Types ──────────────────────────────────────────────────────────────────────

export type CreatorBuyerPreviewResource = {
  title: string;
  description: string;
  /** Price in major units (e.g. 99 = ฿99). */
  price: number;
  isFree: boolean;
  previewUrls: string[];
  thumbnailUrl?: string | null;
  fileUrl?: string;
  fileName?: string | null;
  fileSize?: number | null;
  hasPrivateFile?: boolean;
  /** Resource type from the form ("PDF" | "DOCUMENT"). */
  type?: string;
};

type CreatorBuyerPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  resource: CreatorBuyerPreviewResource;
};

// ── Component ──────────────────────────────────────────────────────────────────

export function CreatorBuyerPreviewModal({
  open,
  onClose,
  resource,
}: CreatorBuyerPreviewModalProps) {
  // Save and restore previous body overflow value so we don't clobber existing state
  const prevOverflow = useRef<string>("");

  useEffect(() => {
    if (!open) return;
    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow.current;
    };
  }, [open]);

  // ESC closes the modal
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Mount guard — keeps bundle weight negligible when modal is closed
  if (!open) return null;

  // ── Data mapping ──────────────────────────────────────────────────────────

  const previews = resource.previewUrls.map((url, i) => ({
    id: `preview-${i}`,
    imageUrl: url,
    order: i,
  }));

  const fallbackImageUrl =
    resource.thumbnailUrl ?? resource.previewUrls[0] ?? null;

  // Derive a display file entry from fileUrl when present so ResourceFiles renders
  const includedFiles = resource.fileUrl || resource.hasPrivateFile
    ? [
        {
          name:
            resource.fileName ||
            resource.fileUrl?.split("/").pop() ||
            (resource.type === "PDF" ? "Downloadable PDF" : "Downloadable file"),
          size: resource.fileSize ?? null,
        },
      ]
    : [];

  // Safe fallbacks so the preview never looks broken
  const displayTitle = resource.title.trim() || "Untitled resource";
  const displayDescription =
    resource.description.trim() ||
    "No description added yet. Add a description to help buyers understand what this resource covers.";

  const priceLabel = resource.isFree
    ? "Free"
    : resource.price > 0
      ? formatPrice(resource.price)
      : "Price not set";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /* Backdrop — click outside to close */
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Buyer preview"
    >
      {/* Modal panel — stop click propagation so inner clicks don't close */}
      <div
        className="relative mx-auto w-full max-w-5xl rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Preview mode banner ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 rounded-t-2xl border-b border-indigo-100 bg-indigo-50 px-5 py-3">
          <p className="text-[13px] text-indigo-700">
            <span className="font-semibold">Preview mode</span> — this is how your
            resource appears to buyers. Only you can see this.
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-indigo-400 transition hover:bg-indigo-100 hover:text-indigo-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="space-y-8 p-4 sm:p-6 lg:p-8">

          {/* Hero card — mirrors real detail page top section */}
          <section className="rounded-[24px] border border-border bg-gradient-to-br from-card via-card to-primary-50 p-4 shadow-card sm:p-6">
            <div className="space-y-6 lg:space-y-8">
              {/* Title, creator placeholder, no stats (unpublished) */}
              <ResourceHeader
                breadcrumb={[{ label: "Resources", href: routes.marketplace }]}
                title={displayTitle}
                creatorName="You"
                creatorHref={null}
                featured={false}
              />

              {/* Gallery + price card — same 3-column grid as real detail page */}
              <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[80px_minmax(0,1fr)_300px]">
                {/* ResourceGallery renders two grid children: thumbnail strip + main image */}
                <ResourceGallery
                  previews={previews}
                  resourceTitle={displayTitle}
                  fallbackImageUrl={fallbackImageUrl}
                />

                {/* Preview-only price card (replaces PurchaseCard which is async server) */}
                <div className="order-3 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Price
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                      {priceLabel}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full cursor-not-allowed rounded-xl bg-muted py-3 text-[14px] font-medium text-muted-foreground"
                    >
                      Purchase unavailable in preview
                    </button>
                    <p className="text-center text-[12px] leading-5 text-muted-foreground">
                      {resource.isFree
                        ? "Buyers will add this to their library for free."
                        : "Buyers will see payment options here after you publish."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About section — reuses real ResourceDescription component */}
          <ResourceDescription title="About" description={displayDescription} />

          {/* Included files — reuses ResourceFiles, overlaid to signal non-interactivity */}
          {includedFiles.length > 0 && (
            <div className="relative">
              <ResourceFiles files={includedFiles} />
              {/* Frosted overlay makes the section visibly non-interactive */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[hsl(var(--card)/0.7)] backdrop-blur-[2px]"
                aria-hidden="true"
              >
                <span className="rounded-full border border-border bg-card px-4 py-1.5 text-[12px] font-medium text-muted-foreground shadow-sm">
                  Download available after purchase
                </span>
              </div>
            </div>
          )}

          {/* Footer note — sets expectations about what the full page will include */}
          <p className="pb-2 text-center text-[12px] text-muted-foreground">
            The live listing will also show reviews, related resources, and your creator profile.
          </p>
        </div>
      </div>
    </div>
  );
}
