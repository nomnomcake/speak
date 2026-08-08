/**
 * Grounding checks for a model's response.
 *
 * The prompt tells the evaluator never to invent things the speaker did not
 * say. This file is what makes that more than a hope: every quote the model
 * attributes to the speaker is checked against the actual transcript, and one
 * that is not there is stripped before it can reach the screen.
 *
 * That distinction matters more here than in most products. A speaking coach
 * that quotes you saying something you never said is not slightly wrong — it
 * has invented evidence about a person, and the user has no way to check it
 * short of rewatching their own recording.
 *
 * Matching is deliberately tolerant of surface differences and intolerant of
 * substance. Web Speech output has no punctuation and inconsistent casing, so
 * a model quoting "the mechanism is selection" against a transcript reading
 * "the mechanism is selection pressure" should pass; one quoting a sentence
 * that never occurred should not.
 */

export function normalizeForMatch(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Is `needle` a contiguous run of words inside `haystack`? */
function containsSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0) return false;
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

/**
 * Verify a quote appears in the transcript.
 *
 * Exact contiguous match first. Failing that, a quote counts as grounded when
 * nearly all of its words appear in one window of the transcript the same
 * length — which tolerates a dropped article or a recognition error without
 * admitting a sentence that was never spoken.
 */
export function verifyQuote(
  quote: string,
  transcript: string,
  { threshold = 0.85 }: { threshold?: number } = {},
): boolean {
  const q = normalizeForMatch(quote);
  const t = normalizeForMatch(transcript);
  if (q.length === 0 || t.length === 0) return false;
  if (q.length > t.length) return false;

  if (containsSequence(t, q)) return true;

  // Slide a window of the quote's length and measure overlap.
  const need = Math.ceil(q.length * threshold);
  const wanted = new Set(q);
  for (let i = 0; i + q.length <= t.length; i++) {
    let hits = 0;
    for (let j = 0; j < q.length; j++) {
      if (wanted.has(t[i + j])) hits += 1;
    }
    if (hits >= need) return true;
  }
  return false;
}

export type Grounded<T> = { value: T; strippedQuotes: number };

/**
 * Strip every quote that cannot be found in the transcript.
 *
 * The claim survives, the fabricated evidence does not: an observation the
 * model cannot support is still worth showing as an interpretation, whereas an
 * invented quotation is never worth showing at all. Callers report the strip
 * count so the report can say the analysis was partially unverifiable rather
 * than quietly presenting a thinner version of itself.
 */
export function stripUngroundedQuotes(
  quote: string | null | undefined,
  transcript: string | null | undefined,
): { quote: string | null; stripped: boolean } {
  if (!quote || !quote.trim()) return { quote: null, stripped: false };
  if (!transcript || !transcript.trim()) {
    // No transcript to check against, so nothing can be attributed at all.
    return { quote: null, stripped: true };
  }
  return verifyQuote(quote, transcript)
    ? { quote: quote.trim(), stripped: false }
    : { quote: null, stripped: true };
}

/** Scores must be integers in range; a 0-10 answer would render as an empty bar. */
export function clampScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
}
