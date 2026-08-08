"use client";

import { Star } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/**
 * TabMark — the glyph at the head of a browser tab.
 *
 * Normally a star. While the tab's navigation is pending it becomes a blinking
 * block, so a slow transition reads as working rather than broken. In dev that
 * matters a lot: Next compiles a route the first time it is visited, which can
 * take several seconds during which nothing on screen would otherwise change.
 *
 * The block is the same 9px as the star on purpose — swapping in a spinner
 * would resize the tab mid-click and shift the whole strip.
 *
 * Must be rendered inside a `Link`; `useLinkStatus` reads that Link's state,
 * which is why this is a component rather than a hook call in BrowserFrame.
 */
export function TabMark({ active = false }: { active?: boolean }) {
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

  return (
    <Star
      size={9}
      className={cn("shrink-0", active ? "text-ink" : "text-mute")}
    />
  );
}
