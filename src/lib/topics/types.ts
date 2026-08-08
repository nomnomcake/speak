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

/**
 * How difficulty is shown to a user: a filing tier, not a self-assessment.
 *
 * `adversarial` is authoring vocabulary. It is the right word when deciding
 * what a topic demands, and the wrong one printed on the object, where it
 * becomes the card telling the reader how hard it thinks it is — the one
 * judgement that is theirs to make. An archive stamps a class mark instead.
 *
 * Lives here rather than in a component because two screens show it, and the
 * failure mode of a second copy is the picker and the research card disagreeing
 * about the same file.
 */
export const CLASS_MARK: Record<Difficulty, string> = {
  plain: "Class I",
  technical: "Class II",
  adversarial: "Class III",
};

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

  /**
   * What the research tools actually search for.
   *
   * Authored rather than derived from the title, because most titles here are
   * the question — "Why bond prices and yields move in opposite directions"
   * states the very relationship the user is supposed to discover. Typing that
   * into Google hands over the answer before they have read anything, and the
   * session stops measuring research.
   *
   * These name the *subject* and stop: "bond pricing", "yield to maturity".
   * Where a title is already a term of art rather than a claim ("The CAP
   * theorem"), repeating it is correct — it identifies the thing without
   * saying what is true about it.
   *
   * Not derivable from `tags` either. Tags are thematic and deliberately
   * broad, so they lose the subject: the Broad Street pump is tagged
   * `epidemiology, evidence, public-health, method`, which finds neither
   * cholera nor John Snow.
   */
  searchTerms: string[];

  references: TopicReference[];
};

/**
 * The research window. The same for every topic and difficulty — the work is
 * to compress whatever you found into the talk, not to be given more time for
 * a harder subject.
 */
export const RESEARCH_SECONDS = 15 * 60;

/** Phase durations in seconds, derived from difficulty. */
export type Timings = {
  lockoutSeconds: number;
  speakSeconds: number;
};

/**
 * Every talk is one minute.
 *
 * Scaling talk length with difficulty was backwards: a harder idea does not
 * deserve more airtime, it demands harder compression. A fixed minute also
 * makes sessions comparable to each other, which scoring will need.
 *
 * `readSeconds` is gone. It belonged to the old 60-second brief, which the
 * 15-minute research window replaced.
 */
export const TIMINGS: Record<Difficulty, Timings> = {
  plain: { lockoutSeconds: 10, speakSeconds: 60 },
  technical: { lockoutSeconds: 15, speakSeconds: 60 },
  adversarial: { lockoutSeconds: 20, speakSeconds: 60 },
};

/** Display order, hardest last. */
export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  plain: 0,
  technical: 1,
  adversarial: 2,
};
