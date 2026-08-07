"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, RotateCcw, X } from "lucide-react";
import {
  Badge,
  Button,
  Divider,
  FolderGlyph,
  Panel,
  PixelFrame,
  ProgressBar,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/tokens";
import type { DesktopFile, DesktopFolder } from "./CategoryDesktop";

/**
 * TopicRandomizer — the machine searching its filing cabinet.
 *
 * Deliberately not a slot machine. A reel spins at constant speed and stops
 * arbitrarily, which reads as chance. This reads as *search*: it scans folders
 * in sequence, prints what it is reading, fills a progress bar, then decelerates
 * onto a file the way a mechanism running out of momentum would.
 *
 * The landing is computed up front — a target index is chosen, then the exact
 * number of steps needed to arrive there after a couple of full passes. The
 * deceleration is therefore honest: it is genuinely arriving somewhere, not
 * stopping at random and snapping.
 */

type Phase = "scanning" | "settling" | "revealed";

const SCAN_TICKS = 20;
const FOLDER_COUNT = 5;

/** Constant while scanning, then growing quadratically as it settles. */
function delayFor(tick: number, settleSteps: number): number {
  if (tick < SCAN_TICKS) return 65;
  const t = (tick - SCAN_TICKS) / Math.max(1, settleSteps);
  return 65 + t * t * 320;
}

export function TopicRandomizer({
  folder,
  onClose,
}: {
  folder: DesktopFolder;
  onClose: () => void;
}) {
  const files = folder.files;
  const [phase, setPhase] = React.useState<Phase>("scanning");
  const [index, setIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [log, setLog] = React.useState<string[]>([]);
  const [picked, setPicked] = React.useState<DesktopFile | null>(null);
  const [runId, setRunId] = React.useState(0);

  React.useEffect(() => {
    const len = files.length;
    if (len === 0) return;

    const target = Math.floor(Math.random() * len);

    // Someone who has asked for less motion should still get the result.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Deferred rather than set inline: a synchronous setState in an effect
      // body triggers a cascading render, and React's lint rule rightly
      // objects. A zero-delay timer resolves on the next tick instead.
      const settle = setTimeout(() => {
        setIndex(target);
        setPicked(files[target]);
        setProgress(1);
        setPhase("revealed");
      }, 0);
      return () => clearTimeout(settle);
    }

    // Steps needed to land exactly on `target`, plus one full extra pass so
    // the deceleration has somewhere to happen. total % len === target.
    const settleSteps = (((target - SCAN_TICKS) % len) + len) % len || len;
    const total = SCAN_TICKS + settleSteps + len;

    let tick = 0;
    let settling = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      tick += 1;
      const next = tick % len;

      setIndex(next);
      setProgress(tick / total);
      setLog((prev) => [...prev, `READ ${files[next].name}  OK`].slice(-5));

      if (!settling && tick >= SCAN_TICKS) {
        settling = true;
        setPhase("settling");
      }

      if (tick >= total) {
        setPicked(files[next]);
        setProgress(1);
        setPhase("revealed");
        return;
      }

      timer = setTimeout(step, delayFor(tick, settleSteps + len));
    };

    timer = setTimeout(step, 240);
    return () => clearTimeout(timer);
    // runId re-runs the whole sequence for "Search again".
  }, [files, runId]);

  const current = picked ?? files[index] ?? null;
  const searching = phase !== "revealed";
  const openFolder = searching
    ? Math.floor(progress * FOLDER_COUNT * 2) % FOLDER_COUNT
    : -1;

  return (
    <Panel
      chrome="window"
      notch={6}
      title={searching ? "Searching…" : "Selected"}
      actions={
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="pixel-clip flex size-6 items-center justify-center border-2 border-ink bg-paper transition-colors duration-150 hover:bg-alert"
          style={{ ["--notch" as string]: "2px" }}
        >
          <X size={11} />
        </button>
      }
    >
      <div className="relative space-y-5">
        {/* CRT veil — only while the machine is working. */}
        {searching && (
          <>
            <div
              aria-hidden
              className="pixel-scanlines animate-crt pointer-events-none absolute inset-0 z-10"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
            >
              <div className="animate-scanline h-3 w-full bg-glow/40" />
            </div>
          </>
        )}

        {/* The cabinet being searched */}
        <div className="flex items-end justify-center gap-3 sm:gap-6">
          {Array.from({ length: FOLDER_COUNT }).map((_, i) => (
            <FolderGlyph key={i} open={i === openFolder} size={56} />
          ))}
        </div>

        {/* The card being flicked through */}
        <div className="flex justify-center">
          {/* Keyed remount replays the entry animation on every flick. No
              AnimatePresence: exit transitions firing every 65ms would pile up
              faster than they could finish. */}
          <motion.div
            key={current ? `${current.name}-${phase}` : "empty"}
            // No opacity in the entry. Ticks fire every 65ms while a fade
            // takes ~90ms, so the card never finished appearing and read as a
            // flicker with blank frames. Position and tilt alone give the
            // flick, and the filename stays legible throughout.
            initial={{ y: -5, rotate: -0.8 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 0.07, ease: ease.pixel }}
            className="w-full max-w-md"
          >
              <PixelFrame
                tone={phase === "revealed" ? "ink" : "paper"}
                notch={4}
                shadow={phase === "revealed" ? 5 : 0}
                innerClassName={cn(
                  "flex flex-col gap-2 px-5 py-4",
                  phase === "revealed" && "text-paper",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-lg">
                    {current?.name ?? "—"}
                  </span>
                  {phase === "revealed" ? (
                    <Badge tone="mint">
                      <Lock size={9} />
                      Sealed
                    </Badge>
                  ) : (
                    <span className="type-hud text-mute">reading</span>
                  )}
                </div>

                <div
                  className={cn(
                    "type-hud",
                    phase === "revealed" ? "text-mint" : "text-slate",
                  )}
                >
                  {current
                    ? `${current.category} · ${current.difficulty} · ${current.speakSeconds}s to speak`
                    : ""}
                </div>
            </PixelFrame>
          </motion.div>
        </div>

        {/* Progress + log */}
        <div className="space-y-3">
          <ProgressBar
            value={progress}
            variant="segmented"
            segments={24}
            label={searching ? "Scanning cabinet" : "Search complete"}
            showValue
          />

          <PixelFrame
            notch={3}
            border={2}
            tone="mist"
            innerClassName="h-24 overflow-hidden px-3 py-2"
          >
            <div className="flex h-full flex-col justify-end gap-0.5 font-mono text-[11px] text-slate">
              {log.map((line, i) => (
                <div key={`${line}-${i}`} className="truncate">
                  <span className="text-mute">&gt;</span> {line}
                </div>
              ))}
              {phase === "revealed" && (
                <div className="truncate text-ink">
                  <span className="text-mute">&gt;</span> MATCH FOUND —{" "}
                  {picked?.name}
                </div>
              )}
            </div>
          </PixelFrame>
        </div>

        <Divider />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="type-hud text-slate">
            {searching
              ? `Searching ${folder.label.toLowerCase()} — ${files.length} files`
              : "Title stays sealed until the readout"}
          </span>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              iconLeft={<RotateCcw size={15} />}
              disabled={searching}
              onClick={() => {
                setPhase("scanning");
                setPicked(null);
                setProgress(0);
                setLog([]);
                setRunId((n) => n + 1);
              }}
            >
              Search again
            </Button>
            <Button
              disabled={searching}
              iconRight={<ArrowRight size={15} />}
            >
              Begin
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
