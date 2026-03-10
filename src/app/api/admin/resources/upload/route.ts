import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Files are written here — outside public/ so they're never directly accessible. */
const UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

/** 50 MB hard cap (increase if needed). */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/zip",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
 * Saves the file to private-uploads/ and updates the Resource row with
 *   fileKey, fileName, fileSize, mimeType.
 *
 * The previous fileKey (if any) is deleted from disk after the DB update.
 *
 * Responses:
 *   200  { fileKey, fileName, fileSize }
 *   400  Missing fields / file too large
 *   401  Not authenticated
 *   403  Not ADMIN
 *   404  Resource not found
 *   500  Unexpected server error
 */
export async function POST(req: Request) {
  try {
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
        { error: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    // ── 3b. Validate MIME type ────────────────────────────────────────────
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed." },
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

    // ── 6. Ensure the upload directory exists ─────────────────────────────
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // ── 7. Write the new file to disk ─────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, fileKey), buffer);

    // ── 8. Update the Resource row ────────────────────────────────────────
    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
      },
      select: { fileKey: true, fileName: true, fileSize: true },
    });

    // ── 9. Remove the old file (after successful DB update) ───────────────
    //  Fire-and-forget: a leftover file on disk is far less harmful than
    //  failing the whole request because unlink threw.
    if (resource.fileKey && resource.fileKey !== fileKey) {
      unlink(path.join(UPLOAD_DIR, resource.fileKey)).catch((err) => {
        console.warn("[UPLOAD] Could not remove old file:", resource.fileKey, err);
      });
    }

    // ── 10. Respond ───────────────────────────────────────────────────────
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
