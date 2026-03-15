import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; versionId: string }> };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { session };
}

// POST /api/admin/resources/:id/versions/:versionId/rollback
export async function POST(_req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if ("error" in admin) {
      return admin.error;
    }

    const { id: resourceId, versionId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const targetVersion = await tx.resourceVersion.findFirst({
        where: {
          id: versionId,
          resourceId,
        },
      });

      if (!targetVersion) {
        throw new Error("TARGET_VERSION_NOT_FOUND");
      }

      const lastVersion = await tx.resourceVersion.findFirst({
        where: { resourceId },
        orderBy: { version: "desc" },
      });

      const nextVersion = (lastVersion?.version ?? 0) + 1;

      const newVersion = await tx.resourceVersion.create({
        data: {
          resourceId,
          version: nextVersion,
          fileKey: targetVersion.fileKey,
          fileName: targetVersion.fileName,
          fileSize: targetVersion.fileSize,
          mimeType: targetVersion.mimeType,
          fileUrl: targetVersion.fileUrl,
          changelog: `Rollback to v${targetVersion.version}`,
          createdById: admin.session.user.id ?? null,
        },
      });

      const updatedResource = await tx.resource.update({
        where: { id: resourceId },
        data: {
          fileKey: targetVersion.fileKey,
          fileName: targetVersion.fileName,
          fileSize: targetVersion.fileSize,
          mimeType: targetVersion.mimeType,
          fileUrl: targetVersion.fileUrl,
        },
      });

      return { newVersion, updatedResource };
    });

    return NextResponse.json({
      data: {
        id: result.newVersion.id,
        version: result.newVersion.version,
        fileName: result.newVersion.fileName,
        fileSize: result.newVersion.fileSize,
        mimeType: result.newVersion.mimeType,
        changelog: result.newVersion.changelog,
        createdAt: result.newVersion.createdAt,
      },
    });
  } catch (err: any) {
    if (err instanceof Error && err.message === "TARGET_VERSION_NOT_FOUND") {
      return NextResponse.json(
        { error: "Version not found." },
        { status: 404 },
      );
    }

    console.error("[ADMIN_RESOURCE_VERSION_ROLLBACK_POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
