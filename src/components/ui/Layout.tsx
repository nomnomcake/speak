import * as React from "react";
import { cn } from "@/lib/utils";
import { BackgroundGrid } from "./BackgroundGrid";
import { PixelFrame } from "./PixelFrame";
import { Badge } from "./Badge";

/**
 * Layout — the desktop shell every screen mounts into.
 *
 * Menu bar on top, status bar at the bottom, animated field behind. Content is
 * capped at 1280px and gutter-padded on the 4px scale so every page shares the
 * same rhythm.
 *
 * Nav items are inert until routing lands in the next phase — they are rendered
 * as static labels rather than links so nothing dead-ends.
 */

export type LayoutProps = {
  /** Left label in the menu bar. */
  appName?: string;
  nav?: string[];
  /** Right side of the menu bar. */
  status?: React.ReactNode;
  /** Bottom status bar content. Pass `null` to hide it. */
  footer?: React.ReactNode;
  /** Calmer background for dense screens. */
  quietBackground?: boolean;
  className?: string;
  children: React.ReactNode;
};

const DEFAULT_NAV = ["Brief", "Session", "Archive", "Settings"];

export function Layout({
  appName = "SPEAK.EXE",
  nav = DEFAULT_NAV,
  status,
  footer,
  quietBackground = false,
  className,
  children,
}: LayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <BackgroundGrid clouds={!quietBackground} sparkles={!quietBackground} />

      <header className="px-4 pt-4 sm:px-8 sm:pt-6">
        <PixelFrame
          notch={4}
          border={3}
          innerClassName="flex items-center gap-4 px-3 py-2 sm:px-4"
        >
          <span className="type-caps shrink-0">{appName}</span>

          <div aria-hidden className="h-5 w-0.5 shrink-0 bg-ink" />

          <nav className="hidden min-w-0 flex-1 items-center gap-1 sm:flex">
            {nav.map((item) => (
              <span
                key={item}
                className={cn(
                  "type-hud pixel-clip cursor-default px-2.5 py-1.5 text-slate",
                  "transition-colors duration-150 hover:bg-ink hover:text-mint",
                )}
                style={{ ["--notch" as string]: "2px" }}
              >
                {item}
              </span>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {status ?? <Badge tone="mint">Ready</Badge>}
          </div>
        </PixelFrame>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-8 sm:py-8",
          className,
        )}
      >
        {children}
      </main>

      {footer !== null && (
        <footer className="px-4 pb-4 sm:px-8 sm:pb-6">
          <PixelFrame
            notch={3}
            border={2}
            innerClassName="flex items-center justify-between gap-4 px-3 py-1.5"
          >
            {footer ?? (
              <>
                <span className="type-hud text-slate">
                  Speak — Speaking Simulator
                </span>
                <span className="type-hud text-slate">v0.1.0</span>
              </>
            )}
          </PixelFrame>
        </footer>
      )}
    </div>
  );
}