import Link from "next/link";
import {
  Badge,
  Button,
  LoadingSkeleton,
  semanticColors,
} from "@/design-system";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const HERO_CONTENT = {
  badgeText: "Krukraft Marketplace",
  title: "Ready-made resources for fast lesson planning.",
  primaryCtaText: "Membership plans",
  primaryCtaLink: routes.membership,
  panelChips: ["Member pricing", "Bonus packs"] as const,
  imageUrl: null,
  mediaUrl: null,
  mediaType: null,
  featureEyebrow: "Member offer",
  featureTitle: "Join KC Premium for member pricing and launch-pack bonuses.",
} as const;

const HERO_SKELETON_LIGHT = "bg-muted";
const HERO_SKELETON_DARK_SOFT = "bg-white/10";
const HERO_SKELETON_DARK_STRONG = "bg-white/18";
const HERO_DESKTOP_ARTWORK_SRC =
  "https://www.figma.com/api/mcp/asset/6c1b723f-0269-42f9-b079-d02fb7766131";

function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function HeroSurface({
  className,
}: {
  className?: string;
}) {
  const title = HERO_CONTENT.title;
  const badgeText = HERO_CONTENT.badgeText;
  const primaryCtaText = HERO_CONTENT.primaryCtaText;
  const primaryCtaLink = HERO_CONTENT.primaryCtaLink;
  const panelChips = HERO_CONTENT.panelChips;
  const featureEyebrow = HERO_CONTENT.featureEyebrow;
  const featureTitle = HERO_CONTENT.featureTitle;
  const mediaUrl = normalizeOptionalString(HERO_CONTENT.mediaUrl);
  const imageUrl = normalizeOptionalString(HERO_CONTENT.imageUrl);
  const heroArtworkSrc = mediaUrl || imageUrl || HERO_DESKTOP_ARTWORK_SRC;

  return (
    <div
      data-hero-surface="discover"
      className={cn(
        "mx-auto flex w-full min-w-0 flex-col gap-4 overflow-hidden p-1 lg:h-[315px] lg:flex-row lg:items-stretch lg:gap-4",
        className,
      )}
    >
      <section
        className="relative flex min-h-[278px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl p-6 md:h-[232px] md:min-h-0 md:pr-[347px] lg:h-[307px] lg:pr-6 lg:self-stretch"
        style={{ backgroundColor: semanticColors.heroBackgroundSubtle }}
      >
        <div className="relative z-10 flex w-full flex-col gap-5 md:max-w-[359px] lg:max-w-[520px]">
          {badgeText ? (
            <Badge
              variant="neutral"
              className="w-fit rounded-full border-0 px-2.5 py-1 font-body text-[12px] font-medium leading-[17.4px]"
              style={{
                backgroundColor: semanticColors.heroChip,
                color: semanticColors.heroPanelForeground,
              }}
            >
              {badgeText}
            </Badge>
          ) : null}

          <h1
            className="w-full font-display text-[36px] font-semibold leading-[44px] tracking-[-0.02em] md:max-w-[359px] lg:max-w-[520px] lg:text-[56px] lg:leading-[60.5px]"
            style={{ color: semanticColors.textPrimary }}
          >
            {title}
          </h1>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden overflow-hidden md:block md:w-[323px] lg:left-[700px] lg:w-auto lg:right-0"
        >
          <img
            src={heroArtworkSrc}
            alt=""
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
            aria-hidden
          />
        </div>
      </section>

      <section
        className="relative flex min-h-[255px] w-full shrink-0 flex-col gap-4 overflow-hidden rounded-2xl p-6 text-white lg:h-[307px] lg:min-h-0 lg:w-[382px] lg:min-w-[382px] lg:self-stretch"
        style={{ backgroundColor: semanticColors.heroPanel }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {featureEyebrow ? (
            <p
              className="font-body text-[12px] font-medium leading-[17.4px]"
              style={{ color: semanticColors.heroPanelForeground }}
            >
              {featureEyebrow}
            </p>
          ) : null}

          <h2
            className="w-full font-display text-h3 font-semibold leading-[30px] tracking-[-0.02em] md:max-w-[475px] lg:max-w-none"
            style={{ color: semanticColors.heroPanelForeground }}
          >
            {featureTitle}
          </h2>

          <div className="flex flex-wrap gap-3">
            {panelChips.map((chip) => (
              <Badge
                key={chip}
                variant="neutral"
                className="rounded-full border-0 px-3 py-2 text-[14px] font-normal leading-[21px]"
                style={{
                  backgroundColor: "#202040",
                  color: semanticColors.heroChipForeground,
                }}
              >
                {chip}
              </Badge>
            ))}
          </div>

          <Button asChild fullWidth className="justify-center">
            <Link href={primaryCtaLink}>{primaryCtaText}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export function HeroSurfaceSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 flex-col gap-4 overflow-hidden p-1 lg:h-[315px] lg:flex-row lg:items-stretch lg:gap-4",
        className,
      )}
    >
      <section
        className="relative flex min-h-[278px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl p-6 md:h-[232px] md:min-h-0 md:pr-[347px] lg:h-[307px] lg:pr-6 lg:self-stretch"
        style={{ backgroundColor: semanticColors.heroBackgroundSubtle }}
      >
        <div className="relative z-10 flex w-full flex-col gap-5 md:max-w-[359px] lg:max-w-[520px]">
          <LoadingSkeleton
            className={cn("h-[25px] w-[146px] rounded-full", HERO_SKELETON_LIGHT)}
          />
          <div className="space-y-3">
            <LoadingSkeleton
              className={cn(
                "h-[44px] w-full max-w-[304px] rounded-[14px] md:max-w-[328px] lg:h-[60px] lg:max-w-[440px] lg:rounded-[20px]",
                HERO_SKELETON_LIGHT,
              )}
            />
            <LoadingSkeleton
              className={cn(
                "h-[44px] w-[92%] max-w-[280px] rounded-[14px] md:max-w-[300px] lg:h-[60px] lg:w-[92%] lg:max-w-[408px] lg:rounded-[20px]",
                HERO_SKELETON_LIGHT,
              )}
            />
            <LoadingSkeleton
              className={cn(
                "h-[44px] w-[78%] max-w-[236px] rounded-[14px] md:max-w-[260px] lg:h-[60px] lg:w-[66%] lg:max-w-[286px] lg:rounded-[20px]",
                HERO_SKELETON_LIGHT,
              )}
            />
          </div>
        </div>

        <LoadingSkeleton
          className={cn(
            "absolute inset-y-0 right-0 hidden md:block md:w-[323px] lg:left-[700px] lg:w-auto lg:right-0 lg:h-full lg:rounded-none",
            HERO_SKELETON_LIGHT,
          )}
        />
      </section>

      <section
        className="overflow-hidden rounded-2xl p-6 lg:h-[307px] lg:min-h-0 lg:w-[382px] lg:min-w-[382px] lg:self-stretch"
        style={{ backgroundColor: semanticColors.heroPanel }}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
          <LoadingSkeleton className={cn("h-4 w-[74px]", HERO_SKELETON_DARK_SOFT)} />
          <LoadingSkeleton
            className={cn(
              "h-8 w-full rounded-[14px]",
              HERO_SKELETON_DARK_STRONG,
            )}
          />
          <LoadingSkeleton
            className={cn(
              "h-8 w-[88%] rounded-[14px]",
              HERO_SKELETON_DARK_STRONG,
            )}
          />
          <div className="flex flex-wrap gap-3">
            <LoadingSkeleton className={cn("h-[37px] w-[110px] rounded-full", HERO_SKELETON_DARK_SOFT)} />
            <LoadingSkeleton className={cn("h-[37px] w-[96px] rounded-full", HERO_SKELETON_DARK_SOFT)} />
          </div>
          <LoadingSkeleton className={cn("h-11 w-full rounded-xl", HERO_SKELETON_DARK_STRONG)} />
        </div>
      </section>
    </div>
  );
}
