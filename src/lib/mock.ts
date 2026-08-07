/**
 * Mock data for phase 2.
 *
 * Everything here is illustrative and hardcoded. No persistence, no clock, no
 * scoring. When the real session loop lands, these shapes should be replaced by
 * the types in `docs/topic-schema.md` — the field names deliberately match, so
 * swapping the source is a one-file change.
 */

/** Today's challenge, as shown on the landing page. */
export const todaysChallenge = {
  /**
   * The title is deliberately absent. Per docs/topic-schema.md, a title is a
   * summary, and handing it over gives away the synthesis we are asking the
   * user to perform. They see it only in the readout.
   */
  domain: "Economics",
  difficulty: "Technical",
  readSeconds: 60,
  lockoutSeconds: 15,
  speakSeconds: 90,
  wordCount: 340,
} as const;

/** Consecutive days with at least one completed session. */
export const streak = {
  current: 7,
  best: 12,
  /** Most recent 7 days, oldest first. */
  week: [true, true, true, true, true, true, true] as boolean[],
} as const;

/** Lifetime totals. */
export const totals = {
  challenges: 42,
  since: "12 Jul",
  averageClarity: 0.78,
} as const;
