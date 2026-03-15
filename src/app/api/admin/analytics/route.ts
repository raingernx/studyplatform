import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  getActiveUsersLast7Days,
  getTopViewedResources,
  getConversionFunnel,
} from "@/lib/analytics";

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

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const [activeUsers, topResources, funnel] = await Promise.all([
      getActiveUsersLast7Days(),
      getTopViewedResources(),
      getConversionFunnel(),
    ]);

    return NextResponse.json({
      activeUsers,
      topResources,
      funnel,
    });
  } catch (err) {
    console.error("[ADMIN_ANALYTICS_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

