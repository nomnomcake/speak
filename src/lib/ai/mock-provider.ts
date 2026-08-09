/**
 * ============================================================================
 *  MOCK ANALYSIS — NOT A REAL EVALUATION. DELETE WHEN A PROVIDER IS WIRED UP.
 * ============================================================================
 *
 * This exists so the report UI, the data model and the request pipeline can be
 * built and tested before an AI provider is connected. It is not a stand-in
 * for judgement and must never be presented as one: everything it returns is
 * stamped `source: "mock"`, and the report renders a banner saying so.
 *
 * What it does honestly:
 *   - counts filler words, words spoken and words per minute from the real
 *     transcript, because those are arithmetic and need no model
 *
 * What it refuses to do:
 *   - invent a strongest moment, a biggest opportunity or coaching notes. Those
 *     must quote what the speaker actually said, and a mock has no way to read
 *     meaning. They come back null and the UI shows "coming soon" rather than
 *     a convincing sentence about a talk nobody analysed.
 *   - score anything when there is no transcript. With nothing to read there is
 *     nothing to judge, and a number would be pure invention.
 *
 * The scores it does return, when a transcript exists, are derived from crude
 * surface features (length, vocabulary spread, filler density). They are
 * plausible enough to lay out a UI against and are clearly labelled as sample
 * output. They are not feedback.
 */

import type { AiFeedback, AnalysisInput, ScoreSet } from "./types";
import { countFillers, paceMetrics } from "./filler";

/** Deterministic per-transcript, so the same take does not score differently twice. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function mockAnalyze(input: AnalysisInput): AiFeedback {
  const text = input.transcript?.text?.trim() ?? "";
  const hasTranscript = text.length > 0;

  const fillers = hasTranscript ? countFillers(text) : null;
  const pace = hasTranscript
    ? paceMetrics(text, input.speakingMs)
    : { wordsSpoken: null, wordsPerMinute: null };

  const unavailable: string[] = [];

  // Audio-derived analysis genuinely does not exist. Pauses, vocal variety and
  // delivery confidence all need the waveform, which nothing reads yet.
  unavailable.push(
    "Pauses, vocal variety and delivery confidence need audio analysis, which is not built yet.",
  );

  if (!hasTranscript) {
    unavailable.push(
      "No transcript was captured, so nothing could be read or scored.",
    );
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      source: "mock",
      overallScore: null,
      summary: null,
      scores: null,
      topicCoverage: null,
      researchSynthesis: null,
      strongestMoment: null,
      biggestOpportunity: null,
      coachingNotes: [],
      strippedQuotes: 0,
      fillerWords: null,
      transcript: input.transcript,
      metrics: {
        speakingMs: input.speakingMs,
        researchMs: input.researchMs,
        wordsSpoken: null,
        wordsPerMinute: null,
        pauseCount: null,
      },
      unavailable,
    };
  }

  // --- Sample scores from surface features only. Not judgement. ---------------
  const seed = hash(text);
  const wpm = pace.wordsPerMinute ?? 140;
  const fillerRate =
    pace.wordsSpoken && fillers ? (fillers.total / pace.wordsSpoken) * 100 : 0;

  // Vocabulary spread: unique words over total. A rough proxy for whether the
  // speaker moved through ideas or circled one.
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  const spread = new Set(tokens).size / Math.max(1, tokens.length);

  /**
   * Substance first, or the ranking inverts.
   *
   * The earlier version scored on vocabulary spread and filler rate alone —
   * both of which are *perfect* when you say almost nothing. Measured against
   * the running server, the single word "a" scored 76 while a real 119-word
   * explanation scored 67. The highest score in the product went to freezing,
   * which is the exact opposite of what it is for.
   *
   * Saying enough to fill the minute is now the dominant term. It is still a
   * crude surface heuristic and still labelled a sample — but a sample that
   * ranks the right way round.
   */
  const words = pace.wordsSpoken ?? 0;
  const expected = Math.max(1, (input.speakingMs / 60_000) * 130);
  const substance = clamp((words / expected) * 62, 0, 62);

  const base = 8 + (seed % 6);
  const paceBonus = wpm >= 110 && wpm <= 180 ? 10 : 0;
  const fillerPenalty = Math.min(18, fillerRate * 2.5);
  // Spread only counts once there is enough said for it to mean anything.
  const spreadBonus = words >= 40 ? clamp(spread * 30, 0, 12) : 0;

  const overall = clamp(base + substance + paceBonus + spreadBonus - fillerPenalty);
  const jitter = (n: number) => clamp(overall + ((seed >> n) % 13) - 6);

  const scores: ScoreSet = {
    clarity: jitter(2),
    organization: jitter(5),
    depth: jitter(8),
    delivery: jitter(11),
    persuasiveness: jitter(14),
    engagement: jitter(17),
  };

  unavailable.push(
    "Strongest moment, biggest opportunity and coaching notes need a language model to read the transcript. No provider is connected.",
  );

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "mock",
    overallScore: overall,
    summary: null,
    scores,
    topicCoverage: null,
    researchSynthesis: null,
    // Deliberately null. These must quote the speaker; a mock cannot.
    strongestMoment: null,
    biggestOpportunity: null,
    coachingNotes: [],
    strippedQuotes: 0,
    fillerWords: fillers,
    transcript: input.transcript,
    metrics: {
      speakingMs: input.speakingMs,
      researchMs: input.researchMs,
      wordsSpoken: pace.wordsSpoken,
      wordsPerMinute: pace.wordsPerMinute,
      pauseCount: null,
    },
    unavailable,
  };
}
