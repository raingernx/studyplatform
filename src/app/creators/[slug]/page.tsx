import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Globe, Instagram, Linkedin, Sparkles, Youtube } from "lucide-react";
import { isTransientPrismaInfrastructureError } from "@/lib/prismaErrors";
import { Navbar } from "@/components/layout/Navbar";
import { MarketplaceNavbarSearch } from "@/components/marketplace/MarketplaceNavbarSearch";
import { CreatorPublicOwnerActions } from "@/components/creator/CreatorPublicOwnerActions";
import { Avatar, Badge, Button, PageContainer, PageContentWide } from "@/design-system";
import { PublicResourceCard } from "@/components/resources/PublicResourceCard";
import { CreatorPublicResourcesSectionFallback } from "@/components/skeletons/PublicRouteSkeletons";
import { routes } from "@/lib/routes";
import {
  getCreatorPublicMetadata,
  getCreatorPublicResources,
  getCreatorPublicShell,
} from "@/services/creator";

type CreatorProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CreatorProfilePageProps) {
  const { slug } = await params;
  let creator = null;

  try {
    creator = await getCreatorPublicMetadata(slug);
  } catch (error) {
    if (!isTransientPrismaInfrastructureError(error)) {
      throw error;
    }
  }

  if (!creator) {
    return {
      title: "Creator",
    };
  }

  return {
    title: `${creator.displayName} – Creator`,
    description: creator.bio ?? `Browse resources from ${creator.displayName}.`,
  };
}

export default async function CreatorPublicProfilePage({
  params,
}: CreatorProfilePageProps) {
  const { slug } = await params;
  const creatorPromise = getCreatorPublicShell(slug);
  const creatorResourcesPromise = getCreatorPublicResources(slug).catch((error) => {
    if (!isTransientPrismaInfrastructureError(error)) {
      throw error;
    }

    console.error("[CREATOR_PUBLIC_RESOURCES_FALLBACK]", {
      slug,
      error:
        error instanceof Error
          ? { message: error.message, name: error.name }
          : String(error),
      fallbackApplied: true,
    });

    return [];
  });
  let creator = null;

  try {
    creator = await creatorPromise;
  } catch (error) {
    if (!isTransientPrismaInfrastructureError(error)) {
      throw error;
    }

    return <CreatorUnavailableState slug={slug} />;
  }

  if (!creator) {
    notFound();
  }

  const socialLinks = [
    {
      key: "website",
      label: "Website",
      href: creator.socialLinks.website,
      icon: Globe,
    },
    {
      key: "twitter",
      label: "X / Twitter",
      href: creator.socialLinks.twitter,
      icon: Sparkles,
    },
    {
      key: "instagram",
      label: "Instagram",
      href: creator.socialLinks.instagram,
      icon: Instagram,
    },
    {
      key: "youtube",
      label: "YouTube",
      href: creator.socialLinks.youtube,
      icon: Youtube,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: creator.socialLinks.linkedin,
      icon: Linkedin,
    },
  ].filter((link) => Boolean(link.href));
  const creatorSummary =
    creator.bio?.trim() ||
    (creator.resourceCount > 0
      ? `Browse classroom downloads and study materials published by ${creator.displayName}.`
      : `${creator.displayName} is preparing this storefront for upcoming classroom resources.`);
  const resourceLabel =
    creator.resourceCount > 0
      ? `${creator.resourceCount} resource${creator.resourceCount === 1 ? "" : "s"}`
      : "Store opening soon";
  const isActive = creator.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-background">
      <Navbar headerSearch={<MarketplaceNavbarSearch />} />

      <main>
        <PageContainer className="py-10">
          <PageContentWide>
            <div className="space-y-10">
              <section className="overflow-hidden rounded-[32px] border border-border bg-card shadow-card">
                <div className="relative min-h-[18rem] overflow-hidden">
                  {creator.banner ? (
                    <Image
                      src={creator.banner}
                      alt={creator.displayName}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 1152px, 100vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.35),transparent_40%),linear-gradient(135deg,rgba(99,102,241,0.28),rgba(15,23,42,0.85)_55%,rgba(8,47,73,0.82))]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--card)/0.98)] via-[hsl(var(--card)/0.78)] to-[hsl(var(--background)/0.25)]" />

                  <div className="relative flex min-h-[18rem] flex-col justify-between gap-8 px-6 py-6 sm:px-8 sm:py-8 lg:min-h-[20rem] lg:px-10 lg:py-10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isActive ? "success" : "neutral"}>
                          {isActive ? (
                            <>
                              <BadgeCheck className="size-3.5" />
                              Active creator
                            </>
                          ) : (
                            "Paused"
                          )}
                        </Badge>
                        <Badge variant={creator.resourceCount > 0 ? "outline" : "neutral"}>
                          {resourceLabel}
                        </Badge>
                        {creator.statusBadge?.label ? (
                          <Badge variant="featured">{creator.statusBadge.label}</Badge>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {socialLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Button
                              key={link.key}
                              asChild
                              size="icon"
                              variant="secondary"
                              className="rounded-full"
                            >
                              <Link
                                href={link.href!}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={link.label}
                                title={link.label}
                              >
                                <Icon className="size-4" />
                              </Link>
                            </Button>
                          );
                        })}
                        <CreatorPublicOwnerActions
                          creatorUserId={creator.id}
                          editHref={routes.dashboardV2CreatorProfile}
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-6">
                      <Avatar
                        src={creator.image}
                        name={creator.displayName}
                        alt={creator.displayName}
                        size={104}
                        className="rounded-[30px] border-4 border-background/95 bg-muted text-3xl font-bold text-muted-foreground shadow-lg"
                      />

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
                            {creator.displayName}
                          </h1>
                          <p className="max-w-3xl text-base leading-7 text-foreground/78 sm:text-lg">
                            {creatorSummary}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">/creators/{creator.slug}</span>
                          <span>{creator.resourceCount} published listing{creator.resourceCount === 1 ? "" : "s"}</span>
                          {creator.momentum?.last30dDownloads ? (
                            <span>{creator.momentum.last30dDownloads.toLocaleString()} recent downloads</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Suspense fallback={<CreatorPublicResourcesSectionFallback />}>
                <CreatorResourcesSection
                  creatorResourcesPromise={creatorResourcesPromise}
                  creatorDisplayName={creator.displayName}
                  hasBio={Boolean(creator.bio?.trim())}
                />
              </Suspense>
            </div>
          </PageContentWide>
        </PageContainer>
      </main>
    </div>
  );
}

