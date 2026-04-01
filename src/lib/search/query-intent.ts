const SYNONYM_GROUPS = [
  ["worksheet", "worksheets", "ใบงาน", "แบบฝึกหัด", "แบบฝึก"],
  ["flashcard", "flashcards", "แฟลชการ์ด", "บัตรคำ"],
  ["note", "notes", "โน้ต", "สรุป", "สรุปบทเรียน"],
  ["template", "templates", "เทมเพลต", "แม่แบบ"],
  ["guide", "guides", "study-guide", "study-guides", "คู่มือ", "แนวทาง"],
  ["lesson-plan", "lesson-plans", "lesson", "แผนการสอน"],
  ["exam", "test", "tests", "quiz", "quizzes", "ข้อสอบ", "แบบทดสอบ", "แนวข้อสอบ"],
] as const;

const synonymIndex = new Map<string, string[]>();

for (const group of SYNONYM_GROUPS) {
  const normalizedGroup = Array.from(
    new Set(group.map((term) => term.trim().toLowerCase()).filter(Boolean)),
  );

  for (const term of normalizedGroup) {
    synonymIndex.set(term, normalizedGroup);
  }
}

function normalizeToken(token: string) {
  return token.trim().toLowerCase();
}

function hasThaiCharacters(text: string) {
  return /[\u0E00-\u0E7F]/.test(text);
}

export function normalizeSearchText(query: string) {
  return query.trim().replace(/\s+/g, " ");
}

export function buildSearchQueryIntent(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const loweredQuery = normalizedQuery.toLowerCase();

  const rawTokens = loweredQuery
    .split(/[\s/_.-]+/)
    .map(normalizeToken)
    .filter(Boolean);

  const filteredTokens = Array.from(
    new Set(
      rawTokens.filter((token) => token.length > 1 || rawTokens.length === 1),
    ),
  );

  const tokenGroups = filteredTokens.map((token) => {
    const aliases = synonymIndex.get(token) ?? [token];
    return Array.from(new Set([token, ...aliases]));
  });

  return {
    normalizedQuery,
    loweredQuery,
    tokenGroups,
  };
}

function replaceTokenInQuery(query: string, from: string, to: string) {
  return normalizeSearchText(
    query
      .split(/\s+/g)
      .map((token) => (normalizeToken(token) === from ? to : token))
      .join(" "),
  );
}

function pickPreferredAlias(aliases: string[], preferThai: boolean) {
  if (preferThai) {
    return aliases.find(hasThaiCharacters) ?? aliases[0];
  }

  return aliases.find((alias) => !hasThaiCharacters(alias)) ?? aliases[0];
}

const FALLBACK_RECOVERY_QUERIES = [
  "ใบงาน",
  "แฟลชการ์ด",
  "โน้ตสรุป",
  "แนวข้อสอบ",
  "แผนการสอน",
] as const;

export function buildSearchRecoveryQueries(
  query: string,
  extraTerms: string[] = [],
  limit = 6,
) {
  const normalizedQuery = normalizeSearchText(query);
  const intent = buildSearchQueryIntent(normalizedQuery);
  const preferThai = hasThaiCharacters(normalizedQuery);
  const rawTokens = intent.loweredQuery
    .split(/\s+/g)
    .map(normalizeToken)
    .filter(Boolean);
  const suggestions = new Set<string>();

  intent.tokenGroups.forEach((aliases, index) => {
    const token = rawTokens[index];
    if (!token) {
      return;
    }

    const preferredAlias = pickPreferredAlias(aliases, preferThai);
    if (preferredAlias && preferredAlias !== token) {
      suggestions.add(replaceTokenInQuery(normalizedQuery, token, preferredAlias));
    }

    const alternateAlias = aliases.find((alias) => alias !== token && alias !== preferredAlias);
    if (alternateAlias) {
      suggestions.add(replaceTokenInQuery(normalizedQuery, token, alternateAlias));
    }
  });

  extraTerms
    .map(normalizeSearchText)
    .filter(Boolean)
    .forEach((term) => {
      if (term.toLowerCase() !== intent.loweredQuery) {
        suggestions.add(term);
      }
    });

  if (suggestions.size === 0) {
    for (const fallback of FALLBACK_RECOVERY_QUERIES) {
      if (fallback.toLowerCase() !== intent.loweredQuery) {
        suggestions.add(fallback);
      }
    }
  }

  return Array.from(suggestions).slice(0, limit);
}
