export type SearchTermRule = {
  key: string;
  aliases: readonly string[];
  recoveryFallback?: string;
};

export const SEARCH_TERM_RULES: readonly SearchTermRule[] = [
  {
    key: "worksheet",
    aliases: ["worksheet", "worksheets", "ใบงาน", "แบบฝึกหัด", "แบบฝึก"],
    recoveryFallback: "ใบงาน",
  },
  {
    key: "flashcard",
    aliases: ["flashcard", "flashcards", "แฟลชการ์ด", "บัตรคำ"],
    recoveryFallback: "แฟลชการ์ด",
  },
  {
    key: "note",
    aliases: ["note", "notes", "โน้ต", "สรุป", "สรุปบทเรียน"],
    recoveryFallback: "โน้ตสรุป",
  },
  {
    key: "template",
    aliases: ["template", "templates", "เทมเพลต", "แม่แบบ"],
  },
  {
    key: "guide",
    aliases: ["guide", "guides", "study-guide", "study-guides", "คู่มือ", "แนวทาง"],
  },
  {
    key: "lesson-plan",
    aliases: ["lesson-plan", "lesson-plans", "lesson", "แผนการสอน"],
    recoveryFallback: "แผนการสอน",
  },
  {
    key: "exam",
    aliases: ["exam", "test", "tests", "quiz", "quizzes", "ข้อสอบ", "แบบทดสอบ", "แนวข้อสอบ"],
    recoveryFallback: "แนวข้อสอบ",
  },
] as const;

export const SEARCH_SYNONYM_GROUPS = SEARCH_TERM_RULES.map((rule) => rule.aliases);

export const SEARCH_RECOVERY_FALLBACK_QUERIES = SEARCH_TERM_RULES.map(
  (rule) => rule.recoveryFallback,
).filter((term): term is string => typeof term === "string" && term.length > 0);

export const SEARCH_RELEVANCE_WEIGHTS = {
  tokenMatch: 18,
  exactTitle: 140,
  exactSlug: 120,
  exactTag: 95,
  exactCategory: 88,
  exactCreator: 76,
  prefixTitle: 52,
  prefixSlug: 44,
  prefixTag: 32,
  prefixCategory: 28,
  prefixCreator: 20,
  containsTitle: 18,
  containsSlug: 16,
  containsTag: 12,
  containsCategory: 10,
  containsCreator: 8,
  containsDescription: 4,
  similarityTitleOrSlug: 28,
  similarityTag: 20,
  similarityCategory: 16,
  similarityCreator: 12,
} as const;

export const SEARCH_MATCH_REASON_LABELS = {
  exactTitle: "Exact title match",
  exactKeyword: "Exact keyword match",
  tagPrefix: "Tag: ",
  categoryPrefix: "Category: ",
  creatorPrefix: "Creator: ",
  titleStartsWithSearch: "Title starts with your search",
  relatedTagPrefix: "Related tag: ",
  inPrefix: "In ",
  byPrefix: "By ",
  matchedDescription: "Matched in description",
  relatedResult: "Related result",
  fallbackMatch: "match",
} as const;
