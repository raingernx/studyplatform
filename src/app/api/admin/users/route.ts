import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { ok: false, res: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true, res: null };
}

/**
 * GET /api/admin/users?q=
 * Search users by name or email. Returns id, name, email for dropdown/assign-owner use.
 */
export async function GET(req: NextRequest) {
  const { ok, res } = await requireAdmin();
  if (!ok) return res!;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const users = await prisma.user.findMany({
      take: 20,
      orderBy: { name: "asc" },
      where:
        q.length > 0
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ data: users });
  } catch (err) {
    console.error("[ADMIN_USERS_GET]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
