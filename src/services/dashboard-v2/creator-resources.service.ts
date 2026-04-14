import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  canAccessCreatorWorkspace,
  getCreatorAccessState,
  getCreatorResourceManagementPageForWorkspace,
  type CreatorResourceSort,
} from "@/services/creator";

export type DashboardV2CreatorResourceStatusFilter =
  | "all"
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export type DashboardV2CreatorResourcePricingFilter = "all" | "free" | "paid";

export interface DashboardV2CreatorResourcesCategory {
  id: string;
  name: string;
}

export interface DashboardV2CreatorResourceItem {
  id: string;
  title: string;
  slug: string;
  href: string;
  status: "Draft" | "Published" | "Archived";
  pricingLabel: string;
  categoryLabel: string;
  revenueLabel: string;
  downloadsLabel: string;
  updatedLabel: string;
}

export interface DashboardV2CreatorResourcesData {
  state: "ready" | "empty" | "filtered-empty" | "locked" | "error";
  status: DashboardV2CreatorResourceStatusFilter;
  pricing: DashboardV2CreatorResourcePricingFilter;
  sort: CreatorResourceSort;
  categoryId: string | null;
  categories: DashboardV2CreatorResourcesCategory[];
  totalCount: number;
  filteredCount: number;
  visibleCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  pageStart: number;
  pageEnd: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
  resources: DashboardV2CreatorResourceItem[];
  errorTitle?: string;
  errorDescription?: string;
}

export const DASHBOARD_V2_CREATOR_RESOURCES_PAGE_SIZE = 10;

function firstParam(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

function normalizeStatus(
  input: string | string[] | undefined,
): DashboardV2CreatorResourceStatusFilter {
  const value = firstParam(input)?.toUpperCase();

  switch (value) {
    case "DRAFT":
    case "PUBLISHED":
    case "ARCHIVED":
      return value as DashboardV2CreatorResourceStatusFilter;
    default:
      return "all";
  }
}

function normalizePricing(
  input: string | string[] | undefined,
): DashboardV2CreatorResourcePricingFilter {
  switch (firstParam(input)) {
    case "free":
    case "paid":
      return firstParam(input) as DashboardV2CreatorResourcePricingFilter;
    default:
      return "all";
  }
}

function normalizeSort(input: string | string[] | undefined): CreatorResourceSort {
  switch (firstParam(input)) {
    case "downloads":
    case "revenue":
      return firstParam(input) as CreatorResourceSort;
    default:
      return "latest";
  }
}

function normalizePage(input: string | string[] | undefined) {
  const value = Number(firstParam(input));

  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function formatMoneyCents(value: number) {
  return formatPrice(value / 100);
}

function toStatusLabel(status: string): DashboardV2CreatorResourceItem["status"] {
  if (status === "PUBLISHED") return "Published";
  if (status === "ARCHIVED") return "Archived";
  return "Draft";
}

export function getDashboardV2CreatorResourcesHref(params?: {
  status?: DashboardV2CreatorResourceStatusFilter;
  pricing?: DashboardV2CreatorResourcePricingFilter;
  sort?: CreatorResourceSort;
  categoryId?: string | null;
  page?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params?.pricing && params.pricing !== "all") {
    searchParams.set("pricing", params.pricing);
  }

  if (params?.sort && params.sort !== "latest") {
    searchParams.set("sort", params.sort);
  }

  if (params?.categoryId) {
    searchParams.set("category", params.categoryId);
  }

  if (params?.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query
    ? `${routes.dashboardV2CreatorResources}?${query}`
    : routes.dashboardV2CreatorResources;
}

export async function getDashboardV2CreatorResourcesData(input: {
  userId: string;
  rawStatus?: string | string[] | undefined;
  rawPricing?: string | string[] | undefined;
  rawSort?: string | string[] | undefined;
  rawCategory?: string | string[] | undefined;
  rawPage?: string | string[] | undefined;
}): Promise<DashboardV2CreatorResourcesData> {
  const status = normalizeStatus(input.rawStatus);
  const pricing = normalizePricing(input.rawPricing);
  const sort = normalizeSort(input.rawSort);
  const requestedPage = normalizePage(input.rawPage);

  try {
    const access = await getCreatorAccessState(input.userId);

    if (!canAccessCreatorWorkspace(access)) {
      return {
        state: "locked",
        status,
        pricing,
        sort,
        categoryId: null,
        categories: [],
        totalCount: 0,
        filteredCount: 0,
        visibleCount: 0,
        page: 1,
        totalPages: 1,
        pageSize: DASHBOARD_V2_CREATOR_RESOURCES_PAGE_SIZE,
        pageStart: 0,
        pageEnd: 0,
        publishedCount: 0,
        draftCount: 0,
        archivedCount: 0,
        resources: [],
        errorTitle: "Creator access is not active",
        errorDescription:
          "Apply for creator access before managing creator resources.",
      };
    }

    const rawCategory = firstParam(input.rawCategory);
    const pageData = await getCreatorResourceManagementPageForWorkspace(input.userId, {
      status,
      pricing,
      categoryId: rawCategory,
      sort,
      page: requestedPage,
      pageSize: DASHBOARD_V2_CREATOR_RESOURCES_PAGE_SIZE,
    });

    const resources = pageData.resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      href: routes.dashboardV2CreatorResource(resource.id),
      status: toStatusLabel(resource.status),
      pricingLabel: resource.isFree ? "Free" : formatPrice(resource.price),
      categoryLabel: resource.category?.name ?? "Uncategorized",
      revenueLabel: formatMoneyCents(resource.revenue),
      downloadsLabel: formatNumber(resource.downloadCount),
      updatedLabel: formatDate(resource.updatedAt),
    }));

    return {
      state:
        pageData.totalCount === 0
          ? "empty"
          : pageData.filteredCount === 0
            ? "filtered-empty"
            : "ready",
      status,
      pricing,
      sort,
      categoryId: pageData.categoryId,
      categories: pageData.categories,
      totalCount: pageData.totalCount,
      filteredCount: pageData.filteredCount,
      visibleCount: resources.length,
      page: pageData.page,
      totalPages: pageData.totalPages,
      pageSize: pageData.pageSize,
      pageStart:
        pageData.filteredCount === 0
          ? 0
          : (pageData.page - 1) * pageData.pageSize + 1,
      pageEnd:
        pageData.filteredCount === 0
          ? 0
          : (pageData.page - 1) * pageData.pageSize + resources.length,
      publishedCount: pageData.statusSummary.published,
      draftCount: pageData.statusSummary.draft,
      archivedCount: pageData.statusSummary.archived,
      resources,
    };
  } catch {
    return {
      state: "error",
      status,
      pricing,
      sort,
      categoryId: null,
      categories: [],
      totalCount: 0,
      filteredCount: 0,
      visibleCount: 0,
      page: 1,
      totalPages: 1,
      pageSize: DASHBOARD_V2_CREATOR_RESOURCES_PAGE_SIZE,
      pageStart: 0,
      pageEnd: 0,
      publishedCount: 0,
      draftCount: 0,
      archivedCount: 0,
      resources: [],
      errorTitle: "Could not load creator resources",
      errorDescription:
        "Try refreshing this route. Creator resources remain protected behind the dashboard session gate.",
    };
  }
}
