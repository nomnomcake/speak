"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkle } from "./PixelArt";

/**
 * AddressBar — the fake location field.
 *
 * Derived from the route rather than passed in. It used to be a `url` prop
 * threaded through Layout to every page, which meant it could disagree with
 * where you actually were; reading the router means it is right by
 * construction and a new page cannot forget to set it.
 *
 * The path is dressed rather than reported. `speak.exe/play` is the joke —
 * an executable serving pages — and a real pathname with query strings would
 * be the noisy line that got this removed the first time. Query parameters are
 * summarised, never printed.
 */

const NAMES: Record<string, string> = {
  "/": "home",
  "/play": "play",
  "/research": "research",
  "/session": "session",
  "/dashboard": "dashboard",
  "/archive": "archive",
  "/design-system": "design-system",
};

function PixelLock() {
  // A padlock small enough to read as a glyph rather than an icon. Purely
  // decorative — it is not claiming anything about a connection that does not
  // exist.
  return (
    <svg
      viewBox="0 0 7 8"
      width={9}
      height={10}
      shapeRendering="crispEdges"
      aria-hidden
      className="shrink-0 text-mint-shade"
    >
      <rect x="2" y="0" width="3" height="1" fill="currentColor" />
      <rect x="1" y="1" width="1" height="2" fill="currentColor" />
      <rect x="5" y="1" width="1" height="2" fill="currentColor" />
      <rect x="0" y="3" width="7" height="5" fill="currentColor" />
    </svg>
  );
}

export function AddressBar() {
  const pathname = usePathname() ?? "/";
  const params = useSearchParams();

  const name = NAMES[pathname] ?? pathname.replace(/^\//, "");
  const topic = params?.get("topic");

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div
        // px-3, not px-2.5: the inner padding was 10px against an 8px gap
        // after the padlock, so the icon had less room against the border than
        // it had against the text and read as pushed into the corner. The
        // field's own padding should be the larger of the two.
        className="pixel-clip flex min-w-0 flex-1 items-center gap-2 border-2 border-ink bg-paper px-3 py-1"
        style={{ ["--notch" as string]: "2px" }}
      >
        <PixelLock />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-graphite">
          <span className="text-mute">speak.exe/</span>
          {name}
          {/* The topic id, not the whole query string. Enough to tell two
              research pages apart without printing a URL nobody reads.

              The separator is spaced with margins rather than the literal
              spaces this used to carry. In a monospace face every space is a
              full character cell and the dot sits centred in one of its own,
              so " · " bought roughly a cell and a half either side — loose,
              and unevenly so, because the gap you see on each side depends on
              where the neighbouring glyph sits inside its own cell. Margins
              are symmetric by construction. */}
          {topic && (
            <span className="text-mute">
              {/* Nudged down as well as pulled in. A middle dot is drawn to sit
                  around the x-height midpoint, which places it above the
                  optical centre of a line of lowercase — so it reads as
                  floating rather than separating. */}
              <span className="mx-0.5 inline-block translate-y-[2px]">·</span>
              {topic}
            </span>
          )}
        </span>
        <Sparkle size={8} fill="currentColor" className="shrink-0 text-mint-deep" />
      </div>
    </div>
  );
}
