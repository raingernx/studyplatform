import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/resources/:id/file
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    // Require authenticated admin
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      );
    }

    // Clear fileUrl for the resource
    await prisma.resource.update({
      where: { id },
      data: {
        fileUrl: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_RESOURCE_FILE_DELETE]", error);

    return NextResponse.json(
      { error: "Failed to remove file" },
      { status: 500 },
    );
  }
}

