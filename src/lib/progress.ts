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

  return [
    {
      id: "first",
      label: "First words",
      detail: "Finish one session",
      earned: attempts.length >= 1,
    },
    {
      id: "week",
      label: "Week straight",
      detail: "Seven days in a row",
      earned: streak.best >= 7,
    },
    {
      id: "shelf",
      label: "Full shelf",
      detail: "Clear one category",
      earned: cleared.length >= 1,
    },
    {
      id: "ten",
      label: "Ten down",
      detail: "Ten topics finished",
      earned: collection.done >= 10,
    },
    {
      id: "spread",
      label: "Polymath",
      detail: "Five categories",
      earned: categoriesTouched.size >= 5,
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
    {
      id: "all",
      label: "Archivist",
      detail: "Every topic in the cabinet",
      earned: collection.total > 0 && collection.done === collection.total,
    },
  ];
}
