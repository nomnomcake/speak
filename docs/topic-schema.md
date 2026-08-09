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
  searchTerms: string[];          // >= 2. what the toolbox searches for
  references: TopicReference[];   // >= 1
};

type TopicReference = {
  label: string;
  url: string;
  kind?: "article" | "paper" | "book" | "video" | "dataset";
};
```

Phase durations are **derived from difficulty**, not stored per topic. Only the
lockout varies — research is a flat 15 minutes and every talk is one minute,
whatever the topic:

| Difficulty | Research | Lockout | Speak |
| --- | --- | --- | --- |
| `plain` | 15m | 10s | 60s |
| `technical` | 15m | 15s | 60s |
| `adversarial` | 15m | 20s | 60s |

Scaling talk length with difficulty was backwards: a harder idea does not
deserve more airtime, it demands harder compression. A fixed minute also makes
sessions comparable to each other, which scoring will need. `readSeconds` is
gone with the 60-second brief the 15-minute research window replaced.

### Difficulty is not shown as a difficulty

The UI stamps a **class mark** — `Class I` · `Class II` · `Class III` — not the
enum value. `DIFFICULTY: ADVERSARIAL` was the card describing how hard it
thinks it is, which is the one judgement that belongs to the reader, and
"adversarial" is authoring vocabulary leaking onto the object. An archive
stamps a filing tier, not an opinion.

The mapping lives in `CLASS_MARK` in `lib/topics/types.ts` and is keyed off the
`Difficulty` union, so a new tier is a compile error rather than a blank stamp.
The enum keeps its names — they are good words for authors, just not for users.

**Every screen that shows the tier goes through `CLASS_MARK`.** All three do
now — catalogue card, search screen and the landing widget, which was missed
the first time and left the product's opening screen contradicting the two
after it. Rendering `topic.difficulty` into the UI is the bug.

### Why `title` is hidden until the readout

A title is a summary. Handing the user "Why Bond Yields Move Inversely to
Price" gives away the synthesis we are asking them to perform. The landing
page's Today's Topic widget deliberately shows category, class mark and
timings — never the title.

### Why `searchTerms` is authored, not derived

The research toolbox searches these. It cannot search the title, because most
titles here **are** the question — "Why bond prices and yields move in opposite
directions" states the very relationship the user is meant to arrive at, so
putting it in a search box hands over the finding before they have read
anything. Same rule as hiding the title: a summary given away is a synthesis
not performed.

It cannot fall back to `tags` either. Tags are thematic and deliberately broad,
so they lose the subject:

| Topic | Tags | Searching the tags finds |
| --- | --- | --- |
| The Broad Street pump | `epidemiology, evidence, public-health, method` | neither cholera nor John Snow |
| Antibiotic resistance | `evolution, microbiology, selection, medicine` | evolutionary medicine in general |
| How a moral panic forms | `media, deviance, collective-behaviour, sociology` | sociology in general |

So they are written per topic, naming the **subject** and stopping. Where a
title is already a term of art rather than a claim — "Comparative advantage",
"The CAP theorem" — repeating it is correct: it identifies the thing without
saying what is true about it.

Two rules are enforced at load, so this cannot rot back:

- no term may open with an interrogative (`why`, `how`, `what`, `is`, …)
- no term may run past six words — past that it has stopped naming and started
  claiming

`researchQuery()` takes the first two; `primarySearchTerm()` takes one, for
Wikipedia, which resolves an article rather than ranking results.

### Why references are objects

A bare URL string cannot gain a retrieval date, a paywall flag or an excerpt
without a migration. `{ label, url, kind }` can.

**Currently authored but not rendered.** They were the dossier's "Places to
possibly start with", then briefly an "Already filed" list inside the toolbox;
both are gone. The field is kept, and still validated at `>= 1`, for two
reasons: these are hand-checked sources — several papers resolved by DOI — and
regenerating them means inventing citations, which is the one thing
`studySearchUrl` existed to avoid. And `scores.accuracy` judges whether a talk
was *true to the sources*, which needs sources.

If a future change decides the research screen should stay search-only forever,
delete the field deliberately in its own commit rather than letting it rot as
data nothing reads.

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
5. **`searchTerms` must not answer the question.** Write what you would type to
   *find out*, not what you would type having already understood. If the terms
   read as the title rephrased, the topic ships with its own answer attached.
6. **References must be stable.** Prefer encyclopaedic or archival sources over
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
  recordedMs: number;         // the take, audio and video together
  metrics: Metrics;           // measured locally, deterministic
  scores: Scores | null;      // model-judged; null until scoring returns
};
```

Was `audioMs`, when capture was microphone-only. The session records **camera
and microphone**, so one duration covers the take.

Nothing visual is scored, and no field here holds video-derived data — the
recording exists for the speaker to watch back, not for the rubric. See
[vision.md](./vision.md#why-there-is-a-camera-as-well-as-a-microphone).

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
across devices, or shared topic packs.

Uploading a take raises real privacy questions and must not happen by default.
That was true when capture was audio only; it is more true now that every
attempt is **video of someone's face in their home**. If recordings ever leave
the device it should be an explicit, revocable, per-attempt choice, and the
default has to remain that they never do.
