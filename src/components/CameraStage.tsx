"use client";

import * as React from "react";
import { Square } from "lucide-react";
import { Badge, Button, PixelFrame } from "@/components/ui";
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
  const [left, setLeft] = React.useState(total);

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
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setLeft(Math.max(0, total - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, [total]);

  React.useEffect(() => {
    if (left === 0) onStop();
  }, [left, onStop]);

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

        <div className="pointer-events-none absolute top-3 left-3">
          <Badge tone="alert" pulse>
            Live
          </Badge>
        </div>

        <div className="pointer-events-none absolute right-3 bottom-3">
          <span className="pixel-clip block border-2 border-paper bg-ink px-3 py-1.5 font-mono text-2xl text-paper tabular-nums">
            {mmss(left)}
          </span>
        </div>
      </PixelFrame>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="type-hud text-slate">
          One minute. Stop early if you are done.
        </span>
        <Button variant="danger" iconLeft={<Square size={13} />} onClick={onStop}>
          Stop
        </Button>
      </div>
    </div>
  );
}
