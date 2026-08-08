import "server-only";

/**
 * Provider seam for speaking analysis.
 *
 * `server-only` at the top is load-bearing: importing this from a client
 * component becomes a build error rather than a shipped API key. The UI talks
 * to `/api/analyze` and never to a model.
 *
 * Adding a real provider is meant to be a small, local change — implement one
 * function below, set two environment variables, and delete the mock. Nothing
 * in the UI, the data model or the persistence layer should need to move,
 * which is the entire reason this indirection exists.
 */

import type { AiFeedback, AnalysisInput, CoachingNote, GroundedClaim } from "./types";
import { mockAnalyze } from "./mock-provider";
import { clampScore, stripUngroundedQuotes } from "./verify";

/**
 * Ground a model response against the transcript before anyone sees it.
 *
 * Runs on every model result, not as a debugging aid. The prompt instructs the
 * evaluator never to invent quotes; this is what makes that instruction
 * enforceable rather than aspirational. A quote that is not in the transcript
 * is removed and counted, and the report tells the user it happened.
 *
 * Exported so a provider implementation cannot forget to call it — wire the
 * parsed JSON through here and the guarantees hold regardless of which model
 * is behind it.
 */
export function groundFeedback(
  draft: AiFeedback,
  transcript: string | null,
): AiFeedback {
  let stripped = 0;

  const ground = (claim: GroundedClaim | null): GroundedClaim | null => {
    if (!claim) return null;
    const r = stripUngroundedQuotes(claim.quote, transcript);
    if (r.stripped) stripped += 1;
    return { text: claim.text, quote: r.quote };
  };

  const notes: CoachingNote[] = draft.coachingNotes.map((n) => {
    const r = stripUngroundedQuotes(n.quote, transcript);
    if (r.stripped) stripped += 1;
    return { ...n, quote: r.quote };
  });

  const scores = draft.scores
    ? Object.fromEntries(
        Object.entries(draft.scores)
          .map(([k, v]) => [k, clampScore(v)])
          .filter(([, v]) => v !== null),
      )
    : null;

  return {
    ...draft,
    overallScore: clampScore(draft.overallScore),
    scores: scores as AiFeedback["scores"],
    strongestMoment: ground(draft.strongestMoment),
    biggestOpportunity: ground(draft.biggestOpportunity),
    coachingNotes: notes,
    strippedQuotes: stripped,
  };
}

export type ProviderName = "mock" | "anthropic";

/**
 * Defaults to mock so a fresh checkout runs with no configuration. It is a
 * deliberate default rather than a fallback: silently degrading a real
 * provider to mock output would be the worst possible failure here, so a
 * configured provider that fails throws instead.
 */
export function activeProvider(): ProviderName {
  const name = process.env.SPEAK_AI_PROVIDER?.trim().toLowerCase();
  return name === "anthropic" ? "anthropic" : "mock";
}

export async function analyzePresentation(
  input: AnalysisInput,
): Promise<AiFeedback> {
  switch (activeProvider()) {
    case "mock":
      return mockAnalyze(input);

    case "anthropic":
      /**
       * TO CONNECT A REAL PROVIDER
       *
       * 1. `npm install @anthropic-ai/sdk`
       * 2. Set `SPEAK_AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY=...` in
       *    `.env.local` — server-side only, never `NEXT_PUBLIC_`.
       * 3. Implement here:
       *
       *      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
       *      const res = await client.messages.create({
       *        model: "claude-sonnet-5",
       *        max_tokens: 2000,
       *        system: EVALUATOR_SYSTEM_PROMPT,
       *        messages: [{ role: "user", content: buildUserMessage(input) }],
       *      });
       *
       * 4. Parse the JSON, stamp `source: "model"`, then pass it through
       *    `groundFeedback(draft, input.transcript?.text ?? null)` — that is
       *    what strips invented quotes and clamps out-of-range scores. Do not
       *    skip it; the prompt's grounding rules are only enforceable here.
       * 5. Populate `strongestMoment`, `biggestOpportunity`, `coachingNotes`,
       *    `summary`, `topicCoverage` and `researchSynthesis`, which the mock
       *    deliberately leaves null, and drop the matching `unavailable` entry.
       */
      throw new Error(
        "SPEAK_AI_PROVIDER=anthropic is set but no provider is implemented. " +
          "See the instructions in src/lib/ai/provider.ts.",
      );
  }
}
