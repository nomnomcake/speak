"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Panel, ProgressBar } from "@/components/ui";
import { CameraStage } from "./CameraStage";
import { ReviewEmpty, ReviewWindow } from "./ReviewWindow";
import { AnalyzingWindow } from "./AnalyzingWindow";
import { SpeakingReport } from "./SpeakingReport";
import { newAttemptId, saveAttempt, updateAttempt } from "@/lib/attempts";
import { useTranscriber } from "@/lib/useTranscriber";
import { useOneWay } from "@/lib/useOneWay";
import { readResearchMs } from "@/lib/researchTime";
import type { AiFeedback, TranscriptDoc } from "@/lib/ai/types";
import { TIMINGS } from "@/lib/topics";
import type { Topic } from "@/lib/topics";

/**
 * A report with nothing in it, used when the analysis request fails.
 *
 * Deliberately not an error screen. The user has just spoken for a minute;
 * telling them the network is down and showing them nothing is the worst
 * possible payoff. They still get their recording, their timings, and a plain
 * statement of what could not be worked out.
 */
function emptyFeedback(
  speakingMs: number,
  transcript: TranscriptDoc | null,
  reasons: string[],
): AiFeedback {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "mock",
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
    transcript,
    metrics: {
      speakingMs,
      researchMs: null,
      wordsSpoken: null,
      wordsPerMinute: null,
      pauseCount: null,
    },
    unavailable: reasons,
  };
}

/**
 * PresentationMode — the switch from researching to speaking.
 *
 * Written as software changing mode rather than as a cinematic. No fade to
 * black, no swelling anything: a modal appears, a bar fills through named
 * steps, it counts you in, and the camera is there. The dialog never moves or
 * resizes between stages — the same window keeps changing its mind, which is
 * exactly what an installer does and what a title sequence never does.
 *
 * This is also the LOCKOUT phase from user-flow.md. The notes and sources are
 * gone because the route changed, not because a panel closed over them, and
 * the steps say so out loud.
 */

type Stage =
  | "preparing"
  | "ready"
  | "lockout"
  | "countdown"
  | "live"
  | "blocked"
  | "analyzing"
  | "report"
  | "discarded";

/**
 * The bar reports real work, which is why "Starting camera" is gated.
 *
 * A scripted bar that finishes while the camera permission prompt is still
 * open would be a lie the user watches being told. Holding there is the honest
 * version and, conveniently, the nostalgic one — old software paused on the
 * step that was actually slow.
 */
type Step = {
  label: string;
  value: number;
  /** Cannot be passed until the camera has actually resolved or failed. */
  gated?: boolean;
};

const STEPS: Step[] = [
  { label: "Closing notes", value: 0.16 },
  { label: "Locking sources", value: 0.38 },
  { label: "Starting camera and mic", value: 0.7, gated: true },
  { label: "Camera ready", value: 1 },
];

const STEP_MS = 520;
const READY_HOLD_MS = 750;
const TICK_MS = 700;

