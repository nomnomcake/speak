/**
 * Query utilities over the topic registry.
 *
 * All functions are pure and synchronous — the registry is a frozen in-memory
 * array, so there is nothing to await and nothing to cache.
 */

import {
  ALL_TOPICS,
  TAG_INDEX,
  TOPICS_BY_CATEGORY,
  TOPICS_BY_DIFFICULTY,
  TOPICS_BY_ID,
} from "./registry";
import {
  DIFFICULTY_RANK,
  TIMINGS,
  type Category,
  type Difficulty,
  type Timings,
  type Topic,
} from "./types";

export type TopicFilter = {
  category?: Category | Category[];
  difficulty?: Difficulty | Difficulty[];
  /** Topic must carry every tag listed. */
  tags?: string[];
  /** Case-insensitive match against title, prompt, angles and tags. */
  search?: string;
};

function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

/** Look up one topic. Returns undefined rather than throwing. */
export function getTopic(id: string): Topic | undefined {
  return TOPICS_BY_ID.get(id);
}

/** Look up one topic, throwing if it is missing. For known-good ids. */
export function requireTopic(id: string): Topic {
  const topic = TOPICS_BY_ID.get(id);
  if (!topic) {
    throw new Error(
      `Unknown topic id "${id}". Known ids: ${[...TOPICS_BY_ID.keys()].join(", ")}`,
    );
  }
  return topic;
}

export function topicsInCategory(category: Category): readonly Topic[] {
  return TOPICS_BY_CATEGORY.get(category) ?? [];
}

export function topicsAtDifficulty(difficulty: Difficulty): readonly Topic[] {
  return TOPICS_BY_DIFFICULTY.get(difficulty) ?? [];
}

export function topicsWithTag(tag: string): readonly Topic[] {
  return TAG_INDEX.get(tag.toLowerCase()) ?? [];
}

export function allTags(): string[] {
  return [...TAG_INDEX.keys()];
}

function matchesSearch(topic: Topic, needle: string): boolean {
  const haystack = [
    topic.title,
    topic.researchPrompt,
    ...topic.suggestedAngles,
    ...topic.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

/** Filter the registry. An empty filter returns everything. */
export function listTopics(filter: TopicFilter = {}): Topic[] {
  const categories = toArray(filter.category);
  const difficulties = toArray(filter.difficulty);
  const tags = filter.tags?.map((t) => t.toLowerCase());
  const needle = filter.search?.trim().toLowerCase();

  return ALL_TOPICS.filter((topic) => {
    if (categories && !categories.includes(topic.category)) return false;
    if (difficulties && !difficulties.includes(topic.difficulty)) return false;
    if (tags && !tags.every((tag) => topic.tags.includes(tag))) return false;
    if (needle && !matchesSearch(topic, needle)) return false;
    return true;
  });
}

/** Other topics sharing the most tags, nearest first. Excludes the input. */
export function relatedTopics(id: string, limit = 3): Topic[] {
  const topic = TOPICS_BY_ID.get(id);
  if (!topic) return [];
  const tags = new Set(topic.tags);

  return ALL_TOPICS.filter((t) => t.id !== id)
    .map((t) => ({ t, shared: t.tags.filter((tag) => tags.has(tag)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.t.id.localeCompare(b.t.id))
    .slice(0, limit)
    .map((x) => x.t);
}

/** Phase durations for a topic, derived from its difficulty. */
export function timingsFor(topic: Topic): Timings {
  return TIMINGS[topic.difficulty];
}

/**
 * A search into the scholarly literature for this topic.
 *
 * Generated rather than stored. Hardcoding paper URLs per topic would mean
 * inventing citations that cannot be verified from here, and a plausible-
 * looking dead link is worse than no link — it costs the user the minutes the
 * session is measuring. A search always resolves, always reflects current
 * literature, and cannot rot.
 *
 * Specific papers belong in a topic's `references` with `kind: "paper"`, added
 * by hand once checked.
 */
export function studySearchUrl(topic: Topic): string {
  const query = [topic.title, ...topic.tags.slice(0, 2)].join(" ");
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
}

/**
 * The filename a topic is filed under, e.g. `SOC_002.TXT`.
 *
 * Numbered by position within its own category, never within whichever list is
 * displaying it — otherwise the same topic would be SCI_002 in the Science
 * folder and SCI_006 in Random. Lives here so the picker and the research
 * screen cannot disagree about what a file is called.
 */
export function fileNameFor(topic: Topic): string {
  const siblings = TOPICS_BY_CATEGORY.get(topic.category) ?? [];
  const index = siblings.findIndex((t) => t.id === topic.id);
  const prefix = topic.category.slice(0, 3).toUpperCase();
  return `${prefix}_${String(Math.max(0, index) + 1).padStart(3, "0")}.TXT`;
}

/** Sort helper: easiest first, then by title. */
export function byDifficultyThenTitle(a: Topic, b: Topic): number {
  return (
    DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
    a.title.localeCompare(b.title)
  );
}

/** FNV-1a. Small, fast, and stable across runtimes — unlike hashCode tricks. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * The topic for a given day.
 *
 * Takes an explicit `YYYY-MM-DD` string rather than reading the clock. A
 * component that called `new Date()` would pick one topic on the server and
 * possibly another on the client, producing a hydration mismatch — and a
 * statically prerendered page would freeze whatever day it was built on.
 * Passing the date in makes the choice the caller's problem, where it belongs.
 */
export function topicForDate(isoDate: string, pool = ALL_TOPICS): Topic {
  if (pool.length === 0) {
    throw new Error("topicForDate called with an empty topic pool");
  }
  return pool[hash(isoDate) % pool.length];
}
