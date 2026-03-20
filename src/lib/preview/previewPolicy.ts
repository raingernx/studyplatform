/**
 * Preview delivery policy.
 *
 * A single source of truth for whether a file type supports first-class
 * inline preview via the /api/preview/[resourceId] route.
 *
 * Supported types are those the browser can render natively:
 *   - PDF   → rendered by the browser's built-in PDF viewer
 *   - Image → rendered as an <img> by the browser
 *
 * Unsupported types (DOCX, XLSX, ZIP, …) are not renderable inline — the
 * preview route redirects them to the download route instead of serving a
 * broken or empty page.
 *
 * No DRM or watermarking layer is implied — preview access is gated by the
 * same ownership / authentication rules as download.
 */

/** MIME types that can be rendered inline in a browser without any plugin. */
const INLINE_RENDERABLE_TYPES = new Set<string>([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

/**
 * Returns true if the given MIME type supports inline file preview.
 *
 * Handles any `image/*` type as a safe catch-all so future image formats
 * work without a policy update.
 *
 * @param mimeType - The MIME type stored on the Resource row (may be null if
 *                   the admin did not set it at upload time).
 */
export function isPreviewSupported(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  if (INLINE_RENDERABLE_TYPES.has(mimeType)) return true;
  // Catch-all for any image/* subtype not explicitly listed above.
  if (mimeType.startsWith("image/")) return true;
  return false;
}
