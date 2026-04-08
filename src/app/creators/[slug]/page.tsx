import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, FileText, Globe, Instagram, Layers3, Linkedin, Sparkles, Youtube } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MarketplaceNavbarSearch } from "@/components/marketplace/MarketplaceNavbarSearch";
import { Avatar, PageContainer, PageContentWide } from "@/design-system";
import { PublicResourceCard } from "@/components/resources/PublicResourceCard";
import { CreatorPublicResourcesSectionFallback } from "@/components/skeletons/PublicRouteSkeletons";
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
  const creator = await getCreatorPublicMetadata(slug);

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
  const creatorResourcesPromise = getCreatorPublicResources(slug);
  const creator = await creatorPromise;

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar headerSearch={<MarketplaceNavbarSearch />} />

      <main>
        <PageContainer className="py-10">
          <PageContentWide>
        <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
          <div className="relative h-48 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400">
            {creator.banner && (
              <Image
                src={creator.banner}
                alt={creator.displayName}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 1152px, 100vw"
              />
            )}
          </div>

          <div className="px-6 pb-8">
            <div className="-mt-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-4">
                <Avatar
                  src={creator.image}
                  name={creator.displayName}
                  alt={creator.displayName}
                  size={96}
                  className="rounded-[28px] border-4 border-white bg-muted text-3xl font-bold text-muted-foreground"
                />
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                      {creator.displayName}
                    </h1>
                    {creator.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Active creator
                      </span>
                    )}
                    {creator.statusBadge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        {creator.statusBadge.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    /creators/{creator.slug}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {creator.resourceCount} published resource
                    {creator.resourceCount === 1 ? "" : "s"}
                  </p>
                  {creator.statusBadge?.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{creator.statusBadge.description}</p>
                  )}
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {socialLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.key}
                        href={link.href!}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {creator.bio && (
              <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">{creator.bio}</p>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers3 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Resources</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{creator.resourceCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Status</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {creator.statusBadge?.label ?? creator.status}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Slug</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {creator.momentum?.last30dDownloads
                ? `${creator.momentum.last30dDownloads.toLocaleString()} recent downloads`
                : creator.slug ?? "—"}
            </p>
          </div>
        </div>

        <Suspense fallback={<CreatorPublicResourcesSectionFallback />}>
          <CreatorResourcesSection creatorResourcesPromise={creatorResourcesPromise} />
        </Suspense>
          </PageContentWide>
        </PageContainer>
      </main>
    </div>
  );
}

async function CreatorResourcesSection({
  creatorResourcesPromise,
}: {
  creatorResourcesPromise: ReturnType<typeof getCreatorPublicResources>;
}) {
  const resources = (await creatorResourcesPromise) ?? [];

  return (
    <section className="mt-8 rounded-[28px] border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Published resources
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the latest resources from this creator.
          </p>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No published resources yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <PublicResourceCard
              key={resource.id}
              resource={resource}
            />
          ))}
        </div>
      )}
    </section>
  );
}
