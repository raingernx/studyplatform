import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

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

// GET /api/admin/resources/:id/versions
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const admin = await requireAdmin();
    if ("error" in admin) {
      return admin.error;
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    }

    const versions = await prisma.resourceVersion.findMany({
      where: { resourceId: id },
      orderBy: { version: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      data: versions.map((v) => ({
        id: v.id,
        version: v.version,
        fileName: v.fileName,
        fileSize: v.fileSize,
        mimeType: v.mimeType,
        changelog: v.changelog,
        createdAt: v.createdAt,
        createdBy: v.createdBy
          ? {
              id: v.createdBy.id,
              name: v.createdBy.name,
              email: v.createdBy.email,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("[ADMIN_RESOURCE_VERSIONS_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
