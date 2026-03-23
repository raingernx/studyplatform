import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/svg+xml", "svg"],
  ["image/webp", "webp"],
]);

const R2_VARS = ["R2_ENDPOINT", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];

/**
 * POST /api/admin/upload/logo
 * Body: multipart/form-data with field "file" (image).
 * Returns: { url: string } — public R2 URL suitable for storing in DB fields
 * such as logoUrl, faviconUrl, etc.
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
      console.error("[ADMIN_LOGO_UPLOAD] R2 storage is not configured.");
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
        { error: "A logo file is required." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Logo file is too large. Maximum size is 2 MB." },
        { status: 400 },
      );
    }

    const extension = ALLOWED_MIME_TYPES.get(file.type);
    if (!extension) {
      return NextResponse.json(
        { error: "Invalid logo type. Use PNG, JPG, SVG, or WebP." },
        { status: 400 },
      );
    }

    const key = `logo-${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await storage.upload(buffer, key, { contentType: file.type });

    const url = storage.getUrl(key);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[ADMIN_LOGO_UPLOAD]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
