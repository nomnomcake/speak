"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, X } from "lucide-react";
import {
  Badge,
  Divider,
  FolderGlyph,
  Panel,
  PixelFrame,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/tokens";
import { CLASS_MARK } from "@/lib/topics";
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

/**
 * How long the landed card is held before the research screen opens.
 *
 * The reveal is a beat, not a decision point — there is nothing here to choose,
 * so a confirm button would just be a step between the user and the thing they
 * asked for. Long enough to read the filename and register that the search
 * arrived somewhere; short enough that it never becomes a screen being waited
 * on. The close control in the title bar remains the way out.
 */
const REVEAL_HOLD_MS = 1100;

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
  const router = useRouter();
  const files = folder.files;
  const [phase, setPhase] = React.useState<Phase>("scanning");
  const [index, setIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [picked, setPicked] = React.useState<DesktopFile | null>(null);

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
  }, [files]);

  // The search hands off to the research screen on its own.
  React.useEffect(() => {
    if (phase !== "revealed" || !picked) return;

    const href = `/research?topic=${picked.id}`;

    // Warmed during the hold rather than on arrival: /research is a dynamic
    // route, so without this the handoff lands on the loading fallback and the
    // deceleration the whole sequence just built pays off in a spinner.
    router.prefetch(href);

    const go = setTimeout(() => router.push(href), REVEAL_HOLD_MS);
    return () => clearTimeout(go);
  }, [phase, picked, router]);

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
        {/* One effect, not four. The CRT flicker sat under a scanline sweep,
            a hatched bar and a scrolling read-log; together they were noise
            competing with the thing you are actually watching, which is the
            card slowing down. The sweep survives because it is the one that
            says "scanning". */}
        {searching && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          >
            <div className="animate-scanline h-3 w-full bg-glow/40" />
          </div>
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
                    ? `${current.category} · ${CLASS_MARK[current.difficulty]} · ${current.speakSeconds}s to speak`
                    : ""}
                </div>
            </PixelFrame>
          </motion.div>
        </div>

        <Divider />

        {/* No confirm button: the screen advances itself. The line just says
            which of the two things is happening. */}
        <div className="type-hud text-slate">
          {searching
            ? `Searching ${folder.label.toLowerCase()} — ${files.length} files`
            : "Opening…"}
        </div>
      </div>
    </Panel>
  );
}
