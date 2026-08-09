"use client";

import * as React from "react";
import { Mic, Square } from "lucide-react";
import { Badge, Button, PixelFrame } from "@/components/ui";
import { cn } from "@/lib/utils";
import { timingsFor, type Topic } from "@/lib/topics";

/**
 * CameraStage — the camera interface presentation mode opens into.
 *
 * Deliberately not the finished TRANSMIT screen. There is no waveform, no
 * transcript and no scoring here; those are later phases. This is the surface
 * the transition hands off to, and it does the one thing that has to be real
 * for the handoff to mean anything: it shows you, live, with the clock running.
 *
 * No transcript while speaking is a product rule, not an omission — watching
 * your own words appear destroys fluency. See user-flow.md.
 */

function mmss(total: number) {
  const m = Math.floor(Math.max(0, total) / 60);
  const s = Math.max(0, total) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const LEVEL_BARS = 12;

/**
 * Silence that ends the take.
 *
 * Ten seconds, per user-flow.md. Long enough to survive someone losing their
 * thread and finding it again — the pause before the good sentence is not the
 * end of the talk, and cutting it off would punish exactly the thinking the
 * product is trying to provoke.
 */
const SILENCE_MS = 10_000;

/**
 * The same rule inside the five-second buffer, where ten seconds cannot fit.
 *
 * The buffer asks one question — is another sentence coming? — and two seconds
 * of quiet answers it. Someone who has finished should not sit watching a Live
 * badge for the remainder.
 */
const BUFFER_SILENCE_MS = 2_000;

/** Above room tone, below speech. Same scale as the meter. */
const SILENCE_LEVEL = 0.06;

/**
 * Grace seconds after the minute is up, still recording.
 *
 * Cutting at exactly 60 guillotines whoever is mid-sentence, and the last
 * sentence is usually the one carrying the conclusion — the part of the talk
 * worth scoring. The clock is the constraint; the hard stop was just how the
 * constraint happened to be implemented.
 *
 * Short on purpose. Long enough to land a sentence, not long enough to be a
 * sixty-five second talk, which would quietly undo the compression the whole
 * product is built to force.
 */
const BUFFER_SECONDS = 5;

/**
 * MicLevel — proof the microphone is live, not a decoration.
 *
 * The camera makes its own case: you can see yourself, so you know it works. A
 * microphone that is recording and a microphone that is muted look identical,
 * and the one thing worse than a session with no audio is finding that out at
 * the readout. This is the only part of the screen doing a real job.
 *
 * Not a waveform. A waveform invites you to watch it, and TRANSMIT is the one
 * phase where the user should be looking at the lens rather than the UI.
 *
 * Sampled at ~15fps rather than every frame: this is a "yes, it hears you"
 * indicator, and 60fps of React renders to move twelve blocks is a cost with
 * nothing to show for it.
 */
function MicLevel({
  stream,
  onSilence,
  silenceMs = SILENCE_MS,
}: {
  stream: MediaStream;
  /** Fired once, after `silenceMs` of continuous quiet. */
  onSilence?: () => void;
  /**
   * How long the quiet has to last. Differs by phase: ten seconds during the
   * talk, so a thinking pause survives, and a short one during the buffer,
   * where the only question is whether a sentence is still coming.
   */
  silenceMs?: number;
}) {
  const [level, setLevel] = React.useState(0);
  const silentSinceRef = React.useRef<number | null>(null);
  const firedRef = React.useRef(false);
  // Kept in a ref so the analyser effect does not restart every time the
  // parent re-renders and hands down a new callback — tearing down and
  // rebuilding an AudioContext mid-talk would drop the silence timer.
  // Assigned in an effect rather than during render, which React forbids.
  const onSilenceRef = React.useRef(onSilence);
  React.useEffect(() => {
    onSilenceRef.current = onSilence;
  }, [onSilence]);
  // Same reason, and it changes mid-talk: the window shortens when the clock
  // runs out and the buffer starts. Read through a ref so the tick sees the
  // current value rather than the one captured when the analyser was built.
  const silenceMsRef = React.useRef(silenceMs);
  React.useEffect(() => {
    silenceMsRef.current = silenceMs;
  }, [silenceMs]);

  React.useEffect(() => {
    if (stream.getAudioTracks().length === 0) return;

    type WindowWithLegacyAudio = Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor =
      window.AudioContext ?? (window as WindowWithLegacyAudio).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    /**
     * A hidden tab must never be read as a silent speaker.
     *
     * Backgrounding this tab throttles the interval below to about once a
     * second and lets Chrome suspend the AudioContext. A suspended analyser
     * returns a flat buffer, which is indistinguishable from a quiet room —
     * so the detector would count the whole time away as silence and stop a
     * take from someone who was still talking into it. The clock is safe
     * either way, because it is measured against a `Date.now()` stamp rather
     * than accumulated from ticks, but the microphone is not.
     *
     * So while hidden the detector does not merely pause: it forgets the
     * silence it had already seen. Otherwise a nine-second pause, a switch
     * away, and a return would fire the moment the tab came back, which is
     * the same wrong answer arriving later.
     */
    const onVisibility = () => {
      silentSinceRef.current = null;
      // Chrome suspends the context on hide and does not always resume it.
      if (!document.hidden && ctx.state === "suspended") void ctx.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const buf = new Uint8Array(analyser.frequencyBinCount);
    const id = setInterval(() => {
      if (document.hidden) {
        silentSinceRef.current = null;
        return;
      }
      analyser.getByteTimeDomainData(buf);
      // RMS around the 128 midpoint, then a gentle curve — speech sits low in a
      // linear reading and would leave the meter looking broken.
      let sum = 0;
      for (const v of buf) {
        const d = (v - 128) / 128;
        sum += d * d;
      }
      const rms = Math.sqrt(sum / buf.length);
      const shaped = Math.min(1, Math.pow(rms * 3.2, 0.7));
      setLevel(shaped);

      /**
       * Auto-stop on a long silence, as user-flow.md specifies.
       *
       * Measured from the same analyser that draws the meter, so the thing
       * deciding you have stopped talking is the thing showing you it can hear
       * you. The threshold sits above room tone but below speech; ten seconds
       * is long enough to survive a thinking pause, which is why the spec says
       * ten and not three.
       */
      const speaking = shaped > SILENCE_LEVEL;
      if (speaking) {
        silentSinceRef.current = null;
        return;
      }
      const now = Date.now();
      silentSinceRef.current ??= now;
      if (!firedRef.current && now - silentSinceRef.current >= silenceMsRef.current) {
        firedRef.current = true;
        onSilenceRef.current?.();
      }
    }, 66);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      source.disconnect();
      void ctx.close();
    };
  }, [stream]);

  const lit = Math.round(level * LEVEL_BARS);

  return (
    <div className="flex items-center gap-2">
      <Mic size={13} className="shrink-0 text-paper" />
      <div className="flex gap-0.5" aria-hidden>
        {Array.from({ length: LEVEL_BARS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "block h-3 w-1.5",
              i < lit ? "bg-mint" : "bg-paper/25",
            )}
          />
        ))}
      </div>
      <span className="sr-only">Microphone is live</span>
    </div>
  );
}

