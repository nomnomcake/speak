/**
 * Topic system — single import surface.
 *
 *   import { listTopics, getTopic, type Topic } from "@/lib/topics";
 *
 * Layers, innermost first:
 *   types.ts     the shapes and the category/difficulty unions
 *   validate.ts  runtime guards that JSON actually matches those shapes
 *   registry.ts  imports every topic file, validates, indexes
 *   query.ts     pure lookups and filters over the registry
 */

export {
  CATEGORIES,
  DIFFICULTIES,
  REFERENCE_KINDS,
  TIMINGS,
  DIFFICULTY_RANK,
  type Category,
  type Difficulty,
  type ReferenceKind,
  type Timings,
  type Topic,
  type TopicReference,
} from "./types";

export { parseTopic, parseTopicFile, TopicValidationError } from "./validate";

export {
  ALL_TOPICS,
  TOPICS_BY_ID,
  TOPICS_BY_CATEGORY,
  TOPICS_BY_DIFFICULTY,
  TAG_INDEX,
} from "./registry";

export {
  getTopic,
  requireTopic,
  listTopics,
  topicsInCategory,
  topicsAtDifficulty,
  topicsWithTag,
  allTags,
  relatedTopics,
  timingsFor,
  fileNameFor,
  byDifficultyThenTitle,
  topicForDate,
  type TopicFilter,
} from "./query";
