import {
  PrismaClient,
  ResourceStatus,
  ResourceType,
  ResourceLevel,
  ResourceLicense,
  ResourceVisibility,
  UserRole,
  CreatorStatus,
  CreatorApplicationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Categories ────────────────────────────────────────────────────────────────
// Marketplace categories — color/icon are derived from slug in UI
const CATEGORIES = [
  { name: "Mathematics",    slug: "mathematics",   description: "Algebra, calculus, and beyond." },
  { name: "Science",        slug: "science",        description: "Physics, chemistry, biology." },
  { name: "Language",       slug: "language",       description: "Languages, vocabulary, and grammar." },
  { name: "Humanities",     slug: "humanities",     description: "History, literature, philosophy." },
  { name: "Art & Creativity", slug: "art-creativity", description: "Art, design, and creative projects." },
  { name: "Early Learning", slug: "early-learning", description: "Resources for young learners." },
  { name: "Study Skills",   slug: "study-skills",   description: "Planners, note-taking, and study methods." },
  { name: "Test Prep",      slug: "test-prep",      description: "Exam practice and test preparation." },
];

// ── Tags ──────────────────────────────────────────────────────────────────────
const ALL_TAGS: { name: string; slug: string }[] = [
  // original
  { name: "Beginner",         slug: "beginner" },
  { name: "Intermediate",     slug: "intermediate" },
  { name: "Advanced",         slug: "advanced" },
  { name: "Worksheet",        slug: "worksheet" },
  { name: "Exam Prep",        slug: "exam-prep" },
  { name: "Computer Science", slug: "computer-science" },
  { name: "PDF",              slug: "pdf" },
  // new for demo resources
  { name: "Thai Language",    slug: "thai-language" },
  { name: "English Learning", slug: "english-learning" },
  { name: "Printable",        slug: "printable" },
  { name: "Flashcards",       slug: "flashcards" },
  { name: "Lesson Plan",      slug: "lesson-plan" },
  { name: "Classroom",        slug: "classroom" },
  { name: "O-NET",            slug: "onet" },
  { name: "TCAS",             slug: "tcas" },
  { name: "Early Childhood",  slug: "early-childhood" },
  { name: "Science",          slug: "science" },
  { name: "Mathematics",      slug: "mathematics" },
  { name: "Reading",          slug: "reading" },
];

// ── Original test resources (one per category, kept for backwards compat) ─────
const TEST_RESOURCES: {
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
}[] = [
  { title: "Intro to Algebra Worksheet",       slug: "intro-algebra-worksheet",       description: "A beginner-friendly algebra worksheet covering linear equations and basic expressions.",  categorySlug: "mathematics" },
  { title: "Basic Solar System Flashcards",    slug: "basic-solar-system-flashcards", description: "Flashcards for learning the planets and key facts about our solar system.",               categorySlug: "science" },
  { title: "English Vocabulary Builder",       slug: "english-vocabulary-builder",    description: "Essential vocabulary lists and exercises for English learners.",                          categorySlug: "language" },
  { title: "World History Timeline Worksheet", slug: "world-history-timeline-worksheet", description: "A printable timeline worksheet for major world history events.",                      categorySlug: "humanities" },
  { title: "Creative Drawing Prompts",         slug: "creative-drawing-prompts",      description: "30 prompts to spark creativity and daily drawing practice.",                              categorySlug: "art-creativity" },
  { title: "Kindergarten Numbers Worksheet",   slug: "kindergarten-numbers-worksheet", description: "Simple counting and number recognition for early learners.",                            categorySlug: "early-learning" },
  { title: "Study Planner Template",           slug: "study-planner-template",        description: "A printable weekly study planner to organize your revision.",                            categorySlug: "study-skills" },
  { title: "SAT Math Practice Sheet",          slug: "sat-math-practice-sheet",       description: "Practice problems for SAT math section with answer key.",                               categorySlug: "test-prep" },
];

// ── 15 KRUCraft marketplace demo resources ────────────────────────────────────
interface DemoResource {
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
  tagSlugs: string[];
  isFree: boolean;
  price: number;
  featured: boolean;
  level: ResourceLevel;
  license: ResourceLicense;
  downloadCount: number;
}

const DEMO_RESOURCES: DemoResource[] = [
  {
    title: "Thai Language Worksheet Bundle — Grade 1",
    slug: "thai-language-worksheet-bundle-grade-1",
    description:
      "A complete worksheet bundle for Grade 1 Thai language learners. Covers consonants, vowels, tone marks, and basic sentence structure with age-appropriate exercises. Ideal for both classroom use and at-home practice.",
    categorySlug: "language",
    tagSlugs: ["thai-language", "worksheet", "printable", "beginner"],
    isFree: true,
    price: 0,
    featured: true,
    level: ResourceLevel.BEGINNER,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 1247,
  },
  {
    title: "O-NET Mathematics Practice Set (ม.3)",
    slug: "onet-mathematics-practice-set-m3",
    description:
      "Full-length O-NET practice questions for Matthayom 3 mathematics. Covers number theory, algebra, geometry, statistics, and data analysis aligned to the official exam blueprint. Includes a detailed answer key.",
    categorySlug: "test-prep",
    tagSlugs: ["onet", "exam-prep", "mathematics", "intermediate"],
    isFree: false,
    price: 199,
    featured: true,
    level: ResourceLevel.INTERMEDIATE,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 892,
  },
  {
    title: "Primary Science Experiment Activity Cards",
    slug: "primary-science-experiment-activity-cards",
    description:
      "Twenty illustrated activity cards for primary school science lessons. Each card includes a simple experiment with a materials list, step-by-step instructions, and observation questions. No lab equipment required.",
    categorySlug: "science",
    tagSlugs: ["science", "worksheet", "printable", "beginner"],
    isFree: true,
    price: 0,
    featured: false,
    level: ResourceLevel.BEGINNER,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 456,
  },
  {
    title: "English Vocabulary Flashcards — 500 Essential Words",
    slug: "english-vocabulary-flashcards-500-essential-words",
    description:
      "Five hundred printable flashcards covering the most important English vocabulary for Thai learners. Organised by topic — school, home, food, travel, and daily life — with Thai translations and example sentences.",
    categorySlug: "language",
    tagSlugs: ["english-learning", "flashcards", "printable", "intermediate"],
    isFree: false,
    price: 99,
    featured: true,
    level: ResourceLevel.INTERMEDIATE,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 734,
  },
  {
    title: "Upper Secondary Mathematics Problem Pack (ม.4–6)",
    slug: "upper-secondary-mathematics-problem-pack",
    description:
      "A rigorous problem set covering upper secondary mathematics: limits and derivatives, trigonometry, exponential and logarithmic functions, and vectors. Designed for ม.4–6 students and university entrance preparation.",
    categorySlug: "mathematics",
    tagSlugs: ["mathematics", "worksheet", "advanced"],
    isFree: false,
    price: 149,
    featured: false,
    level: ResourceLevel.ADVANCED,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 189,
  },
  {
    title: "Preschool Tracing & Handwriting Worksheets",
    slug: "preschool-tracing-handwriting-worksheets",
    description:
      "Sixty printable tracing worksheets for preschool and kindergarten learners. Progresses from basic lines and shapes to Thai consonants and numbers. Large, clear letterforms with guide arrows and practice lines.",
    categorySlug: "early-learning",
    tagSlugs: ["early-childhood", "worksheet", "printable", "beginner"],
    isFree: true,
    price: 0,
    featured: true,
    level: ResourceLevel.BEGINNER,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 1089,
  },
  {
    title: "Teacher Weekly Lesson Plan Template Pack",
    slug: "teacher-weekly-lesson-plan-template-pack",
    description:
      "A set of ten editable lesson plan templates for Thai primary and secondary teachers. Includes weekly planners, learning objective trackers, and a class schedule grid. Formatted for A4 printing.",
    categorySlug: "study-skills",
    tagSlugs: ["lesson-plan", "printable", "classroom", "beginner"],
    isFree: false,
    price: 79,
    featured: false,
    level: ResourceLevel.BEGINNER,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 312,
  },
  {
    title: "Reading Comprehension Exercise Pack (Grades 4–6)",
    slug: "reading-comprehension-exercise-pack-grades-4-6",
    description:
      "Twelve reading passages with comprehension questions for Grades 4–6. Passages cover Thai culture, nature, science, and current events. Questions progress from literal recall to inference and critical thinking.",
    categorySlug: "language",
    tagSlugs: ["reading", "english-learning", "worksheet", "intermediate"],
    isFree: false,
    price: 129,
    featured: false,
    level: ResourceLevel.INTERMEDIATE,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 267,
  },
  {
    title: "Classroom Behavior Chart & Reward System",
    slug: "classroom-behavior-chart-reward-system",
    description:
      "A printable classroom management toolkit including a weekly behavior chart, star reward tokens, and a class rules poster. Supports positive reinforcement strategies for primary classroom teachers.",
    categorySlug: "study-skills",
    tagSlugs: ["classroom", "printable", "lesson-plan", "beginner"],
    isFree: true,
    price: 0,
    featured: false,
    level: ResourceLevel.BEGINNER,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 578,
  },
  {
    title: "TCAS Biology Review Notes & Summary Sheets",
    slug: "tcas-biology-review-notes-summary-sheets",
    description:
      "Comprehensive review notes for TCAS biology covering cell biology, genetics, evolution, ecology, and human physiology. Includes concise summary tables, key term glossaries, and fifteen past-paper style questions per unit.",
    categorySlug: "test-prep",
    tagSlugs: ["tcas", "exam-prep", "science", "advanced"],
    isFree: false,
    price: 249,
    featured: true,
    level: ResourceLevel.ADVANCED,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 445,
  },
  {
    title: "Early Math Counting & Sorting Activity Set",
    slug: "early-math-counting-sorting-activity-set",
    description:
      "Hands-on counting and sorting worksheets for Kindergarten to Grade 1. Includes cut-and-sort activities, number lines, ten-frames, and simple addition readiness exercises. Designed for active, tactile learners.",
    categorySlug: "mathematics",
    tagSlugs: ["mathematics", "early-childhood", "printable", "beginner"],
    isFree: true,
    price: 0,
    featured: false,
    level: ResourceLevel.BEGINNER,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 623,
  },
  {
    title: "Thailand Geography Worksheet Set",
    slug: "thailand-geography-worksheet-set",
    description:
      "Twelve worksheets covering Thai geography: provinces, rivers, mountain ranges, and regional cultures. Includes blank maps for labelling, matching activities, and short-answer questions aligned to the social studies curriculum.",
    categorySlug: "humanities",
    tagSlugs: ["worksheet", "printable", "intermediate"],
    isFree: false,
    price: 99,
    featured: false,
    level: ResourceLevel.INTERMEDIATE,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 134,
  },
  {
    title: "Creative Classroom Art Project Pack — 10 Activities",
    slug: "creative-classroom-art-project-pack",
    description:
      "Ten structured art projects for primary classrooms, each with a materials list, step-by-step guide, and example photos. Projects include paper weaving, mixed-media collage, and traditional Thai pattern drawing.",
    categorySlug: "art-creativity",
    tagSlugs: ["classroom", "printable", "beginner"],
    isFree: false,
    price: 149,
    featured: false,
    level: ResourceLevel.BEGINNER,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 201,
  },
  {
    title: "Student Study Planner & Goal Tracker (Printable)",
    slug: "student-study-planner-goal-tracker",
    description:
      "A printable study planner system including a semester overview, weekly schedule, daily to-do list, and goal-setting worksheet. Designed for Thai secondary students managing multiple subjects or preparing for exams.",
    categorySlug: "study-skills",
    tagSlugs: ["printable", "lesson-plan", "beginner"],
    isFree: false,
    price: 79,
    featured: false,
    level: ResourceLevel.BEGINNER,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 389,
  },
  {
    title: "Middle School Science Quiz & Assessment Set",
    slug: "middle-school-science-quiz-assessment-set",
    description:
      "A collection of twelve ready-to-print quizzes covering Matthayom 1–3 science topics: matter and its properties, forces and motion, ecosystems, and the human body. Each quiz includes a marking scheme.",
    categorySlug: "science",
    tagSlugs: ["science", "exam-prep", "worksheet", "intermediate"],
    isFree: false,
    price: 129,
    featured: false,
    level: ResourceLevel.INTERMEDIATE,
    license: ResourceLicense.PERSONAL_USE,
    downloadCount: 156,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database…");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashedAdminPassword = await bcrypt.hash("admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@studyplatform.dev" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@studyplatform.dev",
      hashedPassword: hashedAdminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin user:", admin.email);

  // ── Demo instructor ─────────────────────────────────────────────────────────
  const hashedInstructorPassword = await bcrypt.hash("KruCraft2024!", 12);

  const instructor = await prisma.user.upsert({
    where: { email: "demo.instructor@krucraft.dev" },
    update: {},
    create: {
      name: "Kru Mint",
      email: "demo.instructor@krucraft.dev",
      hashedPassword: hashedInstructorPassword,
      role: UserRole.INSTRUCTOR,
      emailVerified: new Date(),
      creatorDisplayName: "Kru Mint",
      creatorSlug: "kru-mint",
      creatorEnabled: true,
      creatorStatus: CreatorStatus.ACTIVE,
      creatorApplicationStatus: CreatorApplicationStatus.APPROVED,
    },
  });
  console.log("✅ Demo instructor:", instructor.email);

  // ── Categories ──────────────────────────────────────────────────────────────
  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const cat of CATEGORIES) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    categoryMap.set(c.slug, c);
  }
  console.log("✅ Categories:", CATEGORIES.map((c) => c.name).join(", "));

  // ── Tags ────────────────────────────────────────────────────────────────────
  const tagMap = new Map<string, { id: string }>();
  for (const { name, slug } of ALL_TAGS) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    tagMap.set(slug, tag);
  }
  console.log("✅ Tags seeded:", ALL_TAGS.length);

  // ── Original test resources (one per category) ────────────────────────────
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

  // ── 15 KRUCraft demo resources ────────────────────────────────────────────
  let demoCount = 0;
  for (const res of DEMO_RESOURCES) {
    const category = categoryMap.get(res.categorySlug);

    const resource = await prisma.resource.upsert({
      where: { slug: res.slug },
      // On re-run: do not overwrite downloadCount (may have grown from real usage)
      update: {
        title: res.title,
        description: res.description,
        categoryId: category?.id ?? null,
        type: ResourceType.PDF,
        status: ResourceStatus.PUBLISHED,
        visibility: ResourceVisibility.PUBLIC,
        isFree: res.isFree,
        price: res.price,
        featured: res.featured,
        level: res.level,
        license: res.license,
      },
      create: {
        title: res.title,
        slug: res.slug,
        description: res.description,
        type: ResourceType.PDF,
        status: ResourceStatus.PUBLISHED,
        visibility: ResourceVisibility.PUBLIC,
        isFree: res.isFree,
        price: res.price,
        featured: res.featured,
        level: res.level,
        license: res.license,
        downloadCount: res.downloadCount,
        authorId: instructor.id,
        categoryId: category?.id ?? null,
      },
    });

    // Connect tags — idempotent via composite PK upsert
    for (const tagSlug of res.tagSlugs) {
      const tag = tagMap.get(tagSlug);
      if (!tag) continue;
      await prisma.resourceTag.upsert({
        where: { resourceId_tagId: { resourceId: resource.id, tagId: tag.id } },
        update: {},
        create: { resourceId: resource.id, tagId: tag.id },
      });
    }

    demoCount++;
  }
  console.log("✅ Demo resources seeded:", demoCount);

  console.log("🎉 Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
