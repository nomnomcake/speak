"use client";

import * as React from "react";
import { Panel, ProgressBar } from "@/components/ui";
import { CameraStage } from "./CameraStage";
import { ReviewEmpty, ReviewWindow } from "./ReviewWindow";
import type { Topic } from "@/lib/topics";

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
  | "countdown"
  | "live"
  | "blocked"
  | "review"
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
  }, []);

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
  const [slow, setSlow] = React.useState(false);
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
      const id = setTimeout(() => setStage("countdown"), READY_HOLD_MS);
      return () => clearTimeout(id);
    }
    if (stage === "countdown") {
      const id = setTimeout(() => {
        if (count <= 1) setStage("live");
        else setCount((c) => c - 1);
      }, TICK_MS);
      return () => clearTimeout(id);
    }
  }, [stage, count]);

  const [recording, setRecording] = React.useState<Blob | null>(null);

  const handleStop = React.useCallback(
    (take: Blob | null) => {
      setRecording(take);
      setStage("review");
      // The camera light goes out the moment the talk ends. Leaving it on
      // through the review screen would be the app watching someone watch
      // themselves.
      stream?.getTracks().forEach((t) => t.stop());
    },
    [stream],
  );

  const handleDelete = React.useCallback(() => {
    setRecording(null);
    setStage("discarded");
  }, []);

  const waiting = Boolean(STEPS[step].gated) && stream === null && denied === null;
  const stepLabel =
    waiting && slow ? "Waiting for permission" : STEPS[step].label;

  if (stage === "live" && stream) {
    return <CameraStage stream={stream} topic={topic} onStop={handleStop} />;
  }

  if (stage === "review") {
    return recording ? (
      <ReviewWindow
        recording={recording}
        topic={topic}
        onDelete={handleDelete}
      />
    ) : (
      <ReviewEmpty reason="That take could not be recorded, so there is nothing to play back." />
    );
  }

  if (stage === "discarded") {
    return <ReviewEmpty reason="Take deleted. It is gone from this device." />;
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
              />

              <p className="type-hud text-slate">{stepLabel}</p>
            </div>
          )}

          {stage === "ready" && (
            <div className="space-y-4">
              <p className="font-mono text-sm text-graphite">
                Preparing presentation
              </p>
              <ProgressBar value={1} variant="segmented" segments={16} size="sm" />
              <p className="type-hud text-ink">Camera ready</p>
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
                then reload. Your research time is already spent, so nothing
                here is waiting on you.
              </p>
            </div>
          )}

        </div>
      </Panel>
    </div>
  );
}
