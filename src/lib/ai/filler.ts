/**
 * Filler-word detection, computed locally from a transcript.
 *
 * No model involved. This is counting, and counting is something the browser
 * can do exactly — so it runs whether or not an AI provider is connected.
 *
 * The hard part is that most filler words are also real words. "I felt like a
 * fraud" and "it was, like, hard" both contain "like", and only one of them is
 * a verbal tic. Counting every occurrence would tell a user to stop saying a
 * word they used correctly, which is worse than not counting at all.
 *
 * So the list is split. Unambiguous fillers are counted outright; ambiguous
 * ones are counted only when the surrounding words suggest tic usage, and are
 * flagged so the UI can present the number as an estimate.
 */

import type { FillerHit } from "./types";

/** Never anything but a filler. */
const ALWAYS = ["um", "uh", "erm", "uhh", "umm", "er"];

/**
 * Words before which "like" is a comparison or a verb, not a tic.
 * "felt like", "looks like", "something like", "more like".
 */
const LIKE_LEGITIMATE_BEFORE = new Set([
  "is", "was", "are", "were", "be", "been", "being", "am",
  "feel", "feels", "felt", "look", "looks", "looked",
  "sound", "sounds", "sounded", "seem", "seems", "seemed",
  "act", "acts", "acted", "just", "more", "less", "much",
  "something", "anything", "nothing", "someone", "anyone",
  "exactly", "somewhat", "behave", "behaves", "behaved",
]);

/** "like a genome", "like the study" — a comparison, not a tic. */
const LIKE_LEGITIMATE_AFTER = new Set([
  "a", "an", "the", "this", "that", "these", "those", "my", "your", "our",
  "his", "her", "its", "their",
]);

/** "you know that…", "you know why…" is a clause, not a tic. */
const YOU_KNOW_LEGITIMATE_AFTER = new Set([
  "that", "what", "why", "how", "when", "where", "who", "whether", "if",
]);

/** "kind of person", "sort of thing" — a noun follows, so it is a category. */
const OF_LEGITIMATE_AFTER = new Set([
  "person", "people", "thing", "things", "way", "ways", "idea", "ideas",
  "problem", "problems", "system", "systems", "model", "models",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Count fillers in a transcript.
 *
 * Returns null for an empty transcript rather than a zero: "you said no filler
 * words" and "there was nothing to read" are different claims.
 */
export function countFillers(
  text: string,
): { total: number; breakdown: FillerHit[] } | null {
  const w = words(text);
  if (w.length === 0) return null;

  const counts = new Map<string, { count: number; ambiguous: boolean }>();
  const bump = (key: string, ambiguous: boolean) => {
    const prev = counts.get(key) ?? { count: 0, ambiguous };
    counts.set(key, { count: prev.count + 1, ambiguous });
  };

  for (let i = 0; i < w.length; i++) {
    const cur = w[i];
    const prev = i > 0 ? w[i - 1] : "";
    const next = i + 1 < w.length ? w[i + 1] : "";

    if (ALWAYS.includes(cur)) {
      bump(cur === "umm" || cur === "uhh" ? cur.slice(0, 2) : cur, false);
      continue;
    }

    if (cur === "like") {
      if (LIKE_LEGITIMATE_BEFORE.has(prev)) continue;
      if (LIKE_LEGITIMATE_AFTER.has(next)) continue;
      bump("like", true);
      continue;
    }

    if (cur === "you" && next === "know") {
      const after = i + 2 < w.length ? w[i + 2] : "";
      if (YOU_KNOW_LEGITIMATE_AFTER.has(after)) continue;
      bump("you know", true);
      i += 1;
      continue;
    }

    if ((cur === "kind" || cur === "sort") && next === "of") {
      const after = i + 2 < w.length ? w[i + 2] : "";
      if (OF_LEGITIMATE_AFTER.has(after)) continue;
      bump(`${cur} of`, true);
      i += 1;
      continue;
    }

    if (cur === "basically" || cur === "literally" || cur === "actually") {
      bump(cur, true);
      continue;
    }

    // "So" is only a tic when it opens a thought. Mid-sentence it is a
    // conjunction doing real work, and "so important" is an intensifier.
    if (cur === "so" && i === 0) {
      bump("so", true);
      continue;
    }
  }

  const breakdown = [...counts.entries()]
    .map(([word, v]) => ({ word, count: v.count, ambiguous: v.ambiguous }))
    .sort((a, b) => b.count - a.count);

  return {
    total: breakdown.reduce((sum, f) => sum + f.count, 0),
    breakdown,
  };
}

/** Word count and pace, both exact given a transcript and a duration. */
export function paceMetrics(text: string, speakingMs: number) {
  const n = words(text).length;
  if (n === 0) return { wordsSpoken: null, wordsPerMinute: null };
  const minutes = speakingMs / 60_000;
  return {
    wordsSpoken: n,
    wordsPerMinute: minutes > 0 ? Math.round(n / minutes) : null,
  };
}
