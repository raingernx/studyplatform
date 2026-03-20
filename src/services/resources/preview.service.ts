/**
 * Preview service.
 *
 * Handles the /api/preview/[resourceId] request lifecycle:
 *   1. Rate-limit check (reuses the download limit — same scarcity).
 *   2. Authentication (session required).
 *   3. Resource lookup via repository.
 *   4. Ownership / access check (same rules as download).
 *   5. Preview eligibility check — unsupported types are redirected to the
 *      download route rather than returning an error.
 *   6. Signed URL generation with intent "preview" → Content-Disposition: inline.
 *   7. 307 redirect to the signed URL (R2 serves the file directly).
 *
 * Analytics:
 *   Preview does NOT fire RESOURCE_DOWNLOAD analytics and does NOT increment
 *   the download counter.  A dedicated RESOURCE_PREVIEW event is deferred to
 *   a future phase that includes the matching schema migration.
 *
 * Access rules:
 *   - Free resources: authenticated user required (no purchase needed).
 *   - Paid resources: authenticated user + completed purchase required.
 *   This mirrors the download service access model exactly.
 */

import { existsSync, createReadStream } from "fs";
import { stat } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { storage } from "@/lib/storage";
import { isPreviewSupported } from "@/lib/preview/previewPolicy";
import {
  findCompletedPurchaseByUserAndResource,
} from "@/repositories/purchases/purchase.repository";
import { findDownloadableResourceById } from "@/repositories/resources/resource.repository";

export async function handleResourcePreview(
  req: Request,
  resourceId: string,
): Promise<Response> {
  try {
    // ── 1. Rate limit ───────────────────────────────────────────────────────
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.download, ip);

    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        },
      );
    }

    // ── 2. Authentication ───────────────────────────────────────────────────
    // Check user.id, not just user — a session object with a user property
    // but no id (e.g. misconfigured NextAuth callback, replayed token) would
    // pass a session?.user guard but leave user.id undefined, allowing
    // unauthenticated access to free resources and bypassing analytics
    // attribution on paid ones.
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to preview resources." },
        { status: 401 },
      );
    }

    // ── 3. Resource lookup ──────────────────────────────────────────────────
    const resource = await findDownloadableResourceById(resourceId);

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    }

    // ── 4. Ownership / access check ─────────────────────────────────────────
    if (!resource.isFree) {
      const purchase = await findCompletedPurchaseByUserAndResource(
        userId,
        resourceId,
      );

      if (!purchase) {
        return NextResponse.json(
          { error: "Forbidden. You have not purchased this resource." },
          { status: 403 },
        );
      }
    }

    if (!resource.fileKey && !resource.fileUrl) {
      return NextResponse.json(
        { error: "File not available. Please contact support." },
        { status: 404 },
      );
    }

    // ── 5. Preview eligibility ──────────────────────────────────────────────
    // For files without a private key (external URL) or unsupported MIME types
    // we redirect to the download route — the user still gets the file, just
    // as an attachment rather than an inline preview.
    if (!resource.fileKey || !isPreviewSupported(resource.mimeType)) {
      return NextResponse.redirect(
        new URL(`/api/download/${resourceId}`, req.url),
        { status: 307 },
      );
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(resource.fileKey)) {
      return NextResponse.json(
        { error: "Invalid file reference." },
        { status: 400 },
      );
    }

    // ── 6. Signed URL generation — intent: "preview" → inline disposition ──
    const fileSource = await storage.getSignedUrl(resource.fileKey, {
      intent: "preview",
      contentType: resource.mimeType ?? "application/octet-stream",
    });

    // ── 7. Redirect (R2) or stream (local dev) ──────────────────────────────
    if (fileSource.startsWith("https://") || fileSource.startsWith("http://")) {
      // R2 / cloud: redirect to signed URL; R2 serves inline directly.
      return NextResponse.redirect(fileSource, {
        status: 307,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // Local filesystem fallback (dev only): stream the file inline.
    return serveLocalFileInline({
      filePath: fileSource,
      mimeType: resource.mimeType,
    });
  } catch (err) {
    console.error("[PREVIEW_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ── Local dev helper ─────────────────────────────────────────────────────────

async function serveLocalFileInline({
  filePath,
  mimeType,
}: {
  filePath: string;
  mimeType: string | null;
}): Promise<Response> {
  if (!existsSync(filePath)) {
    console.error("[PREVIEW] File missing on disk:", filePath);
    return NextResponse.json(
      { error: "File not found on disk. Please contact support." },
      { status: 404 },
    );
  }

  const fileStats = await stat(filePath);
  const contentType = mimeType ?? "application/octet-stream";
  const nodeStream = createReadStream(filePath);

  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer | string) => {
        controller.enqueue(
          typeof chunk === "string" ? Buffer.from(chunk) : chunk,
        );
      });
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // inline — let the browser render the file rather than saving it.
      "Content-Disposition": "inline",
      "Content-Length": String(fileStats.size),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
