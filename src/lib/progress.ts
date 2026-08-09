/**
 * Progress derived from stored attempts.
 *
 * Pure functions over a list — nothing here reads storage or the clock, so the
 * same inputs always give the same output and today's date is something the
 * caller has to be explicit about. That matters more than it sounds: a streak
 * that quietly reads `new Date()` inside a render is a streak that differs
 * between server and client.
 *
 * Every figure falls out of the same attempt list, so the collection
 * percentage, the category bars and the favourite cannot contradict each other.
 */

import {
  CATEGORIES,
  TOPICS_BY_CATEGORY,
  ALL_TOPICS,
  getTopic,
  timingsFor,
  type Category,
} from "@/lib/topics";
import type { StoredAttempt } from "@/lib/attempts";
import { SCORE_KEYS, SCORE_LABELS } from "@/lib/ai/types";

/** Day bucket in the user's own timezone — a session at 11pm is that day. */
export function dayKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Topics with at least one finished attempt.
 *
 * Ids that no longer match a topic are dropped rather than counted. A topic
 * removed from the cabinet should not keep inflating a collection percentage
 * against a denominator it is no longer part of.
 */
export function completedIds(attempts: StoredAttempt[]): Set<string> {
  return new Set(attempts.map((a) => a.topicId).filter((id) => getTopic(id)));
}

export type CategoryProgress = {
  category: Category;
  done: number;
  total: number;
  ratio: number;
};

export function categoryProgress(done: Set<string>): CategoryProgress[] {
  return CATEGORIES.map((category) => {
    const topics = TOPICS_BY_CATEGORY.get(category) ?? [];
    const hit = topics.filter((t) => done.has(t.id)).length;
    const total = topics.length;
    return { category, done: hit, total, ratio: total > 0 ? hit / total : 0 };
  });
}

export function collectionProgress(done: Set<string>) {
  const total = ALL_TOPICS.length;
  const hit = ALL_TOPICS.filter((t) => done.has(t.id)).length;
  return { done: hit, total, ratio: total > 0 ? hit / total : 0 };
}

/** Most-completed category, or null when nothing is done. Ties break on order. */
export function favouriteCategory(done: Set<string>): CategoryProgress | null {
  const ranked = categoryProgress(done).filter((c) => c.done > 0);
  if (ranked.length === 0) return null;
  return ranked.reduce((best, c) => (c.done > best.done ? c : best));
}

export function clearedCategories(done: Set<string>): Category[] {
  return categoryProgress(done)
    .filter((c) => c.total > 0 && c.done === c.total)
    .map((c) => c.category);
}

export type Streak = { current: number; best: number; week: boolean[] };

/**
 * Consecutive days with at least one finished session.
 *
 * Today missing does not break the streak — it is still today, and a counter
 * that reads zero every morning until you have performed punishes people for
 * the hour they opened the app. The run is counted from yesterday in that case.
 */