export function PresentationMode({ topic }: { topic: Topic }) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [denied, setDenied] = React.useState<string | null>(null);
  const [step, setStep] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>("preparing");
  const [count, setCount] = React.useState(3);
  // Seconds left in the lockout. Derived from difficulty rather than stored on
  // the topic — the only phase duration that still varies, since research is a
  // flat 15 minutes and every talk is one minute.
  const lockoutSeconds = TIMINGS[topic.difficulty].lockoutSeconds;
  const [left, setLeft] = React.useState(lockoutSeconds);

  /**
   * Bumped by "Try again" on the blocked screen to re-run acquisition.
   *
   * The usual cause of a block is a permission the user can grant from the
   * address bar without leaving the page, so the fix is normally already done
   * by the time they press the button — but the effect below only ran once,
   * which is what made that screen terminal.
   */
  const [tries, setTries] = React.useState(0);
  // Declared here rather than beside its own effect below, so `retry` can
  // clear it — the lint rule that catches use-before-declaration is right that
  // reading it from above would not track changes.
  const [slow, setSlow] = React.useState(false);
  const retry = React.useCallback(() => {
    setDenied(null);
    setSlow(false);
    setStep(0);
    setStage("preparing");
    setTries((n) => n + 1);
  }, []);

  // Acquire the camera immediately, in parallel with the first two steps, so
  // the gate is usually already satisfied by the time the bar reaches it.
  React.useEffect(() => {
    let cancelled = false;
    let acquired: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        acquired = s;
        setStream(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setDenied(e instanceof Error ? e.name : "Error");
        }
      });

    return () => {
      cancelled = true;
      acquired?.getTracks().forEach((t) => t.stop());
    };
  }, [tries]);

  // Release the camera when this leaves the screen. A preview that keeps the
  // indicator light on after the session ends is the kind of thing people
  // uninstall software over.
  React.useEffect(() => {
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  // A gated step that waits on a permission dialog can wait forever, and a bar
  // stopped at 70% with no explanation is indistinguishable from a hang. After
  // a beat the step says what it is waiting for; after a long one it gives up
  // rather than sitting there looking broken.
  React.useEffect(() => {
    if (stream || denied) return;
    const hint = setTimeout(() => setSlow(true), 2500);
    const giveUp = setTimeout(() => setDenied("Timeout"), 45_000);
    return () => {
      clearTimeout(hint);
      clearTimeout(giveUp);
    };
  }, [stream, denied]);

  React.useEffect(() => {
    if (stage !== "preparing") return;

    const current = STEPS[step];
    const settled = stream !== null || denied !== null;
    if (current.gated && !settled) return; // hold here, bar included

    const last = step >= STEPS.length - 1;
    const id = setTimeout(
      () => {
        if (last) setStage(denied ? "blocked" : "ready");
        else setStep((s) => s + 1);
      },
      last ? READY_HOLD_MS : STEP_MS,
    );
    return () => clearTimeout(id);
  }, [stage, step, stream, denied]);

  React.useEffect(() => {
    if (stage === "ready") {
      const id = setTimeout(() => setStage("lockout"), READY_HOLD_MS);
      return () => clearTimeout(id);
    }
    /**
     * The lockout proper — the phase user-flow.md calls load-bearing.
     *
     * It was documented at 10/15/20s by difficulty and displayed on the
     * landing page as THINK, and then not implemented: the whole approach to
     * the talk was the ~2s of progress bar above, identical for every topic.
     * `lockoutSeconds` was derived, rendered on the first screen of the
     * product, and read by nothing.
     *
     * Fifteen minutes of research is allowed *because* this exists. Without a
     * real pause between closing the notes and starting to speak, the session
     * runs straight from reading to reciting, which is the one thing the
     * product is built not to measure.
     */
    if (stage === "lockout") {
      const id = setTimeout(() => {
        if (left <= 1) setStage("countdown");
        else setLeft((s) => s - 1);
      }, 1000);
      return () => clearTimeout(id);
    }
    if (stage === "countdown") {
      const id = setTimeout(() => {
        if (count <= 1) setStage("live");
        else setCount((c) => c - 1);
      }, TICK_MS);
      return () => clearTimeout(id);
    }
  }, [stage, count, left]);

  const router = useRouter();
  const [recording, setRecording] = React.useState<Blob | null>(null);
  const [feedback, setFeedback] = React.useState<AiFeedback | null>(null);
  const [speakingMs, setSpeakingMs] = React.useState<number | null>(null);
  const [saveFailed, setSaveFailed] = React.useState(false);
  const attemptIdRef = React.useRef<string | null>(null);

  // Runs only while the talk is live. Captured silently — user-flow.md is
  // explicit that watching your own words appear destroys fluency.
  const transcript = useTranscriber(stage === "live");

  /**
   * One-way from the moment the notes disappear until the report exists.
   *
   * Held through `analyzing` as well as the talk: backing out mid-analysis
   * would lose a take that has already been given, which is the same loss the
   * lockout exists to prevent. Released at the report, where leaving is the
   * expected thing to do.
   */
  useOneWay(
    stage === "preparing" ||
      stage === "ready" ||
      stage === "lockout" ||
      stage === "countdown" ||
      stage === "live" ||
      stage === "analyzing",
  );

  // Stamped when the talk actually starts, not when the route loaded — the
  // preparing dialog and the count-in are not part of the take.
  const startedAtRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (stage === "live" && startedAtRef.current === null) {
      startedAtRef.current = new Date().toISOString();
    }
  }, [stage]);

  const handleStop = React.useCallback(
    (take: Blob | null) => {
      setRecording(take);
      setStage("analyzing");
      // The camera light goes out the moment the talk ends. Leaving it on
      // through the review screen would be the app watching someone watch
      // themselves.
      stream?.getTracks().forEach((t) => t.stop());

      /**
       * The session is recorded even when the take is not.
       *
       * A failed recorder does not undo the fact that someone stood up and
       * explained something for a minute, and deleting the video later does
       * not either — which is why this is written here rather than on the
       * review screen. Only the fact is stored; the recording never leaves
       * memory.
       */
      const startedAt = startedAtRef.current ?? new Date().toISOString();
      const completedAt = new Date().toISOString();
      const speakingMs = Math.max(
        0,
        Date.parse(completedAt) - Date.parse(startedAt),
      );
      const id = newAttemptId();
      setSpeakingMs(speakingMs);
      const saved = saveAttempt({
        id,
        topicId: topic.id,
        startedAt,
        completedAt,
        recordedMs: speakingMs,
        aiFeedback: null,
      });

      // Only remember the id if it actually reached disk. Holding it after a
      // failed write meant `updateAttempt` later matched nothing and rewrote
      // an unchanged list, so a full report rendered for a session that was
      // never saved — with nothing on screen admitting it.
      attemptIdRef.current = saved ? id : null;
      setSaveFailed(!saved);
    },
    [stream, topic.id],
  );

  /**
   * Deleting the video deletes the video. Nothing else.
   *
   * It used to drop the whole screen into `discarded`, so someone embarrassed
   * by their own footage silently lost their scores, filler counts, pace and
   * transcript too. The recording and the analysis are separate things —
   * the video never leaves the device, the transcript is what gets read — and
   * one state was doing both jobs.
   */
  const handleDelete = React.useCallback(() => {
    setRecording(null);
  }, []);

  /**
   * Ask the server for a report once the talk is over.
   *
   * The transcript goes; the recording does not. Video of someone's face in
   * their home stays on the device, and an analysis endpoint is not a reason
   * to change that.
   *
   * A failed request still produces a report — an empty one that says why it
   * is empty. Dropping the user on an error screen after they have just
   * spoken for a minute is the worst moment in the flow to have nothing.
   */
  React.useEffect(() => {
    if (stage !== "analyzing" || speakingMs === null) return;
    let cancelled = false;

    /**
     * A model call has no natural end. Without a deadline the spinner is the
     * final state of the product for anyone whose request stalls — they have
     * just spoken for a minute and the screen never resolves, which is worse
     * than a report that says it could not score them.
     *
     * Ninety seconds is well past a slow-but-working call and well short of
     * waiting for something that is not coming.
     */
    const abort = new AbortController();
    const deadline = setTimeout(() => abort.abort(), 90_000);

    void (async () => {
      let result: AiFeedback;
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          signal: abort.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: topic.id,
            transcript: transcript.result,
            speakingMs,
            // Recovered from the research timer's own saved state rather than
            // measured again. Null if they never started it.
            researchMs: readResearchMs(topic.id),
            recordingComplete: recording !== null,
          }),
        });
        if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
        result = (await res.json()) as AiFeedback;
      } catch (err) {
        // Distinguished because they call for different things from the user:
        // a timeout is worth retrying, an unreachable service usually is not.
        const timedOut = err instanceof Error && err.name === "AbortError";
        result = emptyFeedback(speakingMs, transcript.result, [
          timedOut
            ? "Scoring took longer than 90 seconds and was given up on, so nothing was scored. Your take is still here."
            : "The analysis service could not be reached, so nothing was scored.",
        ]);
      } finally {
        clearTimeout(deadline);
      }

      if (cancelled) return;

      // Say so on the report itself. A user who is about to close the tab
      // deserves to know the session is not in their history.
      const withSaveState = saveFailed
        ? {
            ...result,
            unavailable: [
              ...result.unavailable,
              "This session could not be saved to your browser storage, so it will not appear in your history. Private browsing or a full disk quota are the usual causes.",
            ],
          }
        : result;

      setFeedback(withSaveState);
      if (attemptIdRef.current) {
        updateAttempt(attemptIdRef.current, { aiFeedback: withSaveState });
      }
      setStage("report");
    })();

    return () => {
      cancelled = true;
      clearTimeout(deadline);
      abort.abort();
    };
  }, [stage, speakingMs, topic.id, transcript.result, recording, saveFailed]);

  const waiting = Boolean(STEPS[step].gated) && stream === null && denied === null;
  const stepLabel =
    waiting && slow ? "Waiting for permission" : STEPS[step].label;

  if (stage === "live" && stream) {
    return <CameraStage stream={stream} topic={topic} onStop={handleStop} />;
  }

  if (stage === "analyzing") {
    return <AnalyzingWindow />;
  }

  if (stage === "report" && feedback) {
    return (
      <SpeakingReport
        feedback={feedback}
        /**
         * Goes to the dashboard. It used to drop the whole screen into
         * `discarded`, which wiped the scores, metrics, transcript and player
         * and replaced them with "Take deleted. It is gone from this device."
         * — a destructor wearing the label of the affirmative action, and a
         * false message besides, since the session had already been saved at
         * the moment the talk ended.
         */
        onFinish={() => router.push("/dashboard")}
      >
        {recording ? (
          <ReviewWindow
            recording={recording}
            topic={topic}
            onDelete={handleDelete}
          />
        ) : (
          <ReviewEmpty reason="No recording to play back — the report above still stands." />
        )}
      </SpeakingReport>
    );
  }

  return (
    // Standard scale, not `min-h-[26rem]`: arbitrary values have silently
    // failed to emit in this project before, and 26rem pushed the dialog past
    // the fold on a laptop viewport anyway.
    <div className="flex min-h-72 items-center justify-center p-4">
      {/* One dialog for every stage. Swapping its body rather than swapping the
          window is what keeps this reading as a mode change instead of a
          sequence of screens. */}
      <Panel
        chrome="window"
        title="Presentation mode"
        notch={4}
        shadow={5}
        sprig={false}
        className="w-full max-w-sm"
      >
        <div className="min-h-36 px-1 py-2">
          {stage === "preparing" && (
            <div className="space-y-4">
              <p className="font-mono text-sm text-graphite">
                Preparing presentation
                <span className="animate-blink">…</span>
              </p>

              <ProgressBar
                value={STEPS[step].value}
                variant="segmented"
                segments={16}
                size="sm"
                ariaLabel="Presentation setup progress"
              />

              <p className="type-hud text-slate">{stepLabel}</p>
            </div>
          )}

          {stage === "ready" && (
            <div className="space-y-4">
              <p className="font-mono text-sm text-graphite">
                Preparing presentation
              </p>
              <ProgressBar
                value={1}
                variant="segmented"
                segments={16}
                size="sm"
                ariaLabel="Presentation setup progress"
              />
              <p className="type-hud text-ink">Camera ready</p>
            </div>
          )}

          {/* Calm on purpose: a draining meter and mono numerals, no red and
              nothing pulsing. This is the most stressful moment in the session
              and anxiety makes people worse at the thing being measured.

              There is no skip control. A lockout that can be dismissed is not
              a lockout, and the useOneWay guard above covers this stage for
              the same reason. */}
          {stage === "lockout" && (
            <div className="space-y-4">
              <p className="font-mono text-sm text-graphite">
                Notes closed. Structure your answer.
              </p>

              <ProgressBar
                value={lockoutSeconds ? left / lockoutSeconds : 0}
                variant="bar"
                size="sm"
                ariaLabel="Time left before you speak"
              />

              <div className="flex items-baseline justify-between gap-3">
                <span className="type-hud text-slate">Speaking in</span>
                <span className="font-mono text-2xl leading-none tabular-nums text-graphite">
                  {left}s
                </span>
              </div>
            </div>
          )}

          {stage === "countdown" && (
            <div className="flex flex-col items-center justify-center gap-2 py-3">
              <span className="type-hud text-slate">Starting in</span>
              <span
                // Keyed so each digit is a fresh element and replays the snap.
                key={count}
                className="animate-count-step block font-mono text-6xl leading-none tabular-nums"
              >
                {count}
              </span>
            </div>
          )}

          {stage === "blocked" && (
            <div className="space-y-3">
              <p className="font-mono text-sm text-graphite">
                Camera and mic unavailable.
              </p>
              <p className="type-hud text-slate">
                {denied === "NotAllowedError"
                  ? "Permission was declined"
                  : denied === "Timeout"
                    ? "No answer to the permission prompt"
                    : `${denied ?? "Error"} — no device found`}
              </p>
              {/* Both or neither is worth saying plainly: the browser asks once
                  for the pair, and a session with no audio has nothing to
                  score, so there is no useful video-only fallback to offer. */}
              <p className="font-mono text-xs leading-relaxed text-slate">
                Speak needs both. Allow camera and microphone for this site,
                then try again. Your research time is already spent, so nothing
                here is waiting on you.
              </p>

              {/* Was a dead end: the only exit was the browser Back button,
                  which useOneWay holds shut, so the honest reading of this
                  screen was that the session had trapped the user. Retrying is
                  the useful action — the fix is usually a permission granted in
                  another window — and leaving has to be possible too. */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={retry}>
                  Try again
                </Button>
                {/* No confirm: `blocked` is deliberately outside the one-way
                    guard, because there is no take here to lose. */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push("/play")}
                >
                  Abandon session
                </Button>
              </div>
            </div>
          )}

        </div>
      </Panel>
    </div>
  );
}
