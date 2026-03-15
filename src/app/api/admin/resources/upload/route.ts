import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { storage } from "@/lib/storage";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";

// ── Constants ─────────────────────────────────────────────────────────────────

/** 50 MB hard cap (increase if needed). */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** PDF, DOCX, XLSX, ZIP, images. Max 50 MB. */
const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const FILE_KEY_REGEX = /^[a-zA-Z0-9._-]+$/;

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/resources/upload
 *
 * Accepts multipart/form-data with two fields:
 *   - resourceId  (string)  — the resource to attach the file to
 *   - file        (File)    — the uploaded file
 *
 * Persists the file via the storage abstraction and updates the Resource row
 * with fileKey, fileName, fileSize, mimeType.
 *
 * The previous fileKey (if any) is deleted via storage.delete() after the
 * DB update succeeds.
 *
 * Responses:
 *   200  { fileKey, fileName, fileSize }
 *   400  Missing fields / file too large / invalid key
 *   401  Not authenticated
 *   403  Not ADMIN
 *   404  Resource not found
 *   500  Unexpected server error
 */
export async function POST(req: Request) {
  try {
    // ── 0. Rate limit — 20 uploads / minute per IP ────────────────────────
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.upload, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit":     String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "Retry-After":           String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // ── 1. Require ADMIN session ──────────────────────────────────────────
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // ── 2. Parse multipart form data ─────────────────────────────────────
    const formData = await req.formData();
    const resourceId = formData.get("resourceId");
    const file = formData.get("file");

    if (typeof resourceId !== "string" || !resourceId) {
      return NextResponse.json(
        { error: "resourceId is required." },
        { status: 400 }
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "file is required and must not be empty." },
        { status: 400 }
      );
    }

    // ── 3. Validate file size ─────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Maximum allowed size is ${
            MAX_FILE_SIZE_BYTES / (1024 * 1024)
          } MB.`,
        },
        { status: 400 }
      );
    }

    // ── 3b. Validate MIME type ────────────────────────────────────────────
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Unsupported format. Allowed: PDF, DOCX, XLSX, ZIP, and common image types.",
        },
        { status: 400 }
      );
    }

    // ── 4. Confirm resource exists ────────────────────────────────────────
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, fileKey: true },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // ── 5. Build a unique file key ────────────────────────────────────────
    //  Format: <16-char-hex>-<sanitized-original-name>
    //  The random prefix makes collisions essentially impossible.
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80);

    const fileKey = `${randomHex}-${sanitizedName}`;

    if (!FILE_KEY_REGEX.test(fileKey)) {
      return NextResponse.json(
        { error: "Generated file key is invalid." },
        { status: 400 }
      );
    }

    // ── 6. Persist file via storage provider ─────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    await storage.upload(buffer, fileKey);

    // ── 7. Update the Resource row and create a ResourceVersion snapshot ─
    const updated = await prisma.$transaction(async (tx) => {
      const updatedResource = await tx.resource.update({
        where: { id: resourceId },
        data: {
          fileKey,
          fileName: file.name,
          fileSize: file.size,
          mimeType,
        },
        select: { id: true, fileKey: true, fileName: true, fileSize: true },
      });

      const lastVersion = await tx.resourceVersion.findFirst({
        where: { resourceId },
        orderBy: { version: "desc" },
      });

      const nextVersion = (lastVersion?.version ?? 0) + 1;

      await tx.resourceVersion.create({
        data: {
          resourceId,
          version: nextVersion,
          fileKey: updatedResource.fileKey,
          fileName: updatedResource.fileName,
          fileSize: updatedResource.fileSize,
          mimeType,
          // fileUrl is only used for external storage; local uploads rely on fileKey
          changelog:
            nextVersion === 1
              ? "Initial upload"
              : `File updated (v${nextVersion.toString()})`,
          createdById: session.user.id ?? null,
        },
      });

      return updatedResource;
    });

    // ── 8. Remove the old file via storage provider (fire-and-forget) ─────
    if (resource.fileKey && resource.fileKey !== fileKey) {
      storage.delete(resource.fileKey).catch((err) => {
        console.warn("[UPLOAD] Could not remove old file:", resource.fileKey, err);
      });
    }

    await logActivity({
      userId: session.user.id!,
      action: "file_uploaded",
      entityType: "resource",
      entityId: resourceId,
      meta: {
        fileName: updated.fileName ?? file.name,
        versioning: { createdVersion: true },
      },
    });

    // ── 9. Respond ────────────────────────────────────────────────────────
    return NextResponse.json({
      fileKey: updated.fileKey,
      fileName: updated.fileName,
      fileSize: updated.fileSize,
    });
  } catch (err) {
    console.error("[UPLOAD_POST]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