/** Best container this browser will actually give us, in order of preference. */
const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

export function CameraStage({
  stream,
  topic,
  onStop,
}: {
  stream: MediaStream;
  topic: Topic;
  /** The take, or null if nothing could be recorded. */
  onStop: (recording: Blob | null) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const total = timingsFor(topic).speakSeconds;
  const [elapsed, setElapsed] = React.useState(0);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const finishedRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof MediaRecorder === "undefined") return;

    const mimeType = MIME_CANDIDATES.find((t) =>
      MediaRecorder.isTypeSupported?.(t),
    );

    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      return; // No recorder: the session still runs, there is just no take.
    }

    recorderRef.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    // Timesliced so a crash mid-take leaves usable chunks rather than one
    // buffer that only materialises on stop.
    rec.start(1000);

    return () => {
      if (rec.state !== "inactive") rec.stop();
    };
  }, [stream]);

  /**
   * Stop once, and hand the take up only when the recorder says it is done.
   *
   * `onstop` is what guarantees the last chunk has been flushed — building the
   * Blob at the moment `stop()` is called drops the final second, which is
   * precisely the buffer the talk was given to land its conclusion in.
   */
  const finish = React.useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") {
      onStop(null);
      return;
    }

    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: rec.mimeType || "video/webm",
      });
      onStop(blob.size > 0 ? blob : null);
    };
    rec.stop();
  }, [onStop]);

  React.useEffect(() => {
    const el = videoRef.current;
    if (el && el.srcObject !== stream) el.srcObject = stream;
  }, [stream]);

  React.useEffect(() => {
    // Counted off a fixed start rather than by decrementing once a second: a
    // tab that gets throttled loses ticks, and a timer that quietly runs slow
    // is worse than one that jumps.
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, []);

  // One clock, three readings. Keeping these derived rather than as separate
  // pieces of state means the buffer cannot drift out of step with the talk.
  const left = Math.max(0, total - elapsed);
  const inBuffer = elapsed >= total;
  const bufferLeft = Math.max(0, total + BUFFER_SECONDS - elapsed);

  React.useEffect(() => {
    if (elapsed >= total + BUFFER_SECONDS) finish();
  }, [elapsed, total, finish]);

  return (
    <div className="space-y-4">
      <PixelFrame
        tone="ink"
        notch={6}
        innerClassName="relative overflow-hidden"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          // Mirrored, like every camera preview ever shipped. An unmirrored
          // self-view makes people correct their posture the wrong way.
          className="block h-full w-full -scale-x-100 object-cover"
          style={{ aspectRatio: "16 / 9" }}
        />

        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-3">
          <Badge tone="alert" pulse>
            Live
          </Badge>
          {/* The meter sits with the badge, not in the toolbar: "recording" and
              "hearing you" are one claim, and splitting them lets the user
              believe the first without checking the second. */}
          {/* Auto-stop was armed only during the buffer, and the buffer is five
              seconds against a ten-second silence window — so the rule
              user-flow.md specifies could not fire, ever. It was a feature that
              existed everywhere except in the running product.

              Armed for the whole take now, with the window varying by phase:
              ten seconds during the talk, because a thinking pause is not the
              end of an answer and cutting someone off mid-thought is the worst
              thing this screen could do. In the buffer it drops to two, since
              the buffer's only question is whether another sentence is coming
              and the answer arrives quickly. */}
          <MicLevel
            stream={stream}
            onSilence={finish}
            silenceMs={inBuffer ? BUFFER_SILENCE_MS : SILENCE_MS}
          />
        </div>

        {/* The label changes, the badge does not: it is still recording during
            the buffer, and a "Live" light that goes out while the camera is
            running would be the one lie this screen cannot afford. */}
        <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col items-end gap-1">
          <span
            className={cn(
              "type-hud",
              inBuffer ? "text-mint" : "text-paper/60",
            )}
          >
            {inBuffer ? "Finish your sentence" : "Remaining"}
          </span>
          <span className="pixel-clip block border-2 border-paper bg-ink px-3 py-1.5 font-mono text-2xl text-paper tabular-nums">
            {mmss(inBuffer ? bufferLeft : left)}
          </span>
        </div>
      </PixelFrame>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="type-hud text-slate">
          One minute, plus five seconds to land it. Stop early if you are done.
        </span>
        <Button variant="danger" iconLeft={<Square size={13} />} onClick={finish}>
          Stop
        </Button>
      </div>
    </div>
  );
}
