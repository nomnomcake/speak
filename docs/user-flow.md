# Speak — User Flow

## The session loop

One session is four phases, roughly three minutes end to end. Short enough that
failing is cheap and the user will go again.

```
SETUP  ──►  BRIEF  ──►  LOCKOUT  ──►  TRANSMIT  ──►  READOUT
                                                       │
                                    ┌──────────────────┤
                                    ▼                  ▼
                                 retake             next topic
```

### 1. SETUP — untimed

Pick a domain and a difficulty. Or press **Start** and take whatever comes —
the default path should require no decisions.

- Domain chips: Science · Economics · Philosophy · Technology · History
- Difficulty: Plain → Technical → Adversarial
- Shows what's coming: read time, speak time

### 2. BRIEF — 60s (varies by difficulty)

The source text appears. 200–400 words on something the user almost certainly
doesn't know. A countdown runs.

- Text is selectable but **not** copyable to anywhere useful
- No note-taking field. Notes would become a script, and reading a script is
  the exact thing this product refuses to measure
- User can end the phase early — that should feel rewarded, not punished

### 3. LOCKOUT — 15s

**The source disappears.** A short pause to structure the answer before
speaking. This phase is what makes the product about synthesis rather than
recall.

Visually the most important beat in the loop: the brief window shutting is the
moment the user realises they're on their own.

### 4. TRANSMIT — 90s

The user speaks. Live waveform, running timer, word count.

- No transcript shown while speaking — watching your own words appear destroys
  fluency
- No live scoring. Nothing that induces mid-sentence self-correction
- User can stop early; silence past ~10s auto-stops

### 5. READOUT — untimed

Scores, transcript, and one concrete thing to fix.

- Six rubric dimensions as meters (see [topic-schema.md](./topic-schema.md))
- Transcript with filler words marked
- **Exactly one** piece of advice. A list of six weaknesses is a list nobody
  acts on
- The key points from the source, with hits and misses marked — this is the
  moment of learning, where the user sees what they dropped
- Actions: **Retake** (same topic) · **Next** (new topic) · **Archive**

## Screens

| Route | Screen | Phase |
| --- | --- | --- |
| `/` | Lobby | SETUP |
| `/session` | Session | BRIEF → LOCKOUT → TRANSMIT |
| `/session/readout` | Readout | READOUT |
| `/archive` | Archive | — |
| `/archive/[id]` | Past session | — |

The three in-session phases are **one route with three states**, not three
routes. Navigation between them must be impossible — no back button, no URL
edit, no refresh escape. The lockout only means something if it can't be undone.

## State machine

```
idle ──start──► briefing ──timeout/skip──► lockout ──timeout──► transmitting
                                                                     │
                                              stop / timeout / silence
                                                                     ▼
                                                                  scoring
                                                                     │
                                                                     ▼
  idle ◄──next/retake──────────────────────────────────────────── readout
```

Rules:

- Transitions are **one-way**. There is no path back from `lockout` to
  `briefing`, in the UI or the state machine
- `scoring` is a real state with a visible spinner — it may take seconds
- Leaving mid-session abandons it. Confirm first, then discard; a half-session
  in the archive is noise

## Feel

- **Countdowns are calm.** Numbers in Geist Mono, meters draining. No red, no
  pulsing, no beeping. Anxiety makes people worse at this.
- **Phase changes are decisive.** A hard cut, not a fade. The user should never
  wonder which phase they're in.
- **The readout leads with what went right.** The user just did something
  uncomfortable. Open with the best dimension, then the one thing to fix.
