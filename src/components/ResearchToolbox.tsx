"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
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
  // Open by default now that this panel carries the topic's own sources. It
  // replaced the dossier's list of them, and a screen whose only reading list
  // starts rolled up is a screen that looks like it has no reading list.
  defaultOpen = true,
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
      <div id={bodyId} className="window-shade" data-open={open}>
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
                  // `tabIndex` follows `open` so a rolled-up toolbox is not five
                  // invisible tab stops. The shade clips them out of sight but
                  // keyboard focus would still walk straight into them.
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

          {/* The topic's own references, which used to be the dossier's
              "Places to possibly start with". They belong with the tools
              rather than beside them: this panel is now the single answer to
              "where do I start", and a curated link and a search button are
              two answers to that one question, not two different questions.

              Kept below the buttons because they are narrower — these are the
              handful of sources already checked, the tools are everything
              else. */}
          {topic.references.length > 0 && (
            <>
              <div aria-hidden className="h-0.5 w-full bg-ink" />
              <h3 className="type-hud px-3 pt-3 pb-1 text-slate">
                Already filed
              </h3>
              <div className="divide-y divide-mint-soft">
                {topic.references.map((ref) => (
                  <a
                    key={ref.url}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={open ? undefined : -1}
                    aria-hidden={!open}
                    className="flex gap-3 px-3 py-2 font-mono text-xs transition-colors duration-150 hover:bg-mint-mist"
                  >
                    <span className="w-3 shrink-0 text-mint-shade">—</span>
                    <span className="min-w-0 flex-1 leading-relaxed text-graphite">
                      {ref.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 pt-0.5">
                      {ref.kind && (
                        <span className="type-hud hidden text-mute sm:block">
                          {ref.kind}
                        </span>
                      )}
                      <ExternalLink size={11} className="text-mint-shade" />
                    </span>
                  </a>
                ))}
              </div>
            </>
          )}

          <div className="mt-3 border-t-2 border-ink px-3 py-2">
            <span className="type-hud text-mute">
              Everything here opens in a new tab
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
