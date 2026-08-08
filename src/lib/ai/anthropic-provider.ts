import "server-only";

/**
 * Anthropic-backed speaking evaluator.
 *
 * Server-side only. The key is read from the process environment and never
 * reaches a bundle; `server-only` makes importing this from a client component
 * a build error rather than a leaked credential.
 *
 * Everything the model returns is treated as untrusted structured data:
 * parsed, shape-checked, clamped, and then grounded against the transcript by
 * the caller. A model is perfectly capable of returning a 0-10 score, four
 * coaching notes instead of three, or a quotation the speaker never uttered,
 * and each of those renders as a broken or dishonest report if taken at face
 * value.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AiFeedback,
  AnalysisInput,
  CoachingNote,
  GroundedClaim,
  ScoreSet,
} from "./types";
import { EVALUATOR_SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { countFillers, paceMetrics } from "./filler";
import { clampScore } from "./verify";

const MODEL = process.env.SPEAK_AI_MODEL?.trim() || "claude-sonnet-5";
const MAX_TOKENS = 2000;

/** Pull the JSON object out of a reply that may be fenced or prefaced. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in model reply");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function claim(v: unknown): GroundedClaim | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const text = str(o.text);
  if (!text) return null;
  return { text, quote: str(o.quote) };
}

function notes(v: unknown): CoachingNote[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((raw) => {
      if (typeof raw !== "object" || raw === null) return null;
      const o = raw as Record<string, unknown>;
      const headline = str(o.headline);
      const whatHappened = str(o.whatHappened);
      const whatToDoNext = str(o.whatToDoNext);
      if (!headline || !whatHappened || !whatToDoNext) return null;
      return {
        headline,
        whatHappened,
        whyItMatters: str(o.whyItMatters) ?? "",
        whatToDoNext,
        quote: str(o.quote),
      };
    })
    .filter((n): n is CoachingNote => n !== null)
    // The prompt asks for three. Trimming rather than trusting keeps the
    // "one thing to act on" discipline from eroding into a checklist.
    .slice(0, 3);
}

function scoreSet(v: unknown): Partial<ScoreSet> | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const out: Partial<ScoreSet> = {};
  for (const key of [
    "clarity",
    "organization",
    "depth",
    "delivery",
    "persuasiveness",
    "engagement",
  ] as const) {
    const n = clampScore(o[key]);
    if (n !== null) out[key] = n;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function scored(v: unknown): { score: number; explanation: string } | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const score = clampScore(o.score);
  const explanation = str(o.explanation);
  if (score === null || !explanation) return null;
  return { score, explanation };
}

export async function anthropicAnalyze(
  input: AnalysisInput,
): Promise<AiFeedback> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (server-side only).",
    );
  }

  const text = input.transcript?.text?.trim() ?? "";

  // Local arithmetic runs regardless of the model, and is not something the
  // model is asked to compute — counting is not a judgement call.
  const fillers = text ? countFillers(text) : null;
  const pace = text
    ? paceMetrics(text, input.speakingMs)
    : { wordsSpoken: null, wordsPerMinute: null };

  const unavailable = [
    "Pauses, vocal variety and delivery confidence need audio analysis, which is not built yet.",
  ];

  // Nothing to read means nothing to judge. Skip the call rather than pay for
  // a model to invent a report about silence.
  if (!text) {
    unavailable.push(
      "No transcript was captured, so nothing could be read or scored.",
    );
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      source: "model",
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
        wordsSpoken: null,
        wordsPerMinute: null,
        pauseCount: null,
      },
      unavailable,
    };
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: EVALUATOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  const reply = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  const raw = extractJson(reply) as Record<string, unknown>;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "model",
    overallScore: clampScore(raw.overallScore),
    summary: str(raw.summary),
    scores: scoreSet(raw.scores),
    topicCoverage: scored(raw.topicCoverage),
    researchSynthesis: scored(raw.researchSynthesis),
    strongestMoment: claim(raw.strongestMoment),
    biggestOpportunity: claim(raw.biggestOpportunity),
    coachingNotes: notes(raw.coachingNotes),
    // Set by `groundFeedback` in provider.ts, which runs next.
    strippedQuotes: 0,
    fillerWords: fillers,
    transcript: input.transcript,
    metrics: {
      speakingMs: input.speakingMs,
      wordsSpoken: pace.wordsSpoken,
      wordsPerMinute: pace.wordsPerMinute,
      pauseCount: null,
    },
    unavailable,
  };
}
