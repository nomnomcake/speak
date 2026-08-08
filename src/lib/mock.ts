/**
 * The day's challenge.
 *
 * No longer a mock of progress. Streak, totals, recent sessions and
 * achievements all used to live here as hardcoded values; they now come from
 * stored attempts via `@/lib/attempts` and `@/lib/progress`, and the constants
 * were deleted rather than left lying around — a `streak = { current: 7 }`
 * export sitting next to a real one is an invitation to wire the wrong thing
 * back up.
 *
 * What remains is the date the daily topic is drawn for, which is a rendering
 * decision rather than fake data.
 */

import { RESEARCH_SECONDS, timingsFor, topicForDate } from "@/lib/topics";

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
  researchSeconds: RESEARCH_SECONDS,
  ...timings,
} as const;
