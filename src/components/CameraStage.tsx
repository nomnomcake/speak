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
function MicLevel({ stream }: { stream: MediaStream }) {
  const [level, setLevel] = React.useState(0);

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

    const buf = new Uint8Array(analyser.frequencyBinCount);
    const id = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      // RMS around the 128 midpoint, then a gentle curve — speech sits low in a
      // linear reading and would leave the meter looking broken.
      let sum = 0;
      for (const v of buf) {
        const d = (v - 128) / 128;
        sum += d * d;
      }
      const rms = Math.sqrt(sum / buf.length);
      setLevel(Math.min(1, Math.pow(rms * 3.2, 0.7)));
    }, 66);

    return () => {
      clearInterval(id);
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

export function CameraStage({
  stream,
  topic,
  onStop,
}: {
  stream: MediaStream;
  topic: Topic;
  onStop: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const total = timingsFor(topic).speakSeconds;
  const [elapsed, setElapsed] = React.useState(0);

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
    if (elapsed >= total + BUFFER_SECONDS) onStop();
  }, [elapsed, total, onStop]);

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
          <MicLevel stream={stream} />
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
        <Button variant="danger" iconLeft={<Square size={13} />} onClick={onStop}>
          Stop
        </Button>
      </div>
    </div>
  );
}
