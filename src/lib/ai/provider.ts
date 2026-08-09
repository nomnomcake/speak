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
import { anthropicAnalyze } from "./anthropic-provider";
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
 *
 * An explicit `SPEAK_AI_PROVIDER` always wins. With it unset, the presence of
 * a key decides — which removes the only two ways to get this wrong, and they
 * were both easy:
 *
 *  - `anthropic` with no key: every analysis 502s. That is the correct
 *    behaviour for a misconfiguration and it is a miserable thing to walk
 *    into, and it is exactly what happened here once already.
 *  - a key pasted in while the provider is still `mock`: everything works, and
 *    quietly keeps serving sample scores. The report does say they are a
 *    sample, but nobody reads a label on a screen that appears to be working.
 *
 * So adding a key is now the whole procedure. Setting the variable explicitly
 * is still honoured, including setting it to `mock` with a key present, which
 * is how you keep a key on file without spending it.
 */
export function activeProvider(): ProviderName {
  const name = process.env.SPEAK_AI_PROVIDER?.trim().toLowerCase();
  if (name === "anthropic") return "anthropic";
  if (name === "mock") return "mock";
  return process.env.ANTHROPIC_API_KEY?.trim() ? "anthropic" : "mock";
}

export async function analyzePresentation(
  input: AnalysisInput,
): Promise<AiFeedback> {
  switch (activeProvider()) {
    case "mock":
      return mockAnalyze(input);

    case "anthropic": {
      /**
       * Grounding runs here rather than inside the provider so it cannot be
       * skipped by a future one. Whatever the model claims the speaker said is
       * checked against what they actually said before it can reach a screen.
       */
      const draft = await anthropicAnalyze(input);
      return groundFeedback(draft, input.transcript?.text ?? null);
    }
  }
}
