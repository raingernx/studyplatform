import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PAGE_SIZE = 50;

export async function GET(req: Request) {
  try {
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

    const url = new URL(req.url);
    const search = url.searchParams;

    const page = Math.max(1, parseInt(search.get("page") ?? "1", 10) || 1);
    const pageSizeRaw =
      parseInt(search.get("pageSize") ?? "20", 10) || 20;
    const pageSize = Math.min(Math.max(1, pageSizeRaw), MAX_PAGE_SIZE);

    const actionFilter = search.get("action") || undefined;
    const adminIdFilter = search.get("adminId") || undefined;
    const from = search.get("from");
    const to = search.get("to");

    const where: any = {};

    if (actionFilter) {
      where.action = actionFilter;
    }

    if (adminIdFilter) {
      where.adminId = adminIdFilter;
    }

    if (from) {
      where.createdAt = { ...(where.createdAt ?? {}), gte: new Date(from) };
    }

    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt ?? {}), lte: end };
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (err) {
    console.error("[ADMIN_AUDIT_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

