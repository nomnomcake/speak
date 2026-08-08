/**
 * The shape of a speaking analysis.
 *
 * One rule governs this file: **every field is nullable, and null means "not
 * analysed" rather than "scored zero".** A report that cannot tell the
 * difference between "you used no filler words" and "nobody counted" is a
 * report that will eventually lie to someone, and the whole point of this
 * feature is that the user can trust what it says about them.
 *
 * `source` is never hidden from the UI. While the analysis is mock, the report
 * says so on its face.
 */

/** Which analyses actually ran, so the UI can label the rest honestly. */
export type Availability = "available" | "coming-soon";

export type ScoreSet = {
  clarity: number;
  organization: number;
  depth: number;
  delivery: number;
  persuasiveness: number;
  engagement: number;
};

export const SCORE_KEYS = [
  "clarity",
  "organization",
  "depth",
  "delivery",
  "persuasiveness",
  "engagement",
] as const satisfies readonly (keyof ScoreSet)[];

export const SCORE_LABELS: Record<keyof ScoreSet, string> = {
  clarity: "Clarity",
  organization: "Organization",
  depth: "Depth",
  delivery: "Delivery",
  persuasiveness: "Persuasiveness",
  engagement: "Engagement",
};

/**
 * A coaching note. Three parts, because advice without the observation behind
 * it is the "speak more confidently" genre the brief rules out.
 */
export type CoachingNote = {
  /** Two or three words, e.g. "Long setup". */
  headline: string;
  whatHappened: string;
  whyItMatters: string;
  whatToDoNext: string;
};

export type FillerHit = {
  word: string;
  count: number;
  /**
   * True when the word is only a filler in some uses ("like", "so"), so the
   * UI can say the count is a best guess rather than a fact.
   */
  ambiguous: boolean;
};

export type TranscriptSegment = {
  text: string;
  /** Milliseconds from the start of the talk. Null when the source has no timing. */
  startMs: number | null;
  endMs: number | null;
};

export type TranscriptDoc = {
  text: string;
  segments: TranscriptSegment[];
  /** How it was produced, so a reader knows how much to trust it. */
  source: "web-speech";
  /** Web Speech is a live guess, not a studio transcription. */
  approximate: true;
};

/** Everything measured locally, without a model. */
export type LocalMetrics = {
  speakingMs: number;
  wordsSpoken: number | null;
  wordsPerMinute: number | null;
  /** Requires audio-level analysis, which does not exist yet. */
  pauseCount: number | null;
};

export type AiFeedback = {
  version: 1;
  generatedAt: string;
  /**
   * `mock` means these judgements were generated without a model and must be
   * presented as a sample. Never omit this from the UI.
   */
  source: "mock" | "model";

  overallScore: number | null;
  summary: string | null;
  scores: Partial<ScoreSet> | null;

  topicCoverage: { score: number; explanation: string } | null;
  researchSynthesis: { score: number; explanation: string } | null;

  strongestMoment: string | null;
  biggestOpportunity: string | null;
  coachingNotes: CoachingNote[];

  fillerWords: { total: number; breakdown: FillerHit[] } | null;
  transcript: TranscriptDoc | null;
  metrics: LocalMetrics;

  /**
   * Human-readable reasons a section is empty, rendered as "coming soon"
   * rather than left as a mysterious blank.
   */
  unavailable: string[];
};

/** What the client sends the server. Deliberately small — no video, ever. */
export type AnalysisInput = {
  topic: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    researchPrompt: string;
    suggestedAngles: string[];
  };
  transcript: TranscriptDoc | null;
  speakingMs: number;
  recordingComplete: boolean;
};
