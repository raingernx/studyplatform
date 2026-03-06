import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/purchases  –  returns the current user's completed purchases
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const purchases = await prisma.purchase.findMany({
      where: { userId: session.user.id, status: "COMPLETED" },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            slug: true,
            previewUrl: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: purchases });
  } catch (err) {
    console.error("[PURCHASES_GET]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
