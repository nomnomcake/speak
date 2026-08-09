"use client";

import * as React from "react";
import { Panel, PixelFrame, ToolGlyph } from "@/components/ui";
import type { ToolGlyphName } from "@/components/ui";
import { cn } from "@/lib/utils";
import { primarySearchTerm, researchQuery, type Topic } from "@/lib/topics";

/**
 * ResearchToolbox — the utility palette on the research desk.
 *
 * A second window inside the research window, which is the correct shape for
 * this: on a real desktop of the era, tools lived in a small floating palette
 * you rolled up when it was in the way, not in a navigation bar.
 *
 * Every button is a search for *this topic*, not a link to a homepage. Sending
 * someone to wikipedia.org during a timed 15 minutes and expecting them to
 * retype the title is a tax on the exact minutes the session is measuring.
 *
 * Opens in a new tab, always. This screen holds a running timer and unsaved
 * notes state; navigating it away to read a paper would be a data loss bug
 * dressed up as a link.
 */

type Tool = {
  label: string;
  glyph: ToolGlyphName;
  /** What the destination is for, in the user's terms. Shown on hover. */
  hint: string;
  url: (query: string, topic: Topic) => string;
};

const TOOLS: Tool[] = [
  {
    label: "Wikipedia",
    glyph: "book",
    hint: "Orientation — what this is, and what it connects to",
    // One term, unlike the rest: Wikipedia resolves an article name, and the
    // second term only pushes it off the page it would have landed on.
    url: (_query, topic) =>
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(primarySearchTerm(topic))}`,
  },
  {
    label: "Google",
    glyph: "magnifier",
    hint: "The general sweep — explainers, blogs, arguments",
    url: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    label: "Scholar",
    glyph: "mortarboard",
    hint: "The literature — who actually established this",
    url: (query) =>
      `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
  },
  {
    label: "PubMed",
    glyph: "cross",
    hint: "Biomedical papers, where the topic is a health claim",
    url: (query) =>
      `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`,
  },
  {
    label: "YouTube",
    glyph: "screen",
    hint: "Someone explaining it out loud — which is the task",
    url: (query) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  },
];

/** The ▾ / ▸ mark in the title bar, drawn rather than typed so it steps. */
function ShadeCaret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 7 7"
      width={11}
      height={11}
      shapeRendering="crispEdges"
      aria-hidden
      // Rotation rather than a second sprite: one glyph, and the turn reads as
      // the same control moving instead of two icons swapping.
      className={cn(
        "transition-transform duration-200 ease-pixel",
        open ? "rotate-90" : "rotate-0",
      )}
    >
      <rect x="2" y="0" width="1" height="7" fill="currentColor" />
      <rect x="3" y="1" width="1" height="5" fill="currentColor" />
      <rect x="4" y="2" width="1" height="3" fill="currentColor" />
      <rect x="5" y="3" width="1" height="1" fill="currentColor" />
    </svg>
  );
}

export function ResearchToolbox({
  topic,
  className,
  // Back to rolled up, now that the panel holds only tools again. It was opened
  // while it also carried the topic's sources, since collapsing away a screen's
  // only reading list makes it look like there isn't one. Five search buttons
  // are not a reading list, and the roll-down is the point of the panel.
  defaultOpen = false,
}: {
  topic: Topic;
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const query = researchQuery(topic);
  const bodyId = React.useId();

  return (
    <Panel
      chrome="window"
      notch={4}
      className={className}
      title={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={bodyId}
          // The whole title bar is the control, the way a window shade works.
          // A small chevron hit area would be the one part of a panel about
          // saving time that costs the user a careful click.
          className="type-caps -m-1 flex items-center gap-2 p-1 text-left transition-colors duration-150 hover:text-mint-shade"
        >
          <ShadeCaret open={open} />
          Research toolbox
        </button>
      }
      // No sprig: it sits where the caret already draws the eye, and two marks
      // in one small bar reads as clutter rather than decoration.
      sprig={false}
      flush
    >
      {/* The bare wrapper is load-bearing — do not collapse it into the row
          below. `window-shade > *` clips its child's *content*, but padding is
          not content: a padded direct child keeps `p-3` alive at 0fr and leaves
          a 24px strip of the toolbox permanently open. The wrapper takes the
          clipping with nothing to leak, and the padding lives one level in. */}
      <div id={bodyId} className="window-shade" data-open={open} inert={!open}>
        <div>
          <div className="flex flex-wrap gap-2 p-3">
            {TOOLS.map((tool) => (
              <PixelFrame
                key={tool.label}
                notch={3}
                border={2}
                shadow={2}
                interactive
                tone="mist"
                className="flex-1"
                innerClassName="h-full"
              >
                <a
                  href={tool.url(query, topic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tool.hint}
                  // `tabIndex` follows `open` so a rolled-up toolbox is not
                  // five invisible tab stops. The shade clips them out of
                  // sight but keyboard focus would still walk into them.
                  tabIndex={open ? undefined : -1}
                  aria-hidden={!open}
                  className="type-hud flex h-full min-w-20 flex-col items-center justify-center gap-2 px-3 py-3 text-slate transition-colors duration-150 hover:text-ink"
                >
                  <ToolGlyph name={tool.glyph} unit={2} />
                  {tool.label}
                </a>
              </PixelFrame>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
