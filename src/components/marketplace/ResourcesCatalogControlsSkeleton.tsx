"use client";

import { Search } from "lucide-react";
import { Skeleton } from "boneyard-js/react";
import { Container, LoadingSkeleton } from "@/design-system";
import { ScrollableCategoryNav } from "@/components/marketplace/ScrollableCategoryNav";

const RESOURCES_CATALOG_SEARCH_NAME = "resources-catalog-search";
const RESOURCES_CATALOG_CONTROLS_NAME = "resources-catalog-controls";
const CONTROLS_BAR_CLASS_NAME = "bg-background";
const CONTROLS_BAR_MAIN_CLASS_NAME = "flex min-w-0 items-center gap-2.5 overflow-hidden";
const CONTROLS_BAR_GROUP_CLASS_NAME =
  "flex min-w-0 items-center gap-2.5 overflow-hidden";

function SearchFallback() {
  return (
    <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-border-strong bg-card px-4 text-base text-muted-foreground shadow-sm sm:rounded-2xl">
      <LoadingSkeleton className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
      <LoadingSkeleton className="h-4 w-44 rounded" />
    </div>
  );
}

function CatalogSearchPreview() {
  return (
    <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-border-strong bg-card px-4 text-base text-muted-foreground shadow-sm sm:rounded-2xl">
      <Search className="h-4 w-4 text-muted-foreground" />
      <span>ค้นหาใบงาน แฟลชการ์ด โน้ต...</span>
    </div>
  );
}

export function ResourcesCatalogSearchBonesPreview() {
  return (
    <Skeleton
      name={RESOURCES_CATALOG_SEARCH_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <CatalogSearchPreview />
    </Skeleton>
  );
}

export function ResourcesCatalogSearchSkeleton() {
  return <SearchFallback />;
}

export function DiscoverFallback() {
  return (
    <div className="inline-flex h-10 items-center rounded-full border border-border-strong bg-muted px-4 text-base font-medium text-muted-foreground shadow-sm">
      <LoadingSkeleton className="h-4 w-16 rounded" />
    </div>
  );
}

function DiscoverPreview() {
  return (
    <div className="inline-flex h-10 items-center rounded-full border border-border-strong bg-background px-4 text-base font-medium text-foreground shadow-sm">
      <span>สำรวจ</span>
    </div>
  );
}

export function ChipsFallback() {
  return (
    <div className="flex gap-2.5 overflow-hidden">
      {["w-16", "w-24", "w-28", "w-16", "w-24", "w-20"].map((width, index) => (
        <div
          key={`${width}-${index}`}
          className={`inline-flex h-10 shrink-0 items-center rounded-full border border-border-strong bg-muted px-4 text-base text-muted-foreground ${
            index === 0 ? "gap-2 pr-4" : ""
          }`}
        >
          <LoadingSkeleton className={`h-4 ${width} rounded`} />
        </div>
      ))}
    </div>
  );
}

function ChipsPreview() {
  return (
    <div className="flex gap-2.5 overflow-hidden">
      {["ทั้งหมด", "ศิลปะและความคิดสร้างสรรค์", "ปฐมวัย", "มนุษยศาสตร์", "ภาษา", "คณิตศาสตร์"].map(
        (label, index) => (
          <div
            key={label}
            className={`inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-base shadow-sm ${
              index === 0
                ? "border-border-strong bg-secondary text-secondary-foreground"
                : "border-transparent bg-background text-muted-foreground"
            }`}
          >
            <span>{label}</span>
          </div>
        ),
      )}
    </div>
  );
}

function ManualResourcesCatalogControlsSkeleton() {
  return (
    <div className={CONTROLS_BAR_CLASS_NAME}>
      <Container className="py-2 sm:py-2.5">
        <div className={CONTROLS_BAR_MAIN_CLASS_NAME}>
          <div className={CONTROLS_BAR_GROUP_CLASS_NAME}>
            <DiscoverFallback />
            <ScrollableCategoryNav>
              <ChipsFallback />
            </ScrollableCategoryNav>
          </div>
        </div>
      </Container>
    </div>
  );
}

function ResourcesCatalogControlsPreview() {
  return (
    <div className={CONTROLS_BAR_CLASS_NAME}>
      <Container className="py-2 sm:py-2.5">
        <div className={CONTROLS_BAR_MAIN_CLASS_NAME}>
          <div className={CONTROLS_BAR_GROUP_CLASS_NAME}>
            <DiscoverPreview />
            <ScrollableCategoryNav>
              <ChipsPreview />
            </ScrollableCategoryNav>
          </div>
        </div>
      </Container>
    </div>
  );
}

export function ResourcesCatalogControlsBonesPreview() {
  return (
    <Skeleton
      name={RESOURCES_CATALOG_CONTROLS_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <ResourcesCatalogControlsPreview />
    </Skeleton>
  );
}

export function ResourcesCatalogControlsSkeleton() {
  return <ManualResourcesCatalogControlsSkeleton />;
}
