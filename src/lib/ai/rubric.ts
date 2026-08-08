/**
 * The scoring rubric.
 *
 * Kept as data rather than prose inside the prompt so that the bands the model
 * is told to use and the bands documented for humans are the same text. A
 * rubric that drifts from its documentation is worse than none, because
 * everyone keeps trusting the documentation.
 *
 * ## Why anchored bands
 *
 * Asked to score speaking out of 100 with no anchors, a model returns 78 for
 * almost everything. The number carries no information and, worse, it flatters
 * — which for this product is actively harmful, because the whole premise is
 * that you find out whether you actually understood the idea.
 *
 * Each band below describes an observable state of the talk, not a feeling
 * about it. "Names the mechanism and one consequence" is checkable against a
 * transcript; "good clarity" is not.
 *
 * ## Calibration
 *
 * A competent first attempt at an unfamiliar topic should land in the 50s or
 * 60s. That is the intended centre of the scale, not a failing grade. 90+ is
 * reserved for a talk worth showing someone as an example of the form.
 */

export type Band = { min: number; label: string; description: string };

export type RubricEntry = {
  key: string;
  label: string;
  /** The single question the score answers. */
  question: string;
  bands: Band[];
};

const FIVE_BANDS = (
  d0: string,
  d40: string,
  d60: string,
  d80: string,
  d90: string,
): Band[] => [
  { min: 0, label: "Absent", description: d0 },
  { min: 40, label: "Emerging", description: d40 },
  { min: 60, label: "Competent", description: d60 },
  { min: 80, label: "Strong", description: d80 },
  { min: 90, label: "Exemplary", description: d90 },
];

export const RUBRIC: RubricEntry[] = [
  {
    key: "clarity",
    label: "Clarity",
    question: "Would a smart non-expert follow this on one hearing?",
    bands: FIVE_BANDS(
      "Jargon is used without definition; a listener could not restate the idea.",
      "The subject is identifiable but key terms arrive undefined or out of order.",
      "A non-expert could restate the gist, with one or two confusing passages.",
      "Terms are introduced before they are used; the through-line is followable throughout.",
      "Hard idea made to feel simple. A listener could teach it onward.",
    ),
  },
  {
    key: "organization",
    label: "Organization",
    question: "Does the talk have a shape, or is it a list?",
    bands: FIVE_BANDS(
      "No discernible order; points arrive as they occur to the speaker.",
      "A beginning and end exist but the middle wanders or doubles back.",
      "Recognisable structure; the listener can tell where they are.",
      "Each part sets up the next; the ordering is doing work.",
      "The structure itself carries the argument — reordering it would break the point.",
    ),
  },
  {
    key: "depth",
    label: "Depth",
    question: "Is there a mechanism, or only facts about the mechanism?",
    bands: FIVE_BANDS(
      "Definitions only. Nothing explains why the thing behaves as it does.",
      "One causal step is present; the rest is assertion.",
      "The central mechanism is explained, if thinly.",
      "Mechanism explained plus a consequence or limitation of it.",
      "Mechanism, consequence, and where it breaks down or is contested.",
    ),
  },
  {
    key: "delivery",
    label: "Delivery",
    question: "Is the language doing its job?",
    bands: FIVE_BANDS(
      "Sentences abandoned mid-thought; meaning is lost in the wreckage.",
      "Frequent restarts and hedges obscure otherwise sound points.",
      "Mostly complete sentences; some verbal padding.",
      "Economical and fluent; few wasted words.",
      "Every sentence lands. Nothing could be cut without loss.",
    ),
  },
  {
    key: "persuasiveness",
    label: "Persuasiveness",
    question: "Is there a claim, and is it supported?",
    bands: FIVE_BANDS(
      "No claim is made; the talk describes without arguing anything.",
      "A claim appears but nothing supports it.",
      "A claim with at least one supporting reason or example.",
      "Claim, support, and an acknowledgement of the obvious objection.",
      "The listener is moved from a plausible prior position to the speaker's.",
    ),
  },
  {
    key: "engagement",
    label: "Engagement",
    question: "Was there a reason to keep listening?",
    bands: FIVE_BANDS(
      "Flat recitation; no reason offered for why any of it matters.",
      "One attempt at a hook, unconnected to the rest.",
      "The stakes are stated somewhere in the talk.",
      "The stakes are established early and referred back to.",
      "Curiosity is created and then paid off.",
    ),
  },
];

/**
 * Two dimensions scored separately because they are about the assignment
 * rather than the speaking, and conflating them hides the interesting case:
 * a beautifully delivered talk that answered a different question.
 */
export const ASSIGNMENT_RUBRIC: RubricEntry[] = [
  {
    key: "topicCoverage",
    label: "Topic coverage",
    question: "Did they address what the research prompt actually asked?",
    bands: FIVE_BANDS(
      "The talk is about something else.",
      "Touches the subject but misses what the prompt asked for.",
      "Covers the central request; omits secondary parts.",
      "Covers the request including its harder clauses.",
      "Covers everything asked and identifies what the prompt left implicit.",
    ),
  },
  {
    key: "researchSynthesis",
    label: "Research synthesis",
    question: "Did they explain, or recite?",
    bands: FIVE_BANDS(
      "Disconnected facts in the order they were presumably read.",
      "Facts grouped by source rather than by idea.",
      "Material reorganised into the speaker's own order.",
      "Sources combined into one explanation that no single source gave.",
      "Imperfect paraphrase that demonstrably beats the sources for clarity.",
    ),
  },
];

/** Rendered into the system prompt so the model scores against this exact text. */
export function rubricForPrompt(): string {
  const render = (entries: RubricEntry[]) =>
    entries
      .map((e) => {
        const bands = e.bands
          .map((b) => `    ${b.min}+ ${b.label}: ${b.description}`)
          .join("\n");
        return `  ${e.label} — ${e.question}\n${bands}`;
      })
      .join("\n\n");

  return [
    "SPEAKING DIMENSIONS",
    render(RUBRIC),
    "",
    "ASSIGNMENT DIMENSIONS",
    render(ASSIGNMENT_RUBRIC),
  ].join("\n");
}
