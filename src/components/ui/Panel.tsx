import * as React from "react";
import { cn } from "@/lib/utils";
import { PixelFrame } from "./PixelFrame";
import type { Tone } from "@/lib/tokens";

/**
 * Panel — a titled window, the primary content container.
 *
 * Two chrome treatments, both taken from the reference:
 *  - `window`: the title sits in its own framed bar inside the panel, used for
 *    top-level regions (SPEAK.EXE, BRIEF.EXE).
 *  - `inline`: title and controls sit flush at the top with a rule beneath,
 *    used for the smaller nested modules.
 */

/** The two ○○ marks in every title bar. Decorative only. */
function WindowDots({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1.5">
      {[0, 1].map((i) => (
        <span
          key={i}
          className={cn(
            "block size-2.5 rounded-full border-2",
            tone === "ink" ? "border-ink" : "border-paper",
          )}
        />
      ))}
    </span>
  );
}

export type PanelProps = {
  title?: React.ReactNode;
  /** Right side of the title bar — status text, counters, small controls. */
  actions?: React.ReactNode;
  chrome?: "window" | "inline" | "none";
  tone?: Tone;
  notch?: number;
  shadow?: number;
  /** Remove the default interior padding for edge-to-edge content. */
  flush?: boolean;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
};

export function Panel({
  title,
  actions,
  chrome = "inline",
  tone = "paper",
  notch = 6,
  shadow = 0,
  flush = false,
  footer,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  const inverted = tone === "ink";
  const dotTone = inverted ? "paper" : "ink";

  return (
    <PixelFrame
      tone={tone}
      notch={notch}
      shadow={shadow}
      className={className}
      innerClassName={cn(
        "flex flex-col",
        inverted ? "text-paper" : "text-ink",
        chrome === "window" && "gap-4 p-4",
      )}
    >
      {title !== undefined && chrome === "window" && (
        <PixelFrame
          tone={tone}
          notch={3}
          border={2}
          innerClassName="flex items-center justify-between gap-4 px-3 py-2"
        >
          <span className="text-caps truncate">{title}</span>
          <span className="flex items-center gap-3">
            {actions}
            <WindowDots tone={dotTone} />
          </span>
        </PixelFrame>
      )}

      {title !== undefined && chrome === "inline" && (
        <>
          <div className="flex items-center justify-between gap-4 px-4 pt-3 pb-2.5">
            <span className="text-caps truncate">{title}</span>
            <span className="flex items-center gap-3">
              {actions}
              <WindowDots tone={dotTone} />
            </span>
          </div>
          <div
            aria-hidden
            className={cn("h-0.5 w-full", inverted ? "bg-paper" : "bg-ink")}
          />
        </>
      )}

      <div
        className={cn(
          "flex-1",
          !flush && (chrome === "window" ? "px-1 pb-1" : "p-4"),
          bodyClassName,
        )}
      >
        {children}
      </div>

      {footer && (
        <>
          <div
            aria-hidden
            className={cn("h-0.5 w-full", inverted ? "bg-paper" : "bg-ink")}
          />
          <div className="px-4 py-2.5">{footer}</div>
        </>
      )}
    </PixelFrame>
  );
}