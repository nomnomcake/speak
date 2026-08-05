# Speak — Topic & Scoring Schema

Data shapes for topics, attempts and scores. These are the contract between
content, the session loop and the scorer. Types live in `src/lib/types.ts` once
phase 2 begins.

## Topic

What the user is asked to learn and explain.

```ts
type Domain =
  | "science" | "economics" | "philosophy" | "technology" | "history";

type Difficulty = "plain" | "technical" | "adversarial";

type Topic = {
  id: string;
  title: string;              // shown only in the readout, never in the brief
  domain: Domain;
  difficulty: Difficulty;

  /** 200-400 words. Markdown, rendered read-only. */
  source: string;

  /**
   * The load-bearing ideas. Scoring checks how many the user hit.
   * 3-6 per topic. If you can't name at least three, the topic is too thin.
   */
  keyPoints: KeyPoint[];

  /** Terms a good explanation would define rather than assume. */
  glossary?: { term: string; definition: string }[];

  /** Phase durations in seconds. Omitted values fall back to the difficulty. */
  readSeconds?: number;
  speakSeconds?: number;
};

type KeyPoint = {
  id: string;
  /** One sentence, in plain language. */
  claim: string;
  /**
   * Load-bearing points cost more when missed. A topic should have
   * 1-2 `core` points; the rest are `supporting`.
   */
  weight: "core" | "supporting";
};
```

### Why `title` is hidden during the brief

A title is a summary. Handing the user "Why Bond Yields Move Inversely to
Price" gives away the synthesis we are asking them to perform. They see the
title only in the readout.

## Attempt

One run at one topic.

```ts
type Attempt = {
  id: string;
  topicId: string;
  startedAt: string;          // ISO 8601, absolute
  completedAt: string | null; // null = abandoned

  transcript: string;
  audioMs: number;

  metrics: Metrics;           // measured locally, deterministic
  scores: Scores | null;      // model-judged; null until scoring returns
};
```

## Metrics — measured, not judged

Computed locally from transcript and timing. Deterministic, instant, free. No
model involved.

```ts
type Metrics = {
  wordCount: number;
  wordsPerMinute: number;
  fillerCount: number;        // um, uh, like, you know, sort of, basically
  fillerRate: number;         // per 100 words
  longestPauseMs: number;
  speakingMs: number;         // total minus silence
};
```

Healthy ranges, for meter framing rather than pass/fail:

| Metric | Low | Good | High |
| --- | --- | --- | --- |
| Words per minute | < 110 | 130–170 | > 190 |
| Filler rate | — | < 3 | > 6 |
| Longest pause | — | < 2000ms | > 4000ms |

## Scores — judged

Six dimensions, each `0..1`. These need a model; a word-frequency heuristic
cannot tell insight from fluent nonsense.

```ts
type Scores = {
  clarity: number;      // would a smart non-expert follow this?
  accuracy: number;     // is it true to the source? penalise confident errors
  structure: number;    // is there a shape, or is it a list of facts?
  coverage: number;     // weighted fraction of keyPoints hit
  concision: number;    // signal per word; padding costs
  independence: number; // explained, or recited? near-verbatim source scores low

  keyPointsHit: string[];    // KeyPoint ids
  keyPointsMissed: string[];

  /** Exactly one. See user-flow.md — a list of six is a list nobody acts on. */
  advice: string;

  /** The dimension to open the readout with. */
  strongest: keyof Omit<Scores, "keyPointsHit" | "keyPointsMissed" | "advice" | "strongest">;
};
```

### On `independence`

The dimension that makes the product mean something. A user who memorises three
sentences and recites them should score **worse** than one who paraphrases
imperfectly but clearly. Verbatim overlap with the source is a penalty, not a
reward.

### On `accuracy`

A confident false statement is worse than an omission. Someone who says nothing
about a mechanism scores low on `coverage`; someone who describes it backwards
should be penalised on `accuracy` too.

## Content authoring rules

1. **Source must be genuinely unfamiliar.** If a typical user already knows it,
   the session measures recall, not learning.
2. **Self-contained.** No prerequisites beyond general literacy.
3. **200–400 words.** Below 200 there is nothing to compress; above 400 the read
   phase becomes a speed-reading test.
4. **Must contain a mechanism, not just facts.** "X causes Y because Z" is
   explainable. A list of dates is not.
5. **No current events.** Topics should not expire.
6. **Key points written before the source is finalised.** If you can't state
   three load-bearing claims, the source needs rewriting.

## Storage

Phase 2–4: `localStorage`, keyed `speak:attempts`. No account, no server.

Add a backend only when there is a reason beyond "apps have backends" — sync
across devices, or shared topic packs. Recording audio to a server raises real
privacy questions and should not happen by default.
