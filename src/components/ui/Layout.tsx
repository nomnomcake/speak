import * as React from "react";
import { cn } from "@/lib/utils";
import { BackgroundGrid } from "./BackgroundGrid";
import { BrowserFrame, type BrowserTab } from "./BrowserFrame";
import { Badge } from "./Badge";

/**
 * Layout — the shell every screen mounts into.
 *
 * The whole product lives inside a fake retro browser: chrome on top, a
 * scrolling viewport beneath it, and the cloud field painted inside that
 * viewport rather than behind the page. Because the chrome is fixed and only
 * the viewport scrolls, the toolbar stays put the way a real browser's does.
 *
 * Nav items are inert until routing lands in the next phase — they are
 * rendered as bookmark labels rather than links so nothing dead-ends.
 */

export type LayoutProps = {
  appName?: string;
  url?: string;
  tabs?: BrowserTab[];
  nav?: string[];
  /** Right side of the title bar. */
  status?: React.ReactNode;
  /** Status-bar content. Pass `null` to hide it. */
  footer?: React.ReactNode;
  /** Calmer background for dense screens. */
  quietBackground?: boolean;
  className?: string;
  children: React.ReactNode;
};

const DEFAULT_NAV = ["Brief", "Session", "Archive", "Settings"];

export function Layout({
  appName = "SPEAK.EXE",
  url = "speak.exe/design-system",
  tabs,
  nav = DEFAULT_NAV,
  status,
  footer,
  quietBackground = false,
  className,
  children,
}: LayoutProps) {
  return (
    <BrowserFrame
      appName={appName}
      url={url}
      tabs={tabs}
      nav={nav}
      status={status ?? <Badge tone="mint">Ready</Badge>}
      footer={footer}
    >
      {/* The sky is painted into the viewport, so it stays put while the page
          scrolls over it — the same effect as a fixed background image. */}
      <BackgroundGrid clouds={!quietBackground} sparkles={!quietBackground} />

      <div className="absolute inset-0 overflow-x-hidden overflow-y-auto">
        <main
          className={cn(
            "mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8",
            className,
          )}
        >
          {children}
        </main>
      </div>
    </BrowserFrame>
  );
}