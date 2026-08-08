# Speak — User Flow

## The session loop

```
PICK  ──►  SEARCH  ──►  RESEARCH  ──►  LOCKOUT  ──►  TRANSMIT  ──►  READOUT
                          15 min       10/15/20s        60s
                                                        │
                                     ┌──────────────────┤
                                     ▼                  ▼
                                  retake             next topic
```

Research is a flat 15 minutes and every talk is one minute, whatever the
topic. Only the lockout varies with difficulty — see
[topic-schema.md](./topic-schema.md).

### 1. PICK — untimed · `/play`

A retro desktop of category folders. One click selects, a second opens.
Opening a folder starts the search immediately.

### 2. SEARCH — ~6s · `/play`

The machine reads through the folder: folders opening, a scanline, a log of
filenames, a card cycling and decelerating onto one. Deliberately a *search*
rather than a spin — see `TopicRandomizer`.

Files are sealed until this point: the user sees filenames, categories and
durations, never titles. **Selection is what unseals a topic**, not the
readout.

### 3. RESEARCH — 15 min · `/research?topic=<id>`

A desktop application window: the topic and its research prompt, a notepad, a
countdown timer widget, suggested angles, and links to sources.

The user researches the idea themselves. Notes and timer persist to
localStorage, so closing the tab does not cost the session, and a timer left
running is charged the time that passed rather than pausing itself.

### 4. LOCKOUT — 10/15/20s by difficulty · `/session`

**The notes and sources disappear.** A short pause to structure the answer
before speaking.

This phase is what keeps the product about synthesis. Fifteen minutes of
research is allowed precisely *because* the notes are taken away before the
user speaks — otherwise the session would measure reading aloud, which is not
the skill. If notes ever survive into TRANSMIT, the product has stopped
measuring anything.

The notes are gone here because the **route** changed, not because a panel
closed over them. There is nothing on this screen to dismiss.

It is dressed as **presentation mode**: a modal dialog, a segmented bar filling
through named steps, then a 3·2·1 count-in. Written as software changing mode
rather than as a cinematic — the dialog never moves or resizes between stages,
it just keeps changing its mind, which is what an installer does and what a
title sequence never does. Anxiety makes people worse at this; a dramatic
transition would be working against the product.

The bar is gated on real work. "Starting camera" waits for `getUserMedia` to
actually resolve, because a scripted bar that finishes while the permission
prompt is still open is a lie the user watches being told. If the prompt goes
unanswered the step says so, and gives up rather than hanging.

### 5. TRANSMIT — 60s · `/session`

The user speaks to camera. Live self-view, microphone level, running timer.

**Both are captured: camera and microphone.** The microphone is what the
product measures with — transcript and prosody both come from it. The camera is
never scored; it is there because a lens is closer to a person than a mic is,
and because the take is worth watching back. See
[vision.md](./vision.md#why-there-is-a-camera-as-well-as-a-microphone).

The two are requested together in one `getUserMedia` call, so declining either
declines both. That is deliberate — a session with no audio has nothing to
score, so proceeding video-only would produce an attempt that cannot be marked.

- No transcript while speaking — watching your own words appear destroys
  fluency
- No live scoring. Nothing that induces mid-sentence self-correction
- The self-view is mirrored. An unmirrored one makes people correct their
  posture the wrong way
- Stop early is allowed; silence past ~10s auto-stops

#### The five-second buffer

The clock runs to 60s, then recording continues for **five more seconds** while
the readout says *finish your sentence*.

Cutting at exactly 60 guillotines whoever is mid-sentence, and the last
sentence is usually the one carrying the conclusion — the part of the talk most
worth scoring. The minute is the constraint; the hard stop was only how that
constraint happened to be implemented.

Five, and not more. Long enough to land a sentence, short enough that it does
not quietly become a sixty-five second talk — which would undo the compression
the product exists to force. The `Live` badge stays lit throughout, because it
is still recording; only the label changes.

### 5b. ANALYSIS — a few seconds · `/session`

The talk is transcribed live while it happens, silently, via the Web Speech
API. When it ends the transcript — never the recording — is posted to
`/api/analyze`, and a small window shows the steps that are actually running.

The loading messages name only work that happens. An earlier draft listed
"Evaluating your argument", which nothing did; a progress bar lying about its
own contents is the same failure the search screen already had once.

### 6. READOUT — untimed

Scores, transcript, and one concrete thing to fix.

- Rubric dimensions as meters (see [topic-schema.md](./topic-schema.md))
- Transcript with filler words marked
- **Exactly one** piece of advice. A list of six weaknesses is a list nobody
  acts on
- Which of the suggested angles they took, or whether they found a better one
- Actions: **Retake** · **Next** · **Archive**

## Screens

| Route | Screen | State |
| --- | --- | --- |
| `/` | Landing | Today's topic, streak, totals |
| `/play` | Desktop | **Built** — folders, search, reveal |
| `/research` | Research window | **Built** — notes, timer, resources |
| `/session` | Speak | **Partly built** — presentation mode, then live camera and mic. No capture to disk, no auto-stop |
| `/session/readout` | Readout | Not a route — the Speaking Report renders in-place at the end of `/session`, since the take only exists in memory and a navigation would lose it |
| `/dashboard` | Dashboard | **Built on mock data** — streak, collection, categories, recent, achievements |
| `/archive` | Archive | Not built |

`/research` accepts `?topic=<id>`. An unknown or missing id falls back to the
day's topic, so arriving from the tab bar is a valid way in.

`/dashboard` is progress; `/archive` will be history. They are separate on
purpose: the dashboard answers "how am I doing", which is a handful of derived
figures, and the archive answers "what did I say that time", which is a list of
takes to replay. Merging them produces a page that is a weak version of both.

Every figure on the dashboard derives from one list of completed topic ids
(`lib/progress.ts`), so the collection percentage, the per-category bars and the
favourite category cannot contradict each other. When persistence lands, only
the source list changes.

The lockout and transmit phases are **one route with two states**, not two
routes. Navigation between them must be impossible — no back button, no URL
edit, no refresh escape. A lockout that can be undone is not a lockout.

## State machine

```
idle ──open folder──► searching ──lands──► researching
                                               │
                                          ready to speak
                                               ▼
                                            lockout ──15s──► transmitting
                                                                  │
                                            stop / timeout / silence
                                                                  ▼
  idle ◄──next/retake─────────── readout ◄──scored── scoring
```

Rules:

Enforcement of the one-way rule lives in `useOneWay`, applied from the
presentation dialog through analysis. It holds a sentinel history entry so Back
cannot leave, and prompts on reload or tab close. It does **not** block a typed
URL — nothing client-side can, and building something that looked like it did
would be worse than saying so here.

- Transitions from `lockout` onward are **one-way**. There is no path back to
  `researching`, in the UI or the state machine
- `scoring` is a real state with a visible spinner — it may take seconds
- Leaving mid-session abandons it. Confirm first, then discard; a half-session
  in the archive is noise

## Feel

- **Countdowns are calm.** Geist Mono numerals, meters draining. No red, no
  pulsing, no beeping. Anxiety makes people worse at this.
- **Phase changes are decisive.** A hard cut, not a fade. The user should never
  wonder which phase they are in.
- **The readout leads with what went right.** The user just did something
  uncomfortable. Open with the best dimension, then the one thing to fix.
