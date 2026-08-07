/**
 * Topic registry.
 *
 * Every topic file is imported here, validated once at module load, and
 * indexed. Validation failures throw during the build rather than surfacing as
 * a broken screen at runtime.
 *
 * To add topics to an existing category, edit that JSON file — nothing here
 * changes. To add a category, add the value to CATEGORIES in `types.ts`, create
 * the JSON file, and add one line to FILES below.
 *
 * Static imports rather than filesystem reads, deliberately: this module has to
 * work in server components, client components and the edge runtime, and `fs`
 * works in none of the last two.
 */

import economics from "@/content/topics/economics.json";
import history from "@/content/topics/history.json";
import philosophy from "@/content/topics/philosophy.json";
import psychology from "@/content/topics/psychology.json";
import science from "@/content/topics/science.json";
import technology from "@/content/topics/technology.json";

import { parseTopicFile, TopicValidationError } from "./validate";
import type { Category, Difficulty, Topic } from "./types";

const FILES: ReadonlyArray<{ source: string; data: unknown }> = [
  { source: "economics.json", data: economics },
  { source: "history.json", data: history },
  { source: "philosophy.json", data: philosophy },
  { source: "psychology.json", data: psychology },
  { source: "science.json", data: science },
  { source: "technology.json", data: technology },
];

function loadAll(): Topic[] {
  const topics = FILES.flatMap((f) => parseTopicFile(f.data, f.source));

  const seen = new Map<string, number>();
  for (const t of topics) seen.set(t.id, (seen.get(t.id) ?? 0) + 1);
  const duplicates = [...seen.entries()]
    .filter(([, n]) => n > 1)
    .map(([id, n]) => `${id} (x${n})`);

  if (duplicates.length > 0) {
    throw new TopicValidationError("topic registry", [
      `duplicate topic id(s): ${duplicates.join(", ")}`,
    ]);
  }

  // Sorted by id so ordering never depends on file order or import sequence.
  return topics.sort((a, b) => a.id.localeCompare(b.id));
}

/** Every valid topic, sorted by id. */
export const ALL_TOPICS: readonly Topic[] = Object.freeze(loadAll());

export const TOPICS_BY_ID: ReadonlyMap<string, Topic> = new Map(
  ALL_TOPICS.map((t) => [t.id, t]),
);

function groupBy<K extends string>(key: (t: Topic) => K) {
  const out = new Map<K, Topic[]>();
  for (const t of ALL_TOPICS) {
    const k = key(t);
    const bucket = out.get(k);
    if (bucket) bucket.push(t);
    else out.set(k, [t]);
  }
  return out as ReadonlyMap<K, readonly Topic[]>;
}

export const TOPICS_BY_CATEGORY = groupBy<Category>((t) => t.category);
export const TOPICS_BY_DIFFICULTY = groupBy<Difficulty>((t) => t.difficulty);

/** Every tag in use, sorted, with counts. */
export const TAG_INDEX: ReadonlyMap<string, readonly Topic[]> = (() => {
  const out = new Map<string, Topic[]>();
  for (const t of ALL_TOPICS) {
    for (const tag of t.tags) {
      const bucket = out.get(tag);
      if (bucket) bucket.push(t);
      else out.set(tag, [t]);
    }
  }
  return new Map([...out.entries()].sort(([a], [b]) => a.localeCompare(b)));
})();
