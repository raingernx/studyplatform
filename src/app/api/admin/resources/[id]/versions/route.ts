import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

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

// GET /api/admin/resources/:id/versions
export async function GET(_req: Request, { params }: Params) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      select: { id: true, title: true },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    }

    const versions = await prisma.resourceVersion.findMany({
      where: { resourceId: params.id },
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

