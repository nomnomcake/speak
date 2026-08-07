"use client";

import * as React from "react";
import { Check, PenLine } from "lucide-react";
import { PixelFrame } from "@/components/ui";
import { cn } from "@/lib/utils";
import { readJSON, writeJSON } from "@/lib/storage";

/**
 * PaperNotes — a notepad window that deliberately cannot be typed in.
 *
 * The panel looks like Notepad and is ruled like paper, but it holds
 * instructions rather than a text field. Notes are taken on real paper, by
 * hand, on purpose:
 *
 *  - Handwriting is slower than reading, which forces compression. A textarea
 *    invites transcription, and a transcript is a script.
 *  - You cannot copy-paste onto a page. Anything written down has been through
 *    the user's head first, which is the whole skill being trained.
 *  - Paper can be turned face down for the lockout. A browser tab full of
 *    notes cannot be un-read.
 *
 * The only persisted state is whether the user has confirmed they have a pen,
 * so the prompt does not nag on every reload.
 */

const RULE_SPACING = 30;

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

  const toggle = () => {
    setReady((prev) => {
      const next = !prev;
      writeJSON(storageKey, next);
      return next;
    });
  };

  return (
    <PixelFrame
      notch={4}
      className={cn("flex h-full flex-col", className)}
      innerClassName="flex h-full flex-col"
    >
      {/* Title bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2">
        <span className="type-caps truncate">NOTES — ON PAPER</span>
        <span className="type-hud text-mute">Not typed</span>
      </div>
      <div aria-hidden className="h-0.5 shrink-0 bg-ink" />

      {/* Ruled paper holding printed instructions */}
      <div
        className="flex-1 px-5 py-4"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 29px, var(--color-mint-soft) 29px, var(--color-mint-soft) 30px)",
          lineHeight: `${RULE_SPACING}px`,
        }}
      >
        <div className="flex items-center gap-2">
          <PenLine size={15} className="shrink-0 text-mint-shade" />
          <h2 className="type-caps text-sm">Get a pen and paper</h2>
        </div>

        <ol className="mt-2 space-y-0">
          {INSTRUCTIONS.map((item) => (
            <li key={item.n} className="flex gap-3 text-sm text-graphite">
              <span className="shrink-0 font-mono text-xs text-mint-shade tabular-nums">
                {item.n}
              </span>
              <span>{item.text}</span>
            </li>
          ))}
        </ol>

        <p className="mt-3 max-w-prose text-sm text-slate">
          Nothing is typed here on purpose. Handwriting is slower than reading,
          which forces you to compress — and you cannot copy-paste onto a page.
        </p>
      </div>

      {/* Status bar */}
      <div aria-hidden className="h-0.5 shrink-0 bg-ink" />
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2">
        <span className="type-hud text-slate">
          {loaded && ready ? "Ready" : "Pen and paper needed"}
        </span>

        <button
          type="button"
          onClick={toggle}
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
