/**
 * Runtime validation for topic JSON.
 *
 * TypeScript cannot check the contents of a JSON file against `Topic` — an
 * import is typed structurally and a typo in `"category": "econimics"` compiles
 * happily. These guards close that gap at module load, so a malformed topic
 * fails the build rather than surfacing as an empty panel later.
 *
 * Validation collects *every* problem rather than throwing on the first, so
 * fixing a new topic file is one pass instead of five.
 */

import {
  CATEGORIES,
  DIFFICULTIES,
  REFERENCE_KINDS,
  type Category,
  type Difficulty,
  type ReferenceKind,
  type Topic,
  type TopicReference,
} from "./types";

export class TopicValidationError extends Error {
  constructor(
    readonly source: string,
    readonly problems: string[],
  ) {
    super(
      `Invalid topic data in ${source}:\n` +
        problems.map((p) => `  - ${p}`).join("\n"),
    );
    this.name = "TopicValidationError";
  }
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function stringArray(
  v: unknown,
  field: string,
  problems: string[],
  { min = 1 }: { min?: number } = {},
): string[] {
  if (!Array.isArray(v)) {
    problems.push(`${field} must be an array of strings`);
    return [];
  }
  const bad = v.findIndex((item) => !isNonEmptyString(item));
  if (bad !== -1) {
    problems.push(`${field}[${bad}] must be a non-empty string`);
  }
  if (v.length < min) {
    problems.push(`${field} must have at least ${min} item(s), got ${v.length}`);
  }
  return v.filter(isNonEmptyString);
}

function oneOf<T extends readonly string[]>(
  v: unknown,
  allowed: T,
  field: string,
  problems: string[],
): T[number] | undefined {
  if (typeof v !== "string" || !allowed.includes(v)) {
    problems.push(
      `${field} must be one of: ${allowed.join(", ")} (got ${JSON.stringify(v)})`,
    );
    return undefined;
  }
  return v as T[number];
}

function parseReference(
  v: unknown,
  field: string,
  problems: string[],
): TopicReference | undefined {
  if (!isRecord(v)) {
    problems.push(`${field} must be an object with { label, url }`);
    return undefined;
  }

  if (!isNonEmptyString(v.label)) problems.push(`${field}.label is required`);
  if (!isNonEmptyString(v.url)) problems.push(`${field}.url is required`);

  if (isNonEmptyString(v.url)) {
    try {
      const parsed = new URL(v.url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        problems.push(`${field}.url must be http(s), got ${parsed.protocol}`);
      }
    } catch {
      problems.push(`${field}.url is not a valid URL: ${v.url}`);
    }
  }

  let kind: ReferenceKind | undefined;
  if (v.kind !== undefined) {
    kind = oneOf(v.kind, REFERENCE_KINDS, `${field}.kind`, problems);
  }

  if (!isNonEmptyString(v.label) || !isNonEmptyString(v.url)) return undefined;
  return { label: v.label, url: v.url, ...(kind ? { kind } : {}) };
}

/**
 * Validate one raw value as a Topic.
 *
 * @param raw    the parsed JSON value
 * @param source a human-readable origin, used in error messages
 */
export function parseTopic(raw: unknown, source: string): Topic {
  const problems: string[] = [];

  if (!isRecord(raw)) {
    throw new TopicValidationError(source, ["topic must be an object"]);
  }

  if (!isNonEmptyString(raw.id)) {
    problems.push("id is required");
  } else if (!ID_PATTERN.test(raw.id)) {
    problems.push(`id must be kebab-case (got "${raw.id}")`);
  }

  if (!isNonEmptyString(raw.title)) problems.push("title is required");

  const category = oneOf(raw.category, CATEGORIES, "category", problems);
  const difficulty = oneOf(raw.difficulty, DIFFICULTIES, "difficulty", problems);

  if (!isNonEmptyString(raw.researchPrompt)) {
    problems.push("researchPrompt is required");
  }

  const suggestedAngles = stringArray(
    raw.suggestedAngles,
    "suggestedAngles",
    problems,
    { min: 2 },
  );

  const tags = stringArray(raw.tags, "tags", problems, { min: 1 });
  const lowercased = tags.filter((t) => t !== t.toLowerCase());
  if (lowercased.length > 0) {
    problems.push(`tags must be lowercase: ${lowercased.join(", ")}`);
  }

  const searchTerms = stringArray(raw.searchTerms, "searchTerms", problems, {
    min: 2,
  });

  // The whole point of the field is that it is not the question. A term that
  // opens with an interrogative is the title pasted across, which puts the
  // finding into the search box and ends the research the session is measuring.
  const questions = searchTerms.filter((t) =>
    /^(why|how|what|when|where|whether|does|do|is|are)\b/i.test(t.trim()),
  );
  if (questions.length > 0) {
    problems.push(
      `searchTerms must be keywords, not questions: ${questions.join("; ")}`,
    );
  }

  // Backstop for a thesis phrased as a statement rather than a question. A
  // keyword names a thing and stops; past about six words it has started making
  // a claim. Deliberately *not* a check against the title — where a title is a
  // term of art ("Comparative advantage", "The CAP theorem") repeating it is
  // correct, because it identifies the subject without saying what is true of
  // it. The failure being guarded against is length and grammar, not overlap.
  const wordy = searchTerms.filter((t) => t.trim().split(/\s+/).length > 6);
  if (wordy.length > 0) {
    problems.push(
      `searchTerms must be keywords, not phrases (max 6 words): ${wordy.join("; ")}`,
    );
  }

  /**
   * References are optional now, and empty is a normal state.
   *
   * They were required back when the dossier listed them as the way in. The
   * toolbox replaced that: it builds searches from `searchTerms`, which always
   * resolve and cannot rot. A hand-checked reference is still better and the
   * field stays for topics that have one — but requiring one per topic meant
   * either checking several hundred URLs or inventing them, and an invented
   * citation is worse than none. It sends someone to a dead page during the
   * fifteen minutes the session is measuring.
   */
  let references: TopicReference[] = [];
  if (raw.references !== undefined && !Array.isArray(raw.references)) {
    problems.push("references must be an array when present");
  } else if (Array.isArray(raw.references)) {
    references = raw.references
      .map((r, i) => parseReference(r, `references[${i}]`, problems))
      .filter((r): r is TopicReference => r !== undefined);
  }

  if (problems.length > 0) {
    const label = isNonEmptyString(raw.id) ? `${source} → ${raw.id}` : source;
    throw new TopicValidationError(label, problems);
  }

  return {
    id: raw.id as string,
    title: raw.title as string,
    category: category as Category,
    difficulty: difficulty as Difficulty,
    researchPrompt: raw.researchPrompt as string,
    suggestedAngles,
    tags,
    searchTerms,
    references,
  };
}

/** Validate a whole file's worth of topics. */
export function parseTopicFile(raw: unknown, source: string): Topic[] {
  if (!Array.isArray(raw)) {
    throw new TopicValidationError(source, ["file must contain a JSON array"]);
  }
  return raw.map((entry, i) => parseTopic(entry, `${source}[${i}]`));
}
