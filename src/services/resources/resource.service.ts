import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { logAdminAction } from "@/lib/auditLogger";
import { slugify } from "@/lib/utils";
import {
  createAdminResourceRecord,
  createDraftResourceRecord,
  createAdminResourcesBulk,
  createOwnedResourceRecord,
  deleteStaleDraftResources,
  findAdminActor,
  findAdminResources,
  findCategoryBySlug,
  findCreatorOwnedResources,
  findNewResourcesInCategoryExcludingIds,
  findNewResourcesInCategoriesExcludingIds,
  findPublicResources,
  findRecommendedResourcesByLevelsExcludingIds,
  findRecommendedResourcesExcludingIds,
  findResourceById,
  findResourceBySlug,
  findTagBySlug,
  moveAdminResourcesToCategory,
  softDeleteAdminResource,
  softDeleteAdminResources,
  updateAdminResourceRecord,
  updateAdminResourceStatuses,
} from "@/repositories/resources/resource.repository";

export interface ListPublicResourcesInput {
  page?: number;
  pageSize?: number;
  categorySlug?: string | null;
  tagSlug?: string | null;
  search?: string | null;
  isFree?: boolean;
}

const previewUrlSchema = z.string().refine(
  (value) =>
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/"),
  {
    message:
      "Preview must be a URL or uploaded image path (e.g. https://… or /uploads/…)",
  },
);

const CreateOwnedResourceSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().cuid().optional(),
  isFree: z.boolean().default(false),
  price: z.number().int().min(0, "Price must be 0 or greater").default(0),
  stripePriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  previewUrl: previewUrlSchema.nullable().optional(),
  previewUrls: z.array(previewUrlSchema).optional(),
});

const CreateAdminResourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["PDF", "DOCUMENT"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  isFree: z.boolean().default(false),
  price: z.number().int().min(0, "Price must be 0 or greater").default(0),
  fileUrl: z
    .union([
      z.string().url("Must be a valid URL"),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .transform((value) => (value === "" || value == null ? undefined : value)),
  categoryId: z.string().cuid().nullable().optional(),
  featured: z.boolean().default(false),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).nullable().optional(),
  license: z
    .enum(["PERSONAL_USE", "COMMERCIAL_USE", "EXTENDED_LICENSE"])
    .nullable()
    .optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED"]).nullable().optional(),
  authorId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).default([]),
  previewUrls: z.array(previewUrlSchema).default([]),
});

const BulkItemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().int().min(0, "Price must be 0 or greater").default(0),
  categorySlug: z.string().optional().nullable(),
  tagSlugs: z.array(z.string()).default([]),
  previewUrls: z.array(previewUrlSchema).default([]),
  fileUrl: z.string().url("fileUrl must be a valid URL").nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
  type: z.enum(["PDF", "DOCUMENT"]).default("PDF"),
  featured: z.boolean().default(false),
});

const BulkRequestSchema = z.object({
  resources: z
    .array(z.unknown())
    .min(1, "Provide at least one resource")
    .max(100, "Maximum 100 resources per batch"),
});

const BulkMutationSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "Provide at least one resource id."),
  action: z.enum(["publish", "archive", "delete", "draft", "moveToCategory"]),
  categoryId: z.string().cuid().optional(),
});

const PatchAdminResourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(80, "Slug must be at most 80 characters")
    .optional(),
  type: z.enum(["PDF", "DOCUMENT"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFree: z.boolean().optional(),
  price: z.number().int().min(0).optional(),
  fileUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  categoryId: z.string().cuid().nullable().optional(),
  featured: z.boolean().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).nullable().optional(),
  license: z
    .enum(["PERSONAL_USE", "COMMERCIAL_USE", "EXTENDED_LICENSE"])
    .nullable()
    .optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED"]).nullable().optional(),
  authorId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  previewUrls: z.array(previewUrlSchema).optional(),
});

export class ResourceServiceError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Resource service error");
    this.status = status;
    this.payload = payload;
  }
}

