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

  /**
   * The fallback matches in order, and that is the whole point.
   *
   * It used to build a Set of the quote's words and count how many appeared
   * anywhere in a transcript window — ignoring both order and repetition. So
   * "only can you system" and "of three properties two have only can you"
   * both validated as things the speaker had said, and the report rendered
   * them in quotation marks. A scrambled sentence is not a quotation, and this
   * file exists to stop exactly that.
   *
   * Now the quote's words must appear as an ordered subsequence within a
   * window not much longer than the quote — which still forgives a dropped
   * article or a recognition slip, and no longer forgives a reordering.
   */
  const need = Math.ceil(q.length * threshold);
  const window = Math.ceil(q.length * 1.4) + 2;

  for (let start = 0; start + need <= t.length; start++) {
    let matched = 0;
    let qi = 0;
    const end = Math.min(t.length, start + window);
    for (let i = start; i < end && qi < q.length; i++) {
      if (t[i] === q[qi]) {
        matched += 1;
        qi += 1;
      } else if (t[i] === q[qi + 1] && qi + 1 < q.length) {
        // Tolerate one dropped word without abandoning the order.
        matched += 1;
        qi += 2;
      }
    }
    if (matched >= need) return true;
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
