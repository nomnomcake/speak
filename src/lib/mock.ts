/**
 * Mock data for phase 2.
 *
 * Streak and totals are still hardcoded — there is no persistence yet. The
 * topic is real: it comes from the topic registry in `@/lib/topics`.
 */

import { timingsFor, topicForDate } from "@/lib/topics";

/**
 * The date the daily topic is drawn for.
 *
 * Hardcoded on purpose. `topicForDate` takes an explicit date so the choice is
 * deterministic; reading the clock here would either freeze at build time (the
 * landing page is statically prerendered) or differ between server and client
 * and break hydration. Picking the real date needs a rendering decision —
 * `force-dynamic`, or selecting on the client after mount — which belongs to
 * the phase that makes sessions real.
 */
export const CURRENT_DATE = "2026-08-06";

const topic = topicForDate(CURRENT_DATE);
const timings = timingsFor(topic);

/** Today's challenge, as shown on the landing page. */
export const todaysChallenge = {
  /**
   * `topic.title` is deliberately not surfaced here. A title is a summary, and
   * handing it over gives away the synthesis we are asking the user to perform.
   * They see it only in the readout.
   */
  id: topic.id,
  category: topic.category,
  difficulty: topic.difficulty,
  ...timings,
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
