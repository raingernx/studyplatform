import { PrismaClient, ResourceStatus, ResourceType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Marketplace categories with name, slug, description (color/icon are derived from slug in UI)
const CATEGORIES = [
  { name: "Mathematics", slug: "mathematics", description: "Algebra, calculus, and beyond." },
  { name: "Science", slug: "science", description: "Physics, chemistry, biology." },
  { name: "Language", slug: "language", description: "Languages, vocabulary, and grammar." },
  { name: "Humanities", slug: "humanities", description: "History, literature, philosophy." },
  { name: "Art & Creativity", slug: "art-creativity", description: "Art, design, and creative projects." },
  { name: "Early Learning", slug: "early-learning", description: "Resources for young learners." },
  { name: "Study Skills", slug: "study-skills", description: "Planners, note-taking, and study methods." },
  { name: "Test Prep", slug: "test-prep", description: "Exam practice and test preparation." },
];

// One test resource per category: title, slug, description (type PDF, free, published)
const TEST_RESOURCES: { title: string; slug: string; description: string; categorySlug: string }[] = [
  { title: "Intro to Algebra Worksheet", slug: "intro-algebra-worksheet", description: "A beginner-friendly algebra worksheet covering linear equations and basic expressions.", categorySlug: "mathematics" },
  { title: "Basic Solar System Flashcards", slug: "basic-solar-system-flashcards", description: "Flashcards for learning the planets and key facts about our solar system.", categorySlug: "science" },
  { title: "English Vocabulary Builder", slug: "english-vocabulary-builder", description: "Essential vocabulary lists and exercises for English learners.", categorySlug: "language" },
  { title: "World History Timeline Worksheet", slug: "world-history-timeline-worksheet", description: "A printable timeline worksheet for major world history events.", categorySlug: "humanities" },
  { title: "Creative Drawing Prompts", slug: "creative-drawing-prompts", description: "30 prompts to spark creativity and daily drawing practice.", categorySlug: "art-creativity" },
  { title: "Kindergarten Numbers Worksheet", slug: "kindergarten-numbers-worksheet", description: "Simple counting and number recognition for early learners.", categorySlug: "early-learning" },
  { title: "Study Planner Template", slug: "study-planner-template", description: "A printable weekly study planner to organize your revision.", categorySlug: "study-skills" },
  { title: "SAT Math Practice Sheet", slug: "sat-math-practice-sheet", description: "Practice problems for SAT math section with answer key.", categorySlug: "test-prep" },
];

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
  const categoryMap = new Map<string | null, { id: string; name: string; slug: string }>();
  for (const cat of CATEGORIES) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description ?? undefined },
      create: { name: cat.name, slug: cat.slug, description: cat.description ?? undefined },
    });
    categoryMap.set(c.slug, c);
  }
  console.log("✅ Categories:", CATEGORIES.map((c) => c.name).join(", "));

  // ── Tags ────────────────────────────────────────────────────────────────────
  const tagEntries: { name: string; slug: string }[] = [
    { name: "beginner", slug: "beginner" },
    { name: "intermediate", slug: "intermediate" },
    { name: "advanced", slug: "advanced" },
    { name: "worksheet", slug: "worksheet" },
    { name: "exam-prep", slug: "exam-prep" },
    { name: "Computer Science", slug: "computer-science" },
    { name: "PDF", slug: "pdf" },
  ];
  for (const { name, slug } of tagEntries) {
    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }
  console.log("✅ Tags seeded");

  // ── Test resources (one per category) ────────────────────────────────────────
  for (const res of TEST_RESOURCES) {
    const category = categoryMap.get(res.categorySlug);
    await prisma.resource.upsert({
      where: { slug: res.slug },
      update: {
        title: res.title,
        description: res.description,
        categoryId: category?.id ?? null,
        type: ResourceType.PDF,
        status: ResourceStatus.PUBLISHED,
        isFree: true,
        price: 0,
      },
      create: {
        title: res.title,
        slug: res.slug,
        description: res.description,
        type: ResourceType.PDF,
        status: ResourceStatus.PUBLISHED,
        isFree: true,
        price: 0,
        authorId: admin.id,
        categoryId: category?.id ?? null,
      },
    });
  }
  console.log("✅ Test resources seeded:", TEST_RESOURCES.length);

  console.log("🎉 Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
