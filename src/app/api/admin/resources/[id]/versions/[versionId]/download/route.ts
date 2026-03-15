import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";

type Params = { params: { id: string; versionId: string } };

const UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { session, error: null as NextResponse | null };
}

// GET /api/admin/resources/:id/versions/:versionId/download
export async function GET(_req: Request, { params }: Params) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const version = await prisma.resourceVersion.findFirst({
      where: {
        id: params.versionId,
        resourceId: params.id,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Version not found." },
        { status: 404 },
      );
    }

    if (!version.fileKey && !version.fileUrl) {
      return NextResponse.json(
        { error: "No file associated with this version." },
        { status: 404 },
      );
    }

    if (version.fileKey) {
      const filePath = path.join(UPLOAD_DIR, version.fileKey);

      if (!filePath.startsWith(UPLOAD_DIR + path.sep)) {
        return NextResponse.json(
          { error: "Invalid file reference." },
          { status: 400 },
        );
      }

      if (!existsSync(filePath)) {
        return NextResponse.json(
          { error: "File not found on disk." },
          { status: 404 },
        );
      }

      const fileStats = await stat(filePath);
      const contentType = version.mimeType ?? "application/octet-stream";
      const downloadName = version.fileName ?? version.fileKey;

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

    // For now, do not support external URLs on version history for admin download.
    return NextResponse.json(
      { error: "External fileUrl is not supported for version download." },
      { status: 400 },
    );
  } catch (err) {
    console.error("[ADMIN_RESOURCE_VERSION_DOWNLOAD_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

