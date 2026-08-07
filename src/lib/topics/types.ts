/**
 * Topic types.
 *
 * A Topic is a *seed*, not a lesson. It does not carry the text the user
 * reads — it carries a research prompt, angles worth taking, and references.
 * The brief itself is produced from these at session time.
 *
 * The literal unions below are the single source of truth for categories and
 * difficulties. Adding a value here makes it valid everywhere: the type system,
 * the runtime validator, and any UI that maps over the constant.
 */

export const CATEGORIES = [
  "science",
  "economics",
  "philosophy",
  "technology",
  "history",
  "psychology",
  "society",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ["plain", "technical", "adversarial"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const REFERENCE_KINDS = [
  "article",
  "paper",
  "book",
  "video",
  "dataset",
] as const;

export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

/**
 * A source worth reading. Modelled as an object rather than a bare URL string
 * so a reference can gain fields — retrieval date, paywall flag, excerpt —
 * without a migration.
 */
export type TopicReference = {
  label: string;
  url: string;
  kind?: ReferenceKind;
};

export type Topic = {
  /** Stable kebab-case identifier, unique across every topic file. */
  id: string;

  /**
   * Human-readable name.
   *
   * Never shown before the readout. A title is a summary, and revealing it
   * hands the user the synthesis the product is asking them to perform.
   */
  title: string;

  category: Category;
  difficulty: Difficulty;

  /** The question the brief should answer. One or two sentences. */
  researchPrompt: string;

  /**
   * Distinct framings a good explanation could take. Used to score whether
   * the speaker found a structure rather than listing facts.
   */
  suggestedAngles: string[];

  /** Lowercase keywords for filtering and related-topic lookup. */
  tags: string[];

  references: TopicReference[];
};

/** Phase durations in seconds, derived from difficulty. */
export type Timings = {
  readSeconds: number;
  lockoutSeconds: number;
  speakSeconds: number;
};

export const TIMINGS: Record<Difficulty, Timings> = {
  plain: { readSeconds: 45, lockoutSeconds: 10, speakSeconds: 60 },
  technical: { readSeconds: 60, lockoutSeconds: 15, speakSeconds: 90 },
  adversarial: { readSeconds: 90, lockoutSeconds: 20, speakSeconds: 120 },
};

/** Display order, hardest last. */
export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  plain: 0,
  technical: 1,
  adversarial: 2,
};