function buildFieldErrors(error: z.ZodError) {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string> = {};

  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    if (messages && messages.length > 0) {
      fieldErrors[key] = messages[0] as string;
    }
  }

  return { flattened, fieldErrors };
}

function toSlugBase(title: string) {
  return slugify(title).slice(0, 80);
}

async function generateUniqueSlug(base: string, excludeId?: string) {
  let candidate = base;
  let attempt = 0;

  while (true) {
    const existing = await findResourceBySlug(candidate);

    if (!existing || existing.id === excludeId) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

async function generateUniqueSlugForBatch(title: string, batchSlugs: Set<string>) {
  const base = toSlugBase(title);
  let candidate = base;
  let attempt = 0;

  while (true) {
    if (!batchSlugs.has(candidate)) {
      const existing = await findResourceBySlug(candidate);
      if (!existing) {
        batchSlugs.add(candidate);
        return candidate;
      }
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export async function listPublicResources(input: ListPublicResourcesInput) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, input.pageSize ?? 12);
  const categorySlug = input.categorySlug?.trim() || undefined;
  const tagSlug = input.tagSlug?.trim() || undefined;
  const search = input.search?.trim() || undefined;

  const { items, total } = await findPublicResources({
    page,
    pageSize,
    categorySlug,
    tagSlug,
    search,
    isFree: input.isFree,
  });

  return {
    items: items.map((resource) => ({
      ...resource,
      previewUrl: resource.previewUrl ?? resource.previews?.[0]?.imageUrl ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function listAdminResources() {
  return findAdminResources();
}

export async function getCreatorResources(userId: string) {
  const resources = await findCreatorOwnedResources(userId);

  return resources.map((resource) => ({
    ...resource,
    previewUrl: resource.previewUrl ?? resource.previews[0]?.imageUrl ?? null,
  }));
}

export async function getRecommendedResources(
  excludedResourceIds: string[],
  limit: number = 6,
) {
  const resources = await findRecommendedResourcesExcludingIds(
    excludedResourceIds,
    limit,
  );

  return resources.map((resource) => ({
    ...resource,
    previewUrl: resource.previewUrl ?? resource.previews?.[0]?.imageUrl ?? null,
  }));
}

export async function getNewResourcesInCategory(
  categoryId: string,
  excludedResourceIds: string[],
  limit: number = 4,
) {
  const resources = await findNewResourcesInCategoryExcludingIds(
    categoryId,
    excludedResourceIds,
    limit,
  );

  return resources.map((resource) => ({
    ...resource,
    previewUrl: resource.previewUrl ?? resource.previews?.[0]?.imageUrl ?? null,
  }));
}

export async function getNewResourcesInCategories(
  categoryIds: string[],
  excludedResourceIds: string[],
  limit: number = 6,
) {
  const resources = await findNewResourcesInCategoriesExcludingIds(
    categoryIds,
    excludedResourceIds,
    limit,
  );

  return resources.map((resource) => ({
    ...resource,
    previewUrl: resource.previewUrl ?? resource.previews?.[0]?.imageUrl ?? null,
  }));
}

export async function getRecommendedResourcesByLevels(
  levels: Array<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">,
  excludedResourceIds: string[],
  limit: number = 4,
) {
  const resources = await findRecommendedResourcesByLevelsExcludingIds(
    levels,
    excludedResourceIds,
    limit,
  );

  return resources.map((resource) => ({
    ...resource,
    previewUrl: resource.previewUrl ?? resource.previews?.[0]?.imageUrl ?? null,
  }));
}

export async function createAdminResource(input: unknown, adminUserId: string) {
  const actor = await findAdminActor(adminUserId);

  if (!actor) {
    throw new ResourceServiceError(401, {
      error: "User not found. Please sign out and sign in again.",
    });
  }

  if (actor.role !== "ADMIN") {
    throw new ResourceServiceError(403, {
      error: "Forbidden. Admin access required.",
    });
  }

  const parsed = CreateAdminResourceSchema.safeParse(input);

  if (!parsed.success) {
    const { flattened, fieldErrors } = buildFieldErrors(parsed.error);
    throw new ResourceServiceError(400, {
      error: "Validation failed",
      fields: fieldErrors,
      errors: {
        fieldErrors: flattened.fieldErrors,
        formErrors: flattened.formErrors,
      },
    });
  }

  const slug = await generateUniqueSlug(toSlugBase(parsed.data.title));
  const previewUrl = parsed.data.previewUrls[0] ?? null;

  const resource = await createAdminResourceRecord({
    title: parsed.data.title,
    slug,
    description: parsed.data.description,
    type: parsed.data.type,
    status: parsed.data.status,
    isFree: parsed.data.isFree || parsed.data.price === 0,
    price: parsed.data.isFree ? 0 : parsed.data.price,
    fileUrl: parsed.data.fileUrl ?? null,
    categoryId: parsed.data.categoryId ?? null,
    featured: parsed.data.featured,
    level: parsed.data.level ?? null,
    license: parsed.data.license ?? null,
    visibility: parsed.data.visibility ?? null,
    authorId: parsed.data.authorId ?? adminUserId,
    tagIds: parsed.data.tagIds,
    previewUrls: parsed.data.previewUrls,
    previewUrl,
  });

  await Promise.all([
    logActivity({
      userId: adminUserId,
      action: "resource_created",
      entityType: "resource",
      entityId: resource.id,
      meta: { title: resource.title },
    }),
    logAdminAction({
      adminId: adminUserId,
      action: "RESOURCE_CREATED",
      entityType: "resource",
      entityId: resource.id,
      metadata: { title: resource.title },
    }),
  ]);

  return { success: true, data: resource };
}

export async function createOwnedResource(input: unknown, ownerUserId: string) {
  const actor = await findAdminActor(ownerUserId);

  if (!actor) {
    throw new ResourceServiceError(401, {
      error: "User not found. Please sign out and sign in again.",
    });
  }

  if (!["ADMIN", "INSTRUCTOR"].includes(actor.role)) {
    throw new ResourceServiceError(403, {
      error: "Forbidden.",
    });
  }

  const parsed = CreateOwnedResourceSchema.safeParse(input);

  if (!parsed.success) {
    const { flattened, fieldErrors } = buildFieldErrors(parsed.error);
    throw new ResourceServiceError(400, {
      error: "Validation failed",
      fields: fieldErrors,
      errors: {
        fieldErrors: flattened.fieldErrors,
        formErrors: flattened.formErrors,
      },
    });
  }

  const slug = await generateUniqueSlug(toSlugBase(parsed.data.title));
  const previewUrls = (parsed.data.previewUrls ?? []).filter((url) => url.trim() !== "");
  const previewUrl = parsed.data.previewUrl ?? previewUrls[0] ?? null;

  const resource = await createOwnedResourceRecord({
    title: parsed.data.title,
    slug,
    description: parsed.data.description,
    type: "PDF",
    status: "DRAFT",
    isFree: parsed.data.isFree || parsed.data.price === 0,
    price: parsed.data.isFree ? 0 : parsed.data.price,
    fileUrl: null,
    stripePriceId: parsed.data.stripePriceId ?? null,
    stripeProductId: parsed.data.stripeProductId ?? null,
    categoryId: parsed.data.categoryId ?? null,
    featured: false,
    authorId: ownerUserId,
    tagIds: parsed.data.tagIds ?? [],
    previewUrls,
    previewUrl,
  });

  return { data: resource };
}

export async function createAdminResourcesInBulk(input: unknown, adminUserId: string) {
  const parsed = BulkRequestSchema.safeParse(input);

  if (!parsed.success) {
    throw new ResourceServiceError(400, {
      error: parsed.error.errors[0].message,
    });
  }

  const validItems: {
    row: number;
    title: string;
    description: string;
    type: "PDF" | "DOCUMENT";
    status: "DRAFT" | "PUBLISHED";
    isFree: boolean;
    price: number;
    fileUrl: string | null;
    categoryId: string | null;
    featured: boolean;
    authorId: string;
    tagIds: string[];
    previewUrls: string[];
    previewUrl: string | null;
    slug: string;
  }[] = [];
  const errors: { row: number; title?: string; message: string }[] = [];
  const batchSlugs = new Set<string>();

  for (let index = 0; index < parsed.data.resources.length; index += 1) {
    const row = index + 1;
    const raw = parsed.data.resources[index];
    const rawTitle = (raw as Record<string, unknown>)?.title as string | undefined;
    const item = BulkItemSchema.safeParse(raw);

    if (!item.success) {
      errors.push({
        row,
        title: rawTitle,
        message: item.error.errors[0].message,
      });
      continue;
    }

    let categoryId: string | null = null;
    if (item.data.categorySlug) {
      const category = await findCategoryBySlug(item.data.categorySlug);
      if (!category) {
        errors.push({
          row,
          title: item.data.title,
          message: `Category not found: "${item.data.categorySlug}"`,
        });
        continue;
      }

      categoryId = category.id;
    }

    const tagIds: string[] = [];
    let tagError = false;

    for (const tagSlug of item.data.tagSlugs) {
      const tag = await findTagBySlug(tagSlug);
      if (!tag) {
        errors.push({
          row,
          title: item.data.title,
          message: `Tag not found: "${tagSlug}"`,
        });
        tagError = true;
        break;
      }

      tagIds.push(tag.id);
    }

    if (tagError) {
      continue;
    }

    const slug = await generateUniqueSlugForBatch(item.data.title, batchSlugs);

    validItems.push({
      row,
      title: item.data.title,
      description: item.data.description,
      type: item.data.type,
      status: item.data.status,
      isFree: item.data.price === 0,
      price: item.data.price,
      fileUrl: item.data.fileUrl ?? null,
      categoryId,
      featured: item.data.featured,
      authorId: adminUserId,
      tagIds,
      previewUrls: item.data.previewUrls,
      previewUrl: item.data.previewUrls[0] ?? null,
      slug,
    });
  }

  const created =
    validItems.length > 0 ? await createAdminResourcesBulk(validItems) : [];

  return {
    data: {
      success: created.length,
      failed: errors.length,
      created,
      errors,
    },
  };
}

export async function createAdminResourceDraft(adminUserId: string) {
  const actor = await findAdminActor(adminUserId);

  if (!actor) {
    throw new ResourceServiceError(401, {
      error: "User not found. Please sign out and sign in again.",
    });
  }

  if (actor.role !== "ADMIN") {
    throw new ResourceServiceError(403, {
      error: "Forbidden. Admin access required.",
    });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await deleteStaleDraftResources(cutoff);

  const title = "Untitled draft";
  const baseSlug = toSlugBase(title) || "draft-resource";
  const slug = await generateUniqueSlug(baseSlug);

  return createDraftResourceRecord({
    title,
    slug,
    authorId: adminUserId,
  });
}

export async function mutateAdminResourcesInBulk(input: unknown) {
  const parsed = BulkMutationSchema.safeParse(input);

  if (!parsed.success) {
    throw new ResourceServiceError(400, {
      error: parsed.error.errors[0]?.message ?? "Invalid payload.",
    });
  }

  const { ids, action, categoryId } = parsed.data;

  if (ids.length === 0) {
    throw new ResourceServiceError(400, {
      error: "No resource ids provided.",
    });
  }

  if (action === "delete") {
    const result = await softDeleteAdminResources(ids);
    return { data: { deleted: result.count, updated: 0 } };
  }

  if (action === "moveToCategory") {
    if (!categoryId) {
      throw new ResourceServiceError(400, {
        error: "categoryId is required when action is moveToCategory.",
      });
    }

    const result = await moveAdminResourcesToCategory(ids, categoryId);
    return { data: { updated: result.count, deleted: 0 } };
  }

  const nextStatus =
    action === "publish"
      ? "PUBLISHED"
      : action === "archive"
        ? "ARCHIVED"
        : "DRAFT";

  const result = await updateAdminResourceStatuses(ids, nextStatus);
  return { data: { updated: result.count, deleted: 0 } };
}

export async function updateAdminResource(
  resourceId: string,
  input: unknown,
  adminUserId: string,
) {
  const existing = await findResourceById(resourceId);

  if (!existing) {
    throw new ResourceServiceError(404, { error: "Resource not found." });
  }

  const parsed = PatchAdminResourceSchema.safeParse(input);

  if (!parsed.success) {
    const { fieldErrors } = buildFieldErrors(parsed.error);
    throw new ResourceServiceError(400, {
      error: "Validation failed",
      fields: fieldErrors,
    });
  }

  const resolvedIsFree = parsed.data.isFree ?? existing.isFree;
  const resolvedPrice = resolvedIsFree ? 0 : (parsed.data.price ?? existing.price);
  const resolvedSlug =
    parsed.data.slug !== undefined
      ? await generateUniqueSlug(parsed.data.slug, resourceId)
      : undefined;
  const previewUrls =
    parsed.data.previewUrls !== undefined
      ? parsed.data.previewUrls.filter((url) => url.trim() !== "")
      : undefined;
  const previewUrl =
    previewUrls !== undefined ? previewUrls[0] ?? null : undefined;

  const resource = await updateAdminResourceRecord(resourceId, {
    ...(parsed.data.title !== undefined && { title: parsed.data.title }),
    ...(parsed.data.description !== undefined && {
      description: parsed.data.description,
    }),
    ...(resolvedSlug !== undefined && { slug: resolvedSlug }),
    ...(parsed.data.type !== undefined && { type: parsed.data.type }),
    ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    isFree: resolvedIsFree,
    price: resolvedPrice,
    ...(parsed.data.fileUrl !== undefined && { fileUrl: parsed.data.fileUrl }),
    ...(parsed.data.categoryId !== undefined && {
      categoryId: parsed.data.categoryId,
    }),
    ...(parsed.data.featured !== undefined && { featured: parsed.data.featured }),
    ...(parsed.data.level !== undefined && { level: parsed.data.level }),
    ...(parsed.data.license !== undefined && { license: parsed.data.license }),
    ...(parsed.data.visibility !== undefined && {
      visibility: parsed.data.visibility,
    }),
    ...(parsed.data.authorId !== undefined && { authorId: parsed.data.authorId }),
    ...(previewUrl !== undefined && { previewUrl }),
    ...(parsed.data.tagIds !== undefined && { tagIds: parsed.data.tagIds }),
    ...(previewUrls !== undefined && { previewUrls }),
  });

  const action =
    parsed.data.status && parsed.data.status !== existing.status
      ? parsed.data.status === "PUBLISHED"
        ? "resource_published"
        : parsed.data.status === "ARCHIVED"
          ? "resource_archived"
          : "resource_updated"
      : "resource_updated";

  await Promise.all([
    logActivity({
      userId: adminUserId,
      action,
      entityType: "resource",
      entityId: resourceId,
      meta: { title: resource.title },
    }),
    logAdminAction({
      adminId: adminUserId,
      action:
        action === "resource_published"
          ? "RESOURCE_PUBLISHED"
          : action === "resource_archived"
            ? "RESOURCE_ARCHIVED"
            : "RESOURCE_UPDATED",
      entityType: "resource",
      entityId: resourceId,
      metadata: { title: resource.title },
    }),
  ]);

  return { data: resource };
}

export async function trashAdminResource(resourceId: string, adminUserId: string) {
  const existing = await findResourceById(resourceId);

  if (!existing) {
    throw new ResourceServiceError(404, { error: "Resource not found." });
  }

  const trashed = await softDeleteAdminResource(resourceId);

  await Promise.all([
    logActivity({
      userId: adminUserId,
      action: "resource_deleted",
      entityType: "resource",
      entityId: resourceId,
      meta: { title: trashed.title, deletedAt: trashed.deletedAt },
    }),
    logAdminAction({
      adminId: adminUserId,
      action: "RESOURCE_DELETED",
      entityType: "resource",
      entityId: resourceId,
      metadata: { title: trashed.title },
    }),
  ]);

  return {
    data: {
      id: resourceId,
      message: `"${trashed.title}" was moved to trash.`,
    },
  };
}
