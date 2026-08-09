import * as React from "react";
import { cn } from "@/lib/utils";
import { PixelFrame } from "./PixelFrame";
import { PixelSky, type PixelSkyProps } from "./PixelSky";
import { Sprig } from "./PixelArt";
import type { Tone } from "@/lib/tokens";

/**
 * Panel — a titled window, the primary content container.
 *
 * Three chrome treatments, all taken from the reference:
 *  - `window`: the title sits in its own framed bar inside the panel, with a
 *    sprig in the corner. Used for top-level regions (SPEAK.EXE, BRIEF.EXE).
 *  - `inline`: title and controls flush at the top with a rule beneath, used
 *    for the smaller nested modules.
 *  - `none`: bare surface.
 *
 * `sky` fills the interior with a mint pixel sky so white cards float on
 * clouds — the defining move of the reference layout.
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
  /**
   * Element to render the title as. Defaults to a `span`, because most panels
   * are windows on a screen rather than sections of a document and marking
   * every one as a heading would produce an outline that is mostly furniture.
   *
   * Set `"h1"` on the one panel that names the page. Several routes shipped
   * with no `h1` at all, which is the first thing a screen reader user asks a
   * page for.
   */
  titleAs?: "span" | "h1" | "h2";
  /** Right side of the title bar — status text, counters, small controls. */
  actions?: React.ReactNode;
  chrome?: "window" | "inline" | "none";
  tone?: Tone;
  notch?: number;
  shadow?: number;
  /** Remove the default interior padding for edge-to-edge content. */
  flush?: boolean;
  /** Fill the body with a pixel sky. `true` uses the default density. */
  sky?: boolean | PixelSkyProps;
  /**
   * Show the corner sprig in `window` chrome.
   *
   * **One per screen.** It belongs to the window that owns the page — the
   * desktop, the research window, the session — and is turned off on every
   * nested or utility window inside it. A plant in all six title bars of the
   * dashboard stops reading as a flourish and starts reading as a bullet
   * point, and it was the difference between the screens that made the app
   * feel assembled from parts.
   */
  sprig?: boolean;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
};

export function Panel({
  title,
  titleAs: TitleTag = "span",
  actions,
  chrome = "inline",
  tone = "paper",
  notch = 6,
  shadow = 0,
  flush = false,
  sky = false,
  sprig = true,
  footer,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  const inverted = tone === "ink";
  const dotTone = inverted ? "paper" : "ink";
  const skyProps: PixelSkyProps =
    typeof sky === "object" ? sky : { density: "normal" };

  return (
    <PixelFrame
      tone={tone}
      notch={notch}
      shadow={shadow}
      className={className}
      innerClassName={cn(
        "flex flex-col",
        inverted ? "text-paper" : "text-ink",
        chrome === "window" && "gap-3 p-3",
      )}
    >
      {title !== undefined && chrome === "window" && (
        <PixelFrame
          tone={tone}
          notch={3}
          border={2}
          innerClassName="flex items-center justify-between gap-4 px-3 py-2"
        >
          <TitleTag className="type-caps truncate">{title}</TitleTag>
          <span className="flex items-center gap-3">
            {actions}
            <WindowDots tone={dotTone} />
            {/* Follows the tone, like the dots beside it. Hardcoded `text-ink`
                painted a black plant onto a black title bar, so every inverted
                window silently lost its sprig — present in the markup, invisible
                on screen. */}
            {sprig && (
              <Sprig
                size={15}
                className={inverted ? "text-paper" : "text-ink"}
              />
            )}
          </span>
        </PixelFrame>
      )}

      {title !== undefined && chrome === "inline" && (
        <>
          <div className="flex items-center justify-between gap-4 px-4 pt-3 pb-2.5">
            <TitleTag className="type-caps truncate">{title}</TitleTag>
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
          "relative flex-1",
          sky && "pixel-clip overflow-hidden",
          // Sky windows get a generous inset so a band of clouds frames the
          // white cards, the way the reference does it.
          !flush && (sky ? "p-6 sm:p-8" : "p-4"),
          bodyClassName,
        )}
        style={
          sky
            ? ({ ["--notch" as string]: "3px" } as React.CSSProperties)
            : undefined
        }
      >
        {sky && <PixelSky {...skyProps} />}
        <div className="relative">{children}</div>
      </div>

      {/* In `window` chrome the footer is a framed bar mirroring the title bar.
          A plain rule would sit inset by the window's own padding and read as
          a misaligned divider rather than a status bar. */}
      {footer &&
        (chrome === "window" ? (
          <PixelFrame
            tone={tone}
            notch={3}
            border={2}
            innerClassName="flex items-center justify-between gap-4 px-3 py-1.5"
          >
            {footer}
          </PixelFrame>
        ) : (
          <>
            <div
              aria-hidden
              className={cn("h-0.5 w-full", inverted ? "bg-paper" : "bg-ink")}
            />
            <div className="px-4 py-2.5">{footer}</div>
          </>
        ))}
    </PixelFrame>
  );
}