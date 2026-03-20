/**
 * Prisma `select` projection for marketplace resource cards.
 *
 * Using `select` instead of `include` means Postgres only returns the columns
 * the card UI actually renders.  Columns omitted from this projection are
 * never transmitted:
 *
 *   description · previewUrl · fileUrl · fileKey · fileSize · fileName
 *   mimeType · stripePriceId · stripeProductId · level · license
 *   visibility · viewCount · deletedAt · updatedAt · authorId · categoryId
 *
 * Preview images are resolved solely from the `previews` relation (take: 1).
 * The `withPreview` helper promotes `previews[0].imageUrl` → `previewUrl`.
 *
 * Tags are intentionally excluded from discover-section queries.
 * The `ResourceCardResource` type marks them optional, so cards render fine.
 */
export const RESOURCE_CARD_SELECT = {
  id:            true,
  title:         true,
  slug:          true,
  price:         true,
  isFree:        true,
  featured:      true,
  downloadCount: true,
  createdAt:     true,

  author: {
    select: {
      name: true,
    },
  },

  category: {
    select: {
      id:   true,
      name: true,
      slug: true,
    },
  },

  // Only the first preview image is needed for card thumbnails.
  // `withPreview` maps previews[0].imageUrl → result.previewUrl.
  previews: {
    take:    1,
    orderBy: { order: "asc" as const },
    select:  { imageUrl: true },
  },
} as const;

/**
 * Extended select that also includes tags — used for filtered/search listings
 * where tag badges may be displayed on cards.
 */
export const RESOURCE_CARD_WITH_TAGS_SELECT = {
  ...RESOURCE_CARD_SELECT,
  tags: {
    select: {
      tag: {
        select: {
          id:   true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const;
