import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PixelFrame } from "./PixelFrame";
import { BackgroundGrid } from "./BackgroundGrid";
import { Sprig } from "./PixelArt";
import { TabMark } from "./TabMark";
import { ChevronLeft, ChevronRight, RotateCw, Plus, Star } from "lucide-react";

/**
 * BrowserFrame — the fake browser the entire product lives inside.
 *
 * Three stacked chrome rows (tabs, address, bookmarks) above a scrolling
 * viewport, all inside one PixelFrame. The chrome is fixed and the content
 * scrolls within it, which is what sells the illusion: a real browser's
 * toolbar doesn't scroll away.
 *
 * There is no separate title bar. Tabs sit in the top row and the window
 * controls sit at its right edge, which is how a modern browser lays out its
 * title bar and saves a row of chrome.
 *
 * The drifting clouds and dotted grid are the desktop wallpaper *behind* this
 * window, not the page inside it — so the viewport reads as a plain white
 * document the way a real browser's does.
 */

/** The two ○○ marks. Decorative — this window doesn't close. */
function WindowDots() {
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1.5">
      {[0, 1].map((i) => (
        <span key={i} className="block size-2.5 rounded-full border-2 border-ink" />
      ))}
    </span>
  );
}

/** A square pixel key for the toolbar. Inert — routing lands in a later phase. */
function ToolButton({
  children,
  label,
  dim = false,
}: {
  children: React.ReactNode;
  label: string;
  dim?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "pixel-clip flex size-7 shrink-0 cursor-default items-center justify-center border-2 border-ink bg-paper transition-colors duration-150",
        dim ? "text-mute" : "text-ink hover:bg-mint-soft",
      )}
      style={{ ["--notch" as string]: "2px" }}
    >
      {children}
    </span>
  );
}

export type BrowserTab = {
  label: string;
  active?: boolean;
  /** Renders the tab as a link. Omit for a tab that isn't navigable yet. */
  href?: string;
};

export type BrowserFrameProps = {
  tabs?: BrowserTab[];
  /** Bookmarks-bar entries. Inert labels until routing exists. */
  nav?: string[];
  /** Right side of the tab strip, before the window controls. */
  status?: React.ReactNode;
  /** Animate clouds and sparkles on the desktop wallpaper. */
  wallpaper?: boolean;
  /** Status-bar content. `null` hides the bar. */
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export function BrowserFrame({
  wallpaper = true,
  tabs = [{ label: "Design System", active: true }],
  nav = [],
  status,
  footer,
  children,
}: BrowserFrameProps) {
  return (
    <div className="relative h-dvh overflow-hidden bg-mint p-4 sm:p-8 lg:p-12">
      {/* Desktop wallpaper. Sits behind the window, which is why the frame
          below is explicitly positioned — otherwise it would paint under it. */}
      <BackgroundGrid clouds={wallpaper} sparkles={wallpaper} />

      <PixelFrame
        notch={6}
        border={3}
        className="relative h-full"
        innerClassName="flex h-full flex-col"
      >
        {/* ---- Tab strip + window controls ------------------------------ */}
        <div className="flex shrink-0 items-end gap-1.5 bg-mint-soft px-3 pt-2">
          {tabs.map((t) => {
            const className = cn(
              "pixel-clip type-hud flex items-center gap-2 border-2 border-ink border-b-0 px-3 py-2 transition-colors duration-150",
              t.active
                ? "bg-paper text-ink"
                : t.href
                  ? "bg-mint text-slate hover:bg-mint-soft hover:text-ink"
                  : "cursor-default bg-mint text-slate",
            );
            const style = { ["--notch" as string]: "3px" };

            // Navigable tabs get TabMark, which turns into a blinking block
            // while the route loads. Without it a slow transition — an
            // uncompiled route in dev, a poor connection in production — looks
            // like a tab that simply does not work.
            return t.href && !t.active ? (
              <Link key={t.label} href={t.href} className={className} style={style}>
                <TabMark active={false} />
                {t.label}
              </Link>
            ) : (
              <span key={t.label} className={className} style={style}>
                <Star
                  size={9}
                  className={cn("shrink-0", t.active ? "text-ink" : "text-mute")}
                />
                {t.label}
              </span>
            );
          })}
          <span
            aria-hidden
            className="pixel-clip mb-0 flex size-7 cursor-default items-center justify-center border-2 border-ink border-b-0 bg-mint text-slate"
            style={{ ["--notch" as string]: "2px" }}
          >
            <Plus size={12} />
          </span>

          <span className="ml-auto flex shrink-0 items-center gap-3 pb-2.5">
            {status}
            <WindowDots />
            <Sprig size={15} className="text-ink" />
          </span>
        </div>
        <div aria-hidden className="h-0.5 shrink-0 bg-ink" />

        {/* ---- Toolbar --------------------------------------------------
            No address bar. The long speak.exe/… URL was the noisiest line in
            the chrome and told the user nothing the tab did not already say.
            The navigation keys stay, since they are what makes it a browser. */}
        {nav.length > 0 && (
          <>
            <div className="flex shrink-0 items-center gap-2 px-3 py-2">
              <ToolButton label="Back" dim>
                <ChevronLeft size={14} />
              </ToolButton>
              <ToolButton label="Forward" dim>
                <ChevronRight size={14} />
              </ToolButton>
              <ToolButton label="Reload">
                <RotateCw size={13} />
              </ToolButton>

              <span aria-hidden className="mx-1 h-5 w-0.5 bg-ink" />

              <div className="hidden min-w-0 items-center gap-1 sm:flex">
                {nav.map((item) => (
                  <span
                    key={item}
                    className="type-hud pixel-clip cursor-default px-2.5 py-1.5 text-slate transition-colors duration-150 hover:bg-ink hover:text-mint"
                    style={{ ["--notch" as string]: "2px" }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
        <div aria-hidden className="h-0.5 shrink-0 bg-ink" />

        {/* ---- Viewport -------------------------------------------------- */}
        <div className="relative min-h-0 flex-1 bg-mint-mist">{children}</div>

        {/* ---- Status bar ------------------------------------------------ */}
        {footer !== null && (
          <>
            <div aria-hidden className="h-0.5 shrink-0 bg-ink" />
            <div className="flex shrink-0 items-center justify-between gap-4 px-3 py-1.5">
              {footer ?? (
                <>
                  <span className="type-hud text-slate">Done</span>
                  <span className="type-hud text-slate">v0.1.0</span>
                </>
              )}
            </div>
          </>
        )}
      </PixelFrame>
    </div>
  );
}