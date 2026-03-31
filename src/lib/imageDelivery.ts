/**
 * Public preview media is already hosted on a CDN/public bucket and does not
 * benefit much from going through Next's optimizer hop again. Keep local
 * assets on the normal Next.js path, but let absolute remote preview URLs load
 * directly from their source.
 */
export function shouldBypassImageOptimizer(src?: string | null) {
  if (!src) {
    return false;
  }

  if (src.startsWith("/")) {
    return false;
  }

  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
