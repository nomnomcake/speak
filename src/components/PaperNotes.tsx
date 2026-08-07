"use client";

import * as React from "react";
import { Check, Pencil } from "lucide-react";
import { PixelFrame } from "@/components/ui";
import { cn } from "@/lib/utils";
import { readJSON, writeJSON } from "@/lib/storage";

/**
 * PaperNotes — a spiral notebook that deliberately cannot be typed in.
 *
 * The panel is a physical object rather than a form: punched binding down the
 * left edge, a margin rule, and ruled lines whose spacing matches the text's
 * line-height so writing sits on them. It holds instructions telling the user
 * to write by hand.
 *
 * Notes are on real paper on purpose:
 *  - Handwriting is slower than reading, which forces compression. A textarea
 *    invites transcription, and a transcript is a script.
 *  - You cannot copy-paste onto a page. Anything written down has been through
 *    the user's head first, which is the whole skill being trained.
 *  - Paper can be turned face down for the lockout. A browser tab full of
 *    notes cannot be un-read.
 *
 * The only persisted state is whether the user has confirmed they have a pen.
 */

const RULE = 30;
const RING_COUNT = 7;

const INSTRUCTIONS: Array<{ n: string; text: string }> = [
  {
    n: "01",
    text:
      "Write in your own words. Copying a phrase you cannot yet explain is how you end up reciting it.",
  },
  {
    n: "02",
    text:
      "One idea per line. If a line needs a comma to hold together, it is probably two ideas.",
  },
  {
    n: "03",
    text: "Draw the mechanism where you can. Arrows beat sentences.",
  },
  {
    n: "04",
    text:
      "Stop writing with three minutes left and say it out loud to yourself, from the page.",
  },
];

/** Punched holes and wire down the binding edge. */
function Binding() {
  return (
    <div
      aria-hidden
      className="absolute inset-y-0 left-0 flex w-10 flex-col items-center justify-evenly border-r-2 border-ink bg-mint-soft"
    >
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <span key={i} className="relative flex items-center">
          {/* the wire crossing the hole */}
          <span className="absolute -left-1 h-1 w-7 bg-ink" />
          <span className="relative size-3 rounded-full border-2 border-ink bg-paper" />
        </span>
      ))}
    </div>
  );
}

export function PaperNotes({
  storageKey,
  className,
}: {
  storageKey: string;
  className?: string;
}) {
  const [ready, setReady] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Restored after mount, never during render — the server has no
  // localStorage, so reading at render time would break hydration.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setReady(readJSON<boolean>(storageKey, false));
      setLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, [storageKey]);

  return (
    <PixelFrame
      notch={4}
      className={cn("flex h-full flex-col", className)}
      innerClassName="flex h-full flex-col"
    >
      {/* Title bar */}
      <div className="flex shrink-0 items-center gap-2 px-3 py-2">
        <Pencil size={13} className="shrink-0 text-mint-shade" />
        <span className="type-caps truncate">NOTEBOOK</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="block size-2.5 rounded-full border-2 border-ink"
            />
          ))}
        </span>
      </div>
      <div aria-hidden className="h-0.5 shrink-0 bg-ink" />

      {/* The page */}
      <div className="relative flex-1">
        <Binding />

        {/* Margin rule, just right of the binding */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-[52px] w-0.5 bg-alert/35"
        />

        <div
          className="py-3 pr-5 pl-16"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${RULE - 1}px, var(--color-mint-soft) ${RULE - 1}px, var(--color-mint-soft) ${RULE}px)`,
            lineHeight: `${RULE}px`,
          }}
        >
          <h2 className="type-caps text-sm">Get a pen and paper</h2>

          <ol>
            {INSTRUCTIONS.map((item) => (
              <li key={item.n} className="flex gap-3 text-sm text-graphite">
                <span className="shrink-0 font-mono text-xs text-mint-shade tabular-nums">
                  {item.n}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>

          <p className="max-w-prose text-sm text-slate">
            Nothing is typed here on purpose — handwriting forces you to
            compress, and you cannot copy-paste onto a page.
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div aria-hidden className="h-0.5 shrink-0 bg-ink" />
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2">
        <span className="type-hud text-slate">
          {loaded && ready ? "Pen in hand" : "Pen and paper needed"}
        </span>

        <button
          type="button"
          onClick={() =>
            setReady((prev) => {
              const next = !prev;
              writeJSON(storageKey, next);
              return next;
            })
          }
          aria-pressed={ready}
          className={cn(
            "pixel-clip type-hud flex items-center gap-2 border-2 border-ink px-2 py-1 transition-colors duration-150",
            ready ? "bg-mint text-ink" : "bg-paper text-ink hover:bg-mint-soft",
          )}
          style={{ ["--notch" as string]: "2px" }}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-3 items-center justify-center border-2 border-ink",
              ready ? "bg-ink text-mint" : "bg-paper",
            )}
          >
            {ready && <Check size={7} strokeWidth={4} />}
          </span>
          I have paper
        </button>
      </div>
    </PixelFrame>
  );
}
