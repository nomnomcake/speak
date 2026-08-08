/**
 * Mock data for phase 2.
 *
 * Streak and totals are still hardcoded — there is no persistence yet. The
 * topic is real: it comes from the topic registry in `@/lib/topics`.
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

/**
 * Topics marked done, as real ids from the registry.
 *
 * Ids rather than a count, so every derived figure on the dashboard — category
 * progress, collection percentage, favourite category — falls out of one list
 * and cannot contradict itself. A hardcoded "10 completed" alongside a
 * hardcoded "technology 3/3" is two numbers waiting to disagree.
 *
 * A validated id also means a topic renamed in JSON breaks the build here
 * rather than silently vanishing from the dashboard.
 */
export const completedTopicIds: readonly string[] = [
  "comparative-advantage",
  "jevons-paradox",
  "ship-of-theseus",
  "cognitive-dissonance",
  "availability-heuristic",
  "crispr-targeting",
  "cap-theorem",
  "byzantine-fault-tolerance",
  "public-key-cryptography",
  "moral-panic",
];

/** Most recent takes, newest first. */
export const recentSessions: readonly {
  topicId: string;
  /** ISO date, absolute — never "3 days ago" in stored data. */
  at: string;
  clarity: number;
}[] = [
  { topicId: "moral-panic", at: "2026-08-05", clarity: 0.82 },
  { topicId: "public-key-cryptography", at: "2026-08-04", clarity: 0.74 },
  { topicId: "availability-heuristic", at: "2026-08-03", clarity: 0.91 },
  { topicId: "jevons-paradox", at: "2026-08-02", clarity: 0.66 },
  { topicId: "crispr-targeting", at: "2026-08-01", clarity: 0.79 },
];

/**
 * The sticker book.
 *
 * Every one of these describes something the product can actually observe from
 * an Attempt — no "engagement" badges for opening the app. A badge that cannot
 * be earned by doing the thing well is a badge that teaches the wrong lesson.
 */
export const achievements: readonly {
  id: string;
  label: string;
  detail: string;
  earned: boolean;
}[] = [
  { id: "first", label: "First words", detail: "Finish one session", earned: true },
  { id: "week", label: "Week straight", detail: "Seven days in a row", earned: true },
  { id: "shelf", label: "Full shelf", detail: "Clear one category", earned: true },
  { id: "ten", label: "Ten down", detail: "Ten sessions finished", earned: true },
  { id: "spread", label: "Polymath", detail: "Five categories", earned: true },
  { id: "deep", label: "Deep cut", detail: "Finish a Class III topic", earned: false },
  { id: "tight", label: "Under the wire", detail: "Land it before the buffer", earned: false },
  { id: "all", label: "Archivist", detail: "Every topic in the cabinet", earned: false },
];
