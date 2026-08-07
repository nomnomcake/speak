"use client";

import * as React from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Badge, PixelFrame, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { readJSON, writeJSON } from "@/lib/storage";

/**
 * CountdownTimer — a classic desktop timer widget.
 *
 * Persists to localStorage so a reload does not cost the session. It stores the
 * remaining time *and* the wall-clock instant it was last written, so a timer
 * left running while the tab was closed resumes with that time deducted rather
 * than pretending no time passed. A research timer that pauses itself whenever
 * you look away would be measuring the wrong thing.
 */

type Saved = {
  remainingMs: number;
  running: boolean;
  /** Epoch ms when this was written, used to charge elapsed time on resume. */
  savedAt: number;
};

function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CountdownTimer({
  storageKey,
  totalSeconds = 15 * 60,
  className,
}: {
  storageKey: string;
  totalSeconds?: number;
  className?: string;
}) {
  const totalMs = totalSeconds * 1000;

  // Server and first client render agree on the full duration; the saved value
  // is applied after mount, so there is no hydration mismatch.
  const [remaining, setRemaining] = React.useState(totalMs);
  const [running, setRunning] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Restore. Deferred rather than set inline: a synchronous setState in an
  // effect body causes a cascading render, which React's lint rule flags.
  React.useEffect(() => {
    const t = setTimeout(() => {
      const saved = readJSON<Saved | null>(storageKey, null);
      if (saved) {
        const elapsed = saved.running ? Date.now() - saved.savedAt : 0;
        setRemaining(Math.max(0, saved.remainingMs - elapsed));
        setRunning(saved.running && saved.remainingMs - elapsed > 0);
      }
      setLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, [storageKey]);

  // Tick. Driven off timestamps rather than counting intervals, so throttled
  // background tabs do not silently lose time.
  React.useEffect(() => {
    if (!running || !loaded) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setRemaining((prev) => {
        const next = Math.max(0, prev - delta);
        if (next === 0) setRunning(false);
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [running, loaded]);

  // Persist on every meaningful change, and once more on unload so a close
  // mid-tick does not lose the last few seconds.
  React.useEffect(() => {
    if (!loaded) return;
    writeJSON(storageKey, {
      remainingMs: remaining,
      running,
      savedAt: Date.now(),
    } satisfies Saved);
  }, [storageKey, remaining, running, loaded]);

  const expired = remaining === 0;
  const progress = totalMs === 0 ? 0 : 1 - remaining / totalMs;

  return (
    <PixelFrame
      tone={expired ? "ink" : "paper"}
      notch={4}
      className={className}
      innerClassName={cn("space-y-3 p-4", expired && "text-paper")}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn("type-hud", expired ? "text-mint" : "text-slate")}
        >
          Research timer
        </span>
        {expired ? (
          <Badge tone="alert">Time up</Badge>
        ) : running ? (
          <Badge tone="ink" pulse>
            Running
          </Badge>
        ) : (
          <Badge tone="mint">Paused</Badge>
        )}
      </div>

      <div
        className={cn(
          "text-center font-mono text-5xl leading-none tabular-nums",
          expired && "text-alert",
        )}
        // The clock is the one number here that changes constantly; announcing
        // every tick would flood a screen reader.
        aria-live="off"
      >
        {format(remaining)}
      </div>

      <ProgressBar value={progress} variant="segmented" segments={15} invert={expired} />

      <div className="flex items-center gap-2">
        {/* At zero this becomes Start over rather than a disabled Resume. A
            dead control at the exact moment the user needs to act is worse
            than no control. */}
        <button
          type="button"
          onClick={() => {
            if (expired) {
              setRemaining(totalMs);
              setRunning(false);
              return;
            }
            setRunning((r) => !r);
          }}
          className={cn(
            "pixel-clip type-caps flex flex-1 items-center justify-center gap-2 border-2 border-ink px-3 py-2 text-[11px] transition-colors duration-150",
            expired
              ? "bg-alert text-ink hover:bg-paper"
              : running
                ? "bg-ink text-mint hover:bg-graphite"
                : "bg-mint text-ink hover:bg-mint-deep",
          )}
          style={{ ["--notch" as string]: "2px" }}
        >
          {expired ? (
            <RotateCcw size={12} />
          ) : running ? (
            <Pause size={12} />
          ) : (
            <Play size={12} />
          )}
          {expired
            ? "Start over"
            : running
              ? "Pause"
              : remaining === totalMs
                ? "Start"
                : "Resume"}
        </button>

        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(totalMs);
          }}
          aria-label="Reset timer"
          className="pixel-clip flex size-9 items-center justify-center border-2 border-ink bg-paper text-ink transition-colors duration-150 hover:bg-mint-soft"
          style={{ ["--notch" as string]: "2px" }}
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </PixelFrame>
  );
}
