"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";
import { TabGlyph, type TabGlyphName } from "./PixelArt";

/**
 * TabMark — the glyph at the head of a browser tab.
 *
 * Normally the destination's own sprite. While the tab's navigation is pending
 * it becomes a blinking block, so a slow transition reads as working rather
 * than broken. In dev that matters a lot: Next compiles a route the first time
 * it is visited, which can take several seconds during which nothing on screen
 * would otherwise change.
 *
 * The block is the same 9px as the glyph on purpose — swapping in a spinner
 * would resize the tab mid-click and shift the whole strip.
 *
 * It used to be a star on every tab, which is decoration rather than
 * wayfinding: one icon repeated five times carries no information, so the row
 * read as five identical things with different words on them. The star is kept
 * only as the fallback for a tab that has no sprite of its own.
 *
 * Must be rendered inside a `Link`; `useLinkStatus` reads that Link's state,
 * which is why this is a component rather than a hook call in BrowserFrame.
 */
export function TabMark({
  active = false,
  icon,
}: {
  active?: boolean;
  icon?: TabGlyphName;
}) {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <span
        aria-label="Loading"
        role="status"
        className="animate-blink block size-[9px] shrink-0 bg-current"
      />
    );
  }

  // No glyph rather than a stand-in. `icon ?? "home"` would draw a house on
  // any tab that had not been given a sprite, which is worse than the star it
  // replaced — a wrong icon reads as a claim, a missing one reads as nothing.
  if (!icon) return null;

  return (
    <TabGlyph
      name={icon}
      unit={1}
      className={cn("shrink-0", active ? "text-ink" : "text-mute")}
    />
  );
}
