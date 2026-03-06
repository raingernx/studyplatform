import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@studyplatform.dev" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@studyplatform.dev",
      hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin user:", admin.email);

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "mathematics" },
      update: {},
      create: { name: "Mathematics", slug: "mathematics", description: "Algebra, calculus, and beyond." },
    }),
    prisma.category.upsert({
      where: { slug: "science" },
      update: {},
      create: { name: "Science", slug: "science", description: "Physics, chemistry, biology." },
    }),
    prisma.category.upsert({
      where: { slug: "humanities" },
      update: {},
      create: { name: "Humanities", slug: "humanities", description: "History, literature, philosophy." },
    }),
  ]);
  console.log("✅ Categories:", categories.map((c) => c.name).join(", "));

  // ── Tags ────────────────────────────────────────────────────────────────────
  const tagNames = ["beginner", "intermediate", "advanced", "worksheet", "exam-prep"];
  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { name, slug: name },
    });
  }
  console.log("✅ Tags seeded");

  // ── Sample free resource ────────────────────────────────────────────────────
  await prisma.resource.upsert({
    where: { slug: "intro-algebra-worksheet" },
    update: {},
    create: {
      title: "Intro to Algebra Worksheet",
      slug: "intro-algebra-worksheet",
      description: "A beginner-friendly algebra worksheet covering linear equations.",
      isFree: true,
      price: 0,
      status: "PUBLISHED",
      authorId: admin.id,
      categoryId: categories[0].id,
    },
  });
  console.log("✅ Sample resource seeded");

  console.log("🎉 Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
