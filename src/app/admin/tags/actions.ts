"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a human-readable tag name into a URL-safe slug.
 *   "Exam Prep!"   → "exam-prep"
 *   "C++ Basics"   → "c-basics"
 *   " Algebra 101" → "algebra-101"
 */
import { toSlug } from "@/lib/slug";

/** Shared admin guard — rejects non-admin callers from every action. */
async function requireAdmin(): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthenticated");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

export type ActionResult = { error?: string };

export async function createTag(name: string): Promise<ActionResult> {
  await requireAdmin();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Tag name is required." };

  const slug = toSlug(trimmed);

  if (!slug) {
    return { error: "Tag name must contain at least one letter or number." };
  }

  const existing = await prisma.tag.findFirst({
    where: {
      OR: [
        { name: { equals: trimmed, mode: "insensitive" } },
        { slug },
      ],
    },
  });

  if (existing) {
    return { error: `A tag named "${existing.name}" already exists.` };
  }

  await prisma.tag.create({
    data: {
      name: trimmed,
      slug,
    },
  });

  revalidatePath("/admin/tags");

  return {};
}

export async function updateTag(
  id: string,
  name: string
): Promise<ActionResult> {
  await requireAdmin();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Tag name is required." };

  const slug = toSlug(trimmed);

  if (!slug) {
    return { error: "Tag name must contain at least one letter or number." };
  }

  const existing = await prisma.tag.findFirst({
    where: {
      AND: [
        { id: { not: id } },
        {
          OR: [
            { name: { equals: trimmed, mode: "insensitive" } },
            { slug },
          ],
        },
      ],
    },
  });

  if (existing) {
    return { error: `A tag named "${existing.name}" already exists.` };
  }

  await prisma.tag.update({
    where: { id },
    data: { name: trimmed, slug },
  });

  revalidatePath("/admin/tags");

  return {};
}

export async function deleteTag(id: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.resourceTag.deleteMany({
    where: { tagId: id },
  });

  await prisma.tag.delete({
    where: { id },
  });

  revalidatePath("/admin/tags");

  return {};
}