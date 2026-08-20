/**
 * Fuzzy title matching between conference program talks and uploaded
 * presentations. Titles are the only shared field and sometimes drift between
 * submission and the printed program, so matching is similarity-based.
 */

/** Similarity at/above which a talk and a submission are considered the same. */
export const TITLE_MATCH_THRESHOLD = 0.85;

/** Lowercase, strip punctuation/symbols, collapse whitespace. */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Similarity in [0,1] of two titles after normalization (1 = identical). */
export function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const distance = levenshtein(na, nb);
  return 1 - distance / Math.max(na.length, nb.length);
}

/**
 * Return the best-matching item for a talk title whose similarity is at least
 * the threshold, or null. `getTitle` extracts the comparable title from an item.
 */
export function bestTitleMatch<T>(
  paperTitle: string,
  items: readonly T[],
  getTitle: (item: T) => string,
  threshold = TITLE_MATCH_THRESHOLD,
): T | null {
  let best: T | null = null;
  let bestScore = threshold;
  for (const item of items) {
    const score = titleSimilarity(paperTitle, getTitle(item));
    if (score >= bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}
