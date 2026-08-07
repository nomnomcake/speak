# Speak — User Flow

## The session loop

```
PICK  ──►  SEARCH  ──►  RESEARCH  ──►  LOCKOUT  ──►  TRANSMIT  ──►  READOUT
                          15 min         15s          90s
                                                        │
                                     ┌──────────────────┤
                                     ▼                  ▼
                                  retake             next topic
```

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

### 4. LOCKOUT — 15s

**The notes and sources disappear.** A short pause to structure the answer
before speaking.

This phase is what keeps the product about synthesis. Fifteen minutes of
research is allowed precisely *because* the notes are taken away before the
user speaks — otherwise the session would measure reading aloud, which is not
the skill. If notes ever survive into TRANSMIT, the product has stopped
measuring anything.

### 5. TRANSMIT — 90s (varies by difficulty)

The user speaks. Live waveform, running timer, word count.

- No transcript while speaking — watching your own words appear destroys
  fluency
- No live scoring. Nothing that induces mid-sentence self-correction
- Stop early is allowed; silence past ~10s auto-stops

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
| `/session` | Speak | Not built — lockout → transmit |
| `/session/readout` | Readout | Not built |
| `/archive` | Archive | Not built |

`/research` accepts `?topic=<id>`. An unknown or missing id falls back to the
day's topic, so arriving from the tab bar is a valid way in.

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
