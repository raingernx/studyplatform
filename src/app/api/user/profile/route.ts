import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email } = body as { name?: unknown; email?: unknown };

  const updates: { name?: string | null; email?: string | null } = {};

  if (typeof name === "string") {
    updates.name = name.trim().slice(0, 120);
  }

  if (typeof email === "string") {
    const trimmed = email.trim();
    updates.email = trimmed.length > 0 ? trimmed.slice(0, 190) : null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { name: true, email: true, image: true },
  });

  return NextResponse.json({ data: updated });
}