export function streakFrom(attempts: StoredAttempt[], today: Date): Streak {
  const days = new Set(
    attempts.map((a) => dayKey(new Date(a.completedAt))),
  );

  const week: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    week.push(days.has(dayKey(d)));
  }

  let current = 0;
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const key of [...days].sort()) {
    const t = new Date(`${key}T00:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / 86_400_000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }

  return { current, best: Math.max(best, current), week };
}

/* ---------------------------------------------------------------------------
   Report scores over time
   ------------------------------------------------------------------------ */

/** Attempts that actually carry a score. Unscored ones are absent, not zero. */
export function scoredAttempts(attempts: StoredAttempt[]): StoredAttempt[] {
  return attempts.filter(
    (a) => typeof a.aiFeedback?.overallScore === "number",
  );
}

export type ScoreAverages = {
  count: number;
  overall: number | null;
  byDimension: { key: string; label: string; value: number }[];
};

/**
 * Mean score per dimension across scored sessions.
 *
 * Averaged only over sessions where that dimension was actually scored, not
 * over all sessions — a dimension a model skipped should not drag its own
 * average down as though it had been rated zero.
 */
export function scoreAverages(attempts: StoredAttempt[]): ScoreAverages {
  const scored = scoredAttempts(attempts);
  if (scored.length === 0) {
    return { count: 0, overall: null, byDimension: [] };
  }

  const overall = Math.round(
    scored.reduce((sum, a) => sum + (a.aiFeedback?.overallScore ?? 0), 0) /
      scored.length,
  );

  // flatMap rather than map+filter: a type predicate cannot widen the literal
  // key union back to string, and returning [] skips a dimension cleanly.
  const byDimension: ScoreAverages["byDimension"] = SCORE_KEYS.flatMap((key) => {
    const values = scored
      .map((a) => a.aiFeedback?.scores?.[key])
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) return [];
    return [
      {
        key: key as string,
        label: SCORE_LABELS[key],
        value: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
      },
    ];
  });

  return { count: scored.length, overall, byDimension };
}

export type CategoryScore = { category: Category; average: number; count: number };

/** Mean overall score per category, for "where am I strongest". */
export function categoryScores(attempts: StoredAttempt[]): CategoryScore[] {
  const buckets = new Map<Category, number[]>();
  for (const a of scoredAttempts(attempts)) {
    const topic = getTopic(a.topicId);
    if (!topic) continue;
    const list = buckets.get(topic.category) ?? [];
    list.push(a.aiFeedback?.overallScore ?? 0);
    buckets.set(topic.category, list);
  }
  return [...buckets.entries()]
    .map(([category, values]) => ({
      category,
      average: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
      count: values.length,
    }))
    .sort((a, b) => b.average - a.average);
}

/**
 * Change between the earlier and later halves of the scored history.
 *
 * Null below four sessions. Two points is a line through noise, and telling
 * someone they have improved 12% on the strength of one good day is the kind
 * of number that makes a product untrustworthy the first time it is wrong.
 */
export function improvement(
  attempts: StoredAttempt[],
): { delta: number; earlier: number; later: number } | null {
  const scored = scoredAttempts(attempts).sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  );
  if (scored.length < 4) return null;

  const mid = Math.floor(scored.length / 2);
  const mean = (rows: StoredAttempt[]) =>
    rows.reduce((s, a) => s + (a.aiFeedback?.overallScore ?? 0), 0) /
    rows.length;

  const earlier = Math.round(mean(scored.slice(0, mid)));
  const later = Math.round(mean(scored.slice(mid)));
  return { delta: later - earlier, earlier, later };
}

export type Achievement = {
  id: string;
  label: string;
  detail: string;
  earned: boolean;
};

/**
 * Every badge is checked against something an attempt actually records.
 *
 * Nothing here rewards opening the app. A badge that cannot be earned by doing
 * the thing well teaches the wrong lesson, so each of these reads real stored
 * data or is not offered at all.
 */
export function achievementsFrom(
  attempts: StoredAttempt[],
  today: Date,
): Achievement[] {
  const done = completedIds(attempts);
  const collection = collectionProgress(done);
  const streak = streakFrom(attempts, today);
  const cleared = clearedCategories(done);

  const categoriesTouched = new Set(
    attempts.map((a) => getTopic(a.topicId)?.category).filter(Boolean),
  );

  const deep = attempts.some(
    (a) => getTopic(a.topicId)?.difficulty === "adversarial",
  );

  // Finished inside the minute rather than running into the buffer.
  const tight = attempts.some((a) => {
    const topic = getTopic(a.topicId);
    if (!topic || a.recordedMs <= 0) return false;
    return a.recordedMs <= timingsFor(topic).speakSeconds * 1000;
  });

  /** Most topics done in any single category, for the shelf badges. */
  const deepestCategory = Math.max(
    0,
    ...categoryProgress(done).map((c) => c.done),
  );

  /**
   * Calibrated for a 350-topic cabinet.
   *
   * The thresholds used to assume 21 topics: "clear one category" was three
   * sessions and "every topic in the cabinet" was a weekend. At 350 those same
   * badges became a months-long grind and an unreachable one, so the ladder was
   * rebuilt with rungs that arrive at a sane rate — something early, something
   * at a month, something to still be chasing at a hundred.
   *
   * Nothing here rewards opening the app. Each still reads real stored data.
   */
  return [
    {
      id: "first",
      label: "First words",
      detail: "Finish one session",
      earned: attempts.length >= 1,
    },
    {
      id: "ten",
      label: "Ten down",
      detail: "Ten topics finished",
      earned: collection.done >= 10,
    },
    {
      id: "fifty",
      label: "Half century",
      detail: "Fifty topics finished",
      earned: collection.done >= 50,
    },
    {
      id: "archivist",
      label: "Archivist",
      detail: "A hundred and fifty topics",
      earned: collection.done >= 150,
    },
    {
      id: "week",
      label: "Week straight",
      detail: "Seven days in a row",
      earned: streak.best >= 7,
    },
    {
      id: "month",
      label: "Month straight",
      detail: "Thirty days in a row",
      earned: streak.best >= 30,
    },
    {
      id: "spread",
      label: "Polymath",
      detail: "All seven categories",
      earned: categoriesTouched.size >= 7,
    },
    {
      id: "shelf",
      label: "Deep shelf",
      detail: "Ten in one category",
      earned: deepestCategory >= 10,
    },
    {
      id: "cleared",
      label: "Full shelf",
      detail: "Clear a whole category",
      earned: cleared.length >= 1,
    },
    {
      id: "deep",
      label: "Deep cut",
      detail: "Finish a Class III topic",
      earned: deep,
    },
    {
      id: "tight",
      label: "Under the wire",
      detail: "Land it before the buffer",
      earned: tight,
    },
  ];
}

/**
 * The next round number worth aiming at.
 *
 * A collection bar reading 1% of 350 tells someone their effort is
 * insignificant, which is both discouraging and false — ten sessions is a real
 * achievement. Progress is shown against the next milestone instead, so the bar
 * moves visibly while the total stays honest.
 */
export function nextMilestone(doneCount: number, total: number) {
  const rungs = [1, 10, 25, 50, 100, 150, 250, total].filter(
    (n, i, a) => n <= total && a.indexOf(n) === i,
  );
  const target = rungs.find((n) => n > doneCount) ?? total;
  const previous = [...rungs].reverse().find((n) => n <= doneCount) ?? 0;
  const span = Math.max(1, target - previous);
  return {
    target,
    remaining: Math.max(0, target - doneCount),
    ratio: Math.min(1, Math.max(0, (doneCount - previous) / span)),
  };
}
