# Image Flow Audit — Findings and Fix

## 1. Where the image path is stored

- **Database (Prisma):**
  - **`Resource.previewUrl`** (scalar) — single thumbnail/first preview URL (e.g. `/uploads/abc123.jpg`).
  - **`ResourcePreview`** (relation) — multiple preview images; each row has `imageUrl` and `order`. The first image is also reflected in `Resource.previewUrl` when set by create/update.
- **Admin form:** Uses **`previewUrls`** (string array). First item is the thumbnail; all items are sent as `previewUrls` to the API. The API writes the first to `Resource.previewUrl` and all to `ResourcePreview`.
- **File storage:** Uploaded images are stored under **`/public/uploads`** (e.g. `public/uploads/abc123.jpg`). Stored paths in the DB are **`/uploads/abc123.jpg`** (public URL path).

## 2. Which field ResourceCard uses

- **ResourceCard** resolves the card image in this order (see `getCardImageUrl` in `ResourceCard.tsx`):
  1. `resource.thumbnailUrl`
  2. `resource.previewImages?.[0]`
  3. `resource.previewUrl`
  4. `/placeholder-resource.png`
- The card uses a plain **`<img src={imageSrc} />`** (not `next/image`), so relative paths like `/uploads/…` are valid.

## 3. Why the image was not rendering

- **Root cause:** Marketplace data was loaded **without** the **`previews`** relation. Only the scalar **`previewUrl`** was available.
- **If `previewUrl` was never set** (e.g. resource created before we set it on create/update, or only `ResourcePreview` rows existed), the resource object had **`previewUrl: null`** and no way to get the first preview from `previews[0].imageUrl`.
- So in those cases the card received no URL and showed the placeholder.

## 4. Exact code changes made

### A. Marketplace resources query (`/resources` page)

**File:** `src/app/resources/page.tsx`

- **Include `previews`** in the main `findMany`:
  - `previews: { orderBy: { order: "asc" }, select: { imageUrl: true } }`
- **Normalize before passing to the grid:**
  - Map each resource so `previewUrl` is set from the first preview when the scalar is null:
  - `previewUrl: r.previewUrl ?? r.previews?.[0]?.imageUrl ?? null`

### B. MarketplaceHome (trending / new releases / categories)

**File:** `src/components/marketplace/MarketplaceHome.tsx`

- **Include `previews`** in all resource `findMany` calls (trending, new releases, and category resources).
- **Normalize** each resource with a small helper so `previewUrl` is set from the first preview when missing:
  - `previewUrl: r.previewUrl ?? r.previews?.[0]?.imageUrl ?? null`
- Use the normalized lists (`trending`, `newReleases`, `categoriesWithPreviews`) when rendering.

### C. Public API GET /api/resources

**File:** `src/app/api/resources/route.ts`

- **Include `previews`** in the resource `findMany`.
- **Normalize** each item in the response so `previewUrl` is set from the first preview when missing. This fixes category (and any other) pages that load data from this API.

---

## 5. What was already correct (no change)

- **ResourceCard** — Already resolves `thumbnailUrl` → `previewImages[0]` → `previewUrl` → placeholder; uses `<img>` so `/uploads/…` works.
- **ResourceForm** — Sends `previewUrls`; thumbnail and preview uploads update that array; payload uses form state (no merge with previous DB values).
- **Admin API (create/update)** — Already sets `Resource.previewUrl` from the first `previewUrls` entry and replaces `ResourcePreview` from the full array.
- **Create and Edit** — Both use `<ResourceForm mode="create" />` and `<ResourceForm mode="edit" resource={resource} />`; no duplicate form logic.
- **Storage** — Images under `public/uploads`; DB stores paths like `/uploads/filename.jpg`.

---

## 6. Verification

After the fix:

1. **Upload preview image** in admin → save → **marketplace cards** (e.g. `/resources`, trending, category pages) **show the image**.
2. **Existing resources** that have only `ResourcePreview` rows (and null `previewUrl`) now get a display URL from `previews[0].imageUrl`.
3. **Category page** (data from GET `/api/resources`) also gets normalized `previewUrl`, so images show there too.

No database schema changes; only query `include` and response normalization were added.
