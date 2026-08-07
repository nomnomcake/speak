# Speak — Topic & Scoring Schema

Data shapes for topics, attempts and scores. The topic half is **implemented**
in `src/lib/topics/`; the attempt and scoring half is still a specification.

## Topic

A topic is a **seed, not a lesson**. It does not carry the text the user reads.
It carries a research prompt, the angles a good explanation could take, and
references. The brief itself is produced from these at session time.

Implemented in `src/lib/topics/types.ts`.

```ts
type Topic = {
  id: string;                     // kebab-case, unique across all files
  title: string;                  // never shown before the readout
  category: Category;             // science | economics | philosophy
                                  // | technology | history | psychology
                                  // | society
  difficulty: Difficulty;         // plain | technical | adversarial
  researchPrompt: string;         // the question the brief must answer
  suggestedAngles: string[];      // >= 2 distinct framings
  tags: string[];                 // lowercase keywords
  references: TopicReference[];   // >= 1
};

type TopicReference = {
  label: string;
  url: string;
  kind?: "article" | "paper" | "book" | "video" | "dataset";
};
```

Phase durations are **derived from difficulty**, not stored per topic:

| Difficulty | Read | Think | Speak |
| --- | --- | --- | --- |
| `plain` | 45s | 10s | 60s |
| `technical` | 60s | 15s | 90s |
| `adversarial` | 90s | 20s | 120s |

### Why `title` is hidden until the readout

A title is a summary. Handing the user "Why Bond Yields Move Inversely to
Price" gives away the synthesis we are asking them to perform. The landing
page's Today's Topic widget deliberately shows category, difficulty and
timings — never the title.

### Why references are objects

A bare URL string cannot gain a retrieval date, a paywall flag or an excerpt
without a migration. `{ label, url, kind }` can.

## Adding topics

To add a topic to an existing category, append to that JSON file in
`src/content/topics/`. Nothing else changes.

To add a category: add the value to `CATEGORIES` in `types.ts`, create the JSON
file, and add one line to `FILES` in `registry.ts`.

Every file is validated at module load. A malformed topic **fails the build**
with the file, index, topic id, field and allowed values — it never reaches the
UI as an empty panel.

### Authoring rules

1. **Genuinely unfamiliar.** If a typical user already knows it, the session
   measures recall rather than learning.
2. **Must contain a mechanism, not just facts.** "X causes Y because Z" is
   explainable; a list of dates is not.
3. **At least two distinct angles.** If you can only think of one framing, the
   topic is too thin to score structure against.
4. **No current events.** Topics should not expire.
5. **References must be stable.** Prefer encyclopaedic or archival sources over
   news articles.

## Attempt — not yet implemented

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
  accuracy: number;     // true to the sources? penalise confident errors
  structure: number;    // a shape, or a list of facts?
  coverage: number;     // did they take one of the suggestedAngles, or find
                        // a better one?
  concision: number;    // signal per word; padding costs
  independence: number; // explained, or recited?

  anglesTaken: string[];
  advice: string;       // exactly one. See user-flow.md
  strongest: string;    // dimension to open the readout with
};
```

### On `independence`

The dimension that makes the product mean something. A user who memorises three
sentences and recites them should score **worse** than one who paraphrases
imperfectly but clearly. Verbatim overlap with the brief is a penalty, not a
reward.

### On `accuracy`

A confident false statement is worse than an omission. Saying nothing about a
mechanism costs `coverage`; describing it backwards should also cost
`accuracy`.

## Storage

Phase 2–4: `localStorage`, keyed `speak:attempts`. No account, no server.

Add a backend only when there is a reason beyond "apps have backends" — sync
across devices, or shared topic packs. Recording audio to a server raises real
privacy questions and should not happen by default.
