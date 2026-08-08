/**
 * Progress derived from which topics are done.
 *
 * Everything here is computed from `completedTopicIds` against the real topic
 * registry, so the dashboard's figures cannot disagree with each other or with
 * the cabinet. When persistence arrives, only the source list changes — the
 * derivations stay.
 */

import {
  CATEGORIES,
  TOPICS_BY_CATEGORY,
  ALL_TOPICS,
  getTopic,
  type Category,
  type Topic,
} from "@/lib/topics";
import { completedTopicIds } from "@/lib/mock";

const COMPLETED = new Set(completedTopicIds);

/**
 * Unknown ids are a bug, not a blank row.
 *
 * A completed id that no longer matches a topic means a rename went half-done,
 * and the visible symptom would be a dashboard quietly counting nine instead of
 * ten. Cheaper to fail here, at module load, with the id in hand.
 */
const missing = completedTopicIds.filter((id) => !getTopic(id));
if (missing.length > 0) {
  throw new Error(
    `completedTopicIds refers to topics that do not exist: ${missing.join(", ")}`,
  );
}

export function isCompleted(id: string): boolean {
  return COMPLETED.has(id);
}

export type CategoryProgress = {
  category: Category;
  done: number;
  total: number;
  /** 0–1, safe when a category is somehow empty. */
  ratio: number;
};

/** Every category, hardest-earned last is not the order — display order is. */
export function categoryProgress(): CategoryProgress[] {
  return CATEGORIES.map((category) => {
    const topics = TOPICS_BY_CATEGORY.get(category) ?? [];
    const done = topics.filter((t) => COMPLETED.has(t.id)).length;
    const total = topics.length;
    return { category, done, total, ratio: total > 0 ? done / total : 0 };
  });
}

/** The whole cabinet. */
export function collectionProgress() {
  const total = ALL_TOPICS.length;
  const done = ALL_TOPICS.filter((t) => COMPLETED.has(t.id)).length;
  return { done, total, ratio: total > 0 ? done / total : 0 };
}

/**
 * Most-completed category, or null when nothing is done yet.
 *
 * Ties break on display order rather than arbitrarily, so the answer is stable
 * between renders instead of depending on how the array happened to sort.
 */
export function favouriteCategory(): CategoryProgress | null {
  const ranked = categoryProgress().filter((c) => c.done > 0);
  if (ranked.length === 0) return null;
  return ranked.reduce((best, c) => (c.done > best.done ? c : best));
}

/** Categories with every topic done. */
export function clearedCategories(): Category[] {
  return categoryProgress()
    .filter((c) => c.total > 0 && c.done === c.total)
    .map((c) => c.category);
}

export function completedTopics(): Topic[] {
  return ALL_TOPICS.filter((t) => COMPLETED.has(t.id));
}
