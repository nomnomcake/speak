import * as React from "react";
import { cn } from "@/lib/utils";
import { BrowserFrame, type BrowserTab } from "./BrowserFrame";

/**
 * Layout — the shell every screen mounts into.
 *
 * The whole product lives inside a fake retro browser: chrome on top and a
 * scrolling viewport beneath it. Because the chrome is fixed and only the
 * viewport scrolls, the toolbar stays put the way a real browser's does.
 *
 * The cloud field is the desktop wallpaper behind the window, not the page
 * inside it, so the viewport is a plain white document. Clouds still appear
 * inside individual panels via `Panel sky`.
 *
 * Nav items are inert until routing lands in the next phase — they are
 * rendered as bookmark labels rather than links so nothing dead-ends.
 */

export type LayoutProps = {
  url?: string;
  tabs?: BrowserTab[];
  nav?: string[];
  /** Right side of the tab strip. Empty by default. */
  status?: React.ReactNode;
  /** Status-bar content. Pass `null` to hide it. */
  footer?: React.ReactNode;
  /** Still the wallpaper — drops its clouds and sparkles. */
  quietBackground?: boolean;
  className?: string;
  children: React.ReactNode;
};

const DEFAULT_NAV = ["Brief", "Session", "Archive", "Settings"];

export function Layout({
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
      url={url}
      tabs={tabs}
      nav={nav}
      status={status}
      footer={footer}
      wallpaper={!quietBackground}
    >
      <div className="pixel-scroll absolute inset-0 overflow-x-hidden overflow-y-auto">
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