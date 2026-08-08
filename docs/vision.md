# Speak — Product Vision

## What it is

A speaking simulator. The user is handed a dense, unfamiliar idea, given a
short window to absorb it, then has to explain it out loud — clearly, from
memory, under time pressure. The product scores how well they did and hands
them a harder one.

It trains three things at once, in the order they actually happen:

1. **Learn** — absorb an unfamiliar idea fast
2. **Synthesise** — find the load-bearing structure and discard the rest
3. **Communicate** — say it out loud so someone else gets it

## Who it's for

People who have to explain complex things to other people on short notice:
founders, analysts, researchers, consultants, students preparing for vivas or
interviews. The shared pain is not stage fright — it is the gap between
*understanding* something and being able to *say* it in ninety seconds.

## The core insight

Most speaking tools train delivery: filler words, pace, eye contact. Those are
the easy half. The hard half is **compression** — deciding what to cut. A
person who has genuinely understood an idea can explain it in a minute; a
person who hasn't will either ramble or recite. Speak measures the difference.

This is why the source text disappears before the user speaks. Reading aloud is
not the skill. Reconstructing from a model in your head is.

### Why there is a camera as well as a microphone

The microphone is what the product measures with — the transcript and the
prosody metrics both come from it, and every scored dimension is derived from
what was said.

The camera is not a scoring input. **Nothing visual is judged**, and no rubric
dimension reads the video. It exists for two reasons:

1. **A lens is closer to a person than a mic is.** Explaining something into
   silence is a different act from explaining it to something that is looking
   back. The session should rehearse the harder one.
2. **The take is worth watching back.** The readout tells the speaker what to
   fix; the recording is the evidence for it, and the parts that are hardest to
   accept in writing are obvious on video.

If a visual scoring dimension is ever proposed, it contradicts the core insight
above — delivery is the easy half — and the burden is on the proposal.

## Non-goals

- **Not a teleprompter or script writer.** No suggested phrasing, ever. The
  moment we write the words for them, we are measuring our output, not theirs.
- **Not a public-speaking course.** No lessons, modules, or curriculum.
- **Not a recording studio.** Camera and microphone are means to a transcript,
  prosody metrics and a take the speaker can watch back; we are not shipping an
  editor.
- **Not a social product.** No feeds, no follower counts, no leaderboards
  against strangers. Competing against yesterday's own score is the loop.

## Design direction

The visual language is a **pixel-art operating system**: mint, paper white and
true black, hard edges, stepped corners. The entire product lives inside a fake
retro browser window sitting on a cloudy desktop.

This is a deliberate counterweight to the subject matter. Speaking under
pressure is stressful; a HUD full of red timers and neon warnings would make
that worse. A soft, toy-like interface lowers the stakes enough that the user
will actually press record and fail a few times, which is the only way the
product works.

See [ui-guidelines.md](./ui-guidelines.md) for the rules. **The reference image
is the source of truth for aesthetics and outranks any written description,
including this one.**

## Phases

| Phase | State | Contents |
| --- | --- | --- |
| 1. Design system | **Done** — tagged `v0.1.0-design-system` | Visual language, component library, browser shell. No functionality. |
| 2. Session shell | Next | The four screens of the loop, wired with mock data. Still no timers or scoring. |
| 3. Timers and state | | Real countdowns, phase transitions, session state machine. |
| 4. Capture | Partly built | Camera and microphone, live preview, level meter, transcript. |
| 5. Scoring | | Rubric evaluation of the transcript. |
| 6. Archive | | History, trend over time, replay. |

The rule across phases: **make it look finished before making it work.** A
cohesive shell exposes design problems early, when they are cheap.
