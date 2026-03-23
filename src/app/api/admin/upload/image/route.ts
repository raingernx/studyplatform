import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const R2_VARS = ["R2_ENDPOINT", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];

/**
 * POST /api/admin/upload/image
 * Body: multipart/form-data with field "file" (image).
 * Returns: { url: string } — public R2 URL suitable for storing in DB fields
 * such as imageUrl, previewUrl, etc.
 *
 * Requires R2 to be configured. Returns 503 if R2 env vars are missing.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!R2_VARS.every((v) => !!process.env[v])) {
      console.error("[UPLOAD_IMAGE] R2 storage is not configured.");
      return NextResponse.json(
        {
          error:
            "Image storage is not configured. Set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
        },
        { status: 503 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "file is required and must not be empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Image too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
        },
        { status: 400 },
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Invalid image type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 },
      );
    }

    const ext = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1] || "png";
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const key = `${randomHex}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await storage.upload(buffer, key, { contentType: mimeType });

    const url = storage.getUrl(key);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[UPLOAD_IMAGE]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