function CreatorUnavailableState({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar headerSearch={<MarketplaceNavbarSearch />} />

      <main>
        <PageContainer className="py-10">
          <PageContentWide>
            <div className="mx-auto max-w-2xl rounded-[28px] border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-8 sm:py-12">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-primary">
                  Creator temporarily unavailable
                </p>
                <h1 className="font-display text-3xl font-semibold text-foreground">
                  This creator page could not load right now.
                </h1>
                <p className="text-body leading-7 text-muted-foreground">
                  The creator shell hit a temporary service issue. Try again, or return to the
                  marketplace and reopen this profile in a moment.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/creators/${slug}`}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-small font-semibold text-white transition hover:bg-brand-700"
                >
                  Try again
                </Link>
                <Link
                  href={routes.marketplace}
                  className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-small font-medium text-foreground transition hover:bg-muted"
                >
                  Open resources
                </Link>
              </div>
            </div>
          </PageContentWide>
        </PageContainer>
      </main>
    </div>
  );
}

async function CreatorResourcesSection({
  creatorResourcesPromise,
  creatorDisplayName,
  hasBio,
}: {
  creatorResourcesPromise: ReturnType<typeof getCreatorPublicResources>;
  creatorDisplayName: string;
  hasBio: boolean;
}) {
  const resources = (await creatorResourcesPromise) ?? [];
  const hasPublishedResources = resources.length > 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {hasPublishedResources ? "Shop resources" : "Store opening soon"}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {hasPublishedResources
              ? `Browse the latest classroom downloads and study materials from ${creatorDisplayName}.`
              : hasBio
                ? `This storefront is active. Published classroom downloads will appear here once the first resources go live.`
                : `${creatorDisplayName} is still preparing this storefront. Published classroom downloads will appear here as soon as the first listings go live.`}
          </p>
        </div>
        {hasPublishedResources ? (
          <p className="text-sm text-muted-foreground">
            {resources.length} listing{resources.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      {hasPublishedResources ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <PublicResourceCard
              key={resource.id}
              resource={resource}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-border-strong bg-card px-6 py-10 shadow-card sm:px-8 sm:py-12">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Nothing is published yet.
            </p>
            <h3 className="font-display text-2xl font-semibold text-foreground">
              This storefront is getting ready.
            </h3>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              Check back soon for worksheets, assessments, and downloadable study resources.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" size="sm">
                <Link href={routes.marketplace}>Browse marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
