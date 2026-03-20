import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/svg+xml", "svg"],
  ["image/webp", "webp"],
]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

    await mkdir(UPLOAD_DIR, { recursive: true });

    const fileName = `logo-${Date.now()}-${randomUUID()}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${fileName}` });
  } catch (error) {
    console.error("[ADMIN_LOGO_UPLOAD]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
