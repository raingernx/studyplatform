import Image from "next/image";
import Link from "next/link";

export type HomepageHeroConfig = {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  badgeText: string | null;
  imageUrl: string | null;
  mediaUrl: string | null;
  mediaType: string | null; // "image" | "gif"
} | null;

const DEFAULT_HERO = {
  title: "Discover beautiful study resources",
  subtitle:
    "Worksheets, flashcards, and study guides from educators and creators.",
  primaryCtaText: "Browse resources",
  primaryCtaLink: "/resources",
  secondaryCtaText: "Start selling",
  secondaryCtaLink: "/membership",
  badgeText: "Trusted by 12,000+ educators",
  imageUrl: null as string | null,
  mediaUrl: null as string | null,
  mediaType: null as string | null,
};

/**
 * Hero section — static layout. Uses config from DB when provided, else defaults.
 */
export function HeroBanner({ config }: { config?: HomepageHeroConfig }) {
  const hero = config ?? DEFAULT_HERO;
  const title = hero.title || DEFAULT_HERO.title;
  const subtitle = hero.subtitle || DEFAULT_HERO.subtitle;
  const primaryCtaText = hero.primaryCtaText || DEFAULT_HERO.primaryCtaText;
  const primaryCtaLink = hero.primaryCtaLink || DEFAULT_HERO.primaryCtaLink;
  const secondaryCtaText = hero.secondaryCtaText ?? DEFAULT_HERO.secondaryCtaText;
  const secondaryCtaLink = hero.secondaryCtaLink ?? DEFAULT_HERO.secondaryCtaLink;
  const badgeText = hero.badgeText ?? DEFAULT_HERO.badgeText;
  const mediaUrl = hero.mediaUrl?.trim() || null;
  const mediaType = hero.mediaType ?? null;
  const imageUrl = hero.imageUrl?.trim() || null;

  // Prefer uploaded media, then image URL, then default artwork
  const bgSrc = mediaUrl || (imageUrl && imageUrl !== "" ? imageUrl : null) || "/brand/paperdock-mark.svg";
  const useImg = Boolean(mediaUrl) || bgSrc.startsWith("http");

  return (
    <div className="relative min-h-[520px] w-full overflow-hidden rounded-2xl bg-surface-200">
      {useImg ? (
        // Uploaded media (image/gif) or external URL: render without Next.js optimization
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      ) : (
        <Image
          src={bgSrc}
          alt=""
          fill
          priority
          className="h-full w-full object-cover"
          aria-hidden
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-center px-6 py-12">
        <div className="relative z-10 mx-auto flex max-w-[700px] flex-col items-center gap-6 text-center text-white">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="max-w-[560px] text-sm text-white/90 sm:text-base">
            {subtitle}
          </p>
          {badgeText ? (
            <p className="text-xs text-white/70">{badgeText}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryCtaLink}
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white/90"
            >
              {primaryCtaText}
            </Link>
            {secondaryCtaText && secondaryCtaLink ? (
              <Link
                href={secondaryCtaLink}
                className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {secondaryCtaText}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
