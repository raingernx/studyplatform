import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Must match the upload route. */
const UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

/** External hosts allowed for fileUrl redirects. */
const ALLOWED_DOWNLOAD_HOSTS = [
  "cdn.studyplatform.com",
  "storage.googleapis.com",
  "your-bucket.s3.amazonaws.com",
] as const;

type Params = { params: { resourceId: string } };

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/download/[resourceId]
 *
 * Secure file download endpoint.
 * Authentication → access control → delivery.
 *
 * Delivery priority:
 *   1. If resource.fileKey is set  → stream the file from private-uploads/
 *      (local storage — file never exposed via a public URL)
 *   2. Else if resource.fileUrl is set → redirect to the external URL
 *      (legacy / S3 / CDN hosted files)
 *   3. Otherwise → 404
 *
 * Access rules:
 *   - Free resources:  any authenticated user may download.
 *   - Paid resources:  requires a Purchase row with status = COMPLETED.
 *
 * Responses:
 *   200  File stream (for fileKey)
 *   302  Redirect to external URL (for fileUrl only)
 *   401  No valid session
 *   403  Paid resource with no COMPLETED purchase
 *   404  Resource not found, or no file attached
 *   500  Unexpected server error
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    // ── 1. Require authentication ─────────────────────────────────────────
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to download resources." },
        { status: 401 }
      );
    }

    const { resourceId } = params;

    // ── 2. Fetch the resource ─────────────────────────────────────────────
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 }
      );
    }

    // ── 3. Access control ─────────────────────────────────────────────────
    //
    // Free resources: any logged-in user may download.
    // Paid resources: require a COMPLETED purchase.
    if (!resource.isFree) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: session.user.id,
          resourceId,
          status: "COMPLETED",
        },
      });

      if (!purchase) {
        return NextResponse.json(
          { error: "Forbidden. You have not purchased this resource." },
          { status: 403 }
        );
      }
    }

    // ── 4. Check that a file is actually available ────────────────────────
    if (!resource.fileKey && !resource.fileUrl) {
      return NextResponse.json(
        { error: "File not available. Please contact support." },
        { status: 404 }
      );
    }

    // ── 5. Increment download counter (fire-and-forget, non-blocking) ─────
    prisma.resource
      .update({
        where: { id: resourceId },
        data: { downloadCount: { increment: 1 } },
      })
      .catch((err) => {
        console.error("[DOWNLOAD] Failed to increment downloadCount:", err);
      });

    // ── 6. Deliver the file ───────────────────────────────────────────────

    // ── Path A: locally stored file → stream from disk ────────────────────
    if (resource.fileKey) {
      const filePath = path.join(UPLOAD_DIR, resource.fileKey);

      // Safety: verify the resolved path is still inside UPLOAD_DIR
      // (guards against path-traversal if fileKey were somehow malformed)
      if (!filePath.startsWith(UPLOAD_DIR + path.sep)) {
        return NextResponse.json(
          { error: "Invalid file reference." },
          { status: 400 }
        );
      }

      if (!existsSync(filePath)) {
        console.error("[DOWNLOAD] File missing on disk:", filePath);
        return NextResponse.json(
          { error: "File not found on disk. Please contact support." },
          { status: 404 }
        );
      }

      const fileStats = await stat(filePath);
      const contentType = resource.mimeType ?? "application/octet-stream";
      const downloadName = resource.fileName ?? resource.fileKey;

      // Wrap the Node.js ReadStream in a Web ReadableStream
      const nodeStream = createReadStream(filePath);
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk: Buffer | string) => {
            controller.enqueue(
              typeof chunk === "string" ? Buffer.from(chunk) : chunk
            );
          });
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      // Sanitise the filename for Content-Disposition (RFC 6266)
      const safeFilename = downloadName.replace(/[^\w.\-]/g, "_");

      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
          "Content-Length": String(fileStats.size),
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // ── Path B: external URL → redirect ───────────────────────────────────
    // resource.fileUrl is guaranteed non-null here (checked above).
    try {
      const target = new URL(resource.fileUrl as string);
      const hostnameAllowed = ALLOWED_DOWNLOAD_HOSTS.includes(target.hostname as (typeof ALLOWED_DOWNLOAD_HOSTS)[number]);

      if (!hostnameAllowed) {
        return NextResponse.json(
          { error: "External file host not allowed." },
          { status: 400 }
        );
      }

      return NextResponse.redirect(target.toString());
    } catch {
      return NextResponse.json(
        { error: "Invalid external file URL." },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("[DOWNLOAD_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
