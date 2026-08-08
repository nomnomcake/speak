import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Divider, Panel } from "@/components/ui";
import { CatalogueCard } from "./CatalogueCard";
import { CountdownTimer } from "./CountdownTimer";
import { Dossier } from "./Dossier";
import { ResearchToolbox } from "./ResearchToolbox";
import {
  RESEARCH_SECONDS,
  fileNameFor,
  studySearchUrl,
  type Topic,
} from "@/lib/topics";

/**
 * ResearchWindow — the research phase as a desktop application.
 *
 * The screen is a desk rather than a page: the card pulled from the cabinet,
 * a printout of sources, a memo of angles, and a timer. Each is drawn as the
 * object it represents, which is what keeps this from being a generic retro
 * theme laid over a form.
 *
 * The topic title is shown here, unlike everywhere else in the product: you
 * cannot research what you cannot see. Sealed means "until selected", not
 * "until the readout".
 *
 * `topic.suggestedAngles` is deliberately not rendered. Handing the user three
 * ready-made framings does the synthesis the session is meant to measure; the
 * angles exist for the scorer, to judge whether the speaker found one of them
 * on their own or something better. That slot holds the instructions instead.
 */

const RESEARCH_MINUTES = RESEARCH_SECONDS / 60;

export function ResearchWindow({ topic }: { topic: Topic }) {
  return (
    // No title bar. The card names what this is, and the timer already shows
    // the 15 minutes the header was repeating.
    <Panel
      chrome="window"
      notch={6}
      // No status bar. It restated the instructions in worse words, and the
      // card's icons already carry the two durations.
    >
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            href="/play"
            iconLeft={<ArrowLeft size={13} />}
          >
            Folders
          </Button>
          <div className="ml-auto">
            <Button size="sm" iconRight={<ArrowRight size={13} />}>
              Ready to speak
            </Button>
          </div>
        </div>

        <Divider />

        {/* The card pulled from the drawer */}
        <CatalogueCard topic={topic} fileName={fileNameFor(topic)} />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
          {/* Sources and angles share one sheet so they read as one thing,
              kept quiet so the card stays the object on this screen. */}
          <Dossier
            sections={[
              {
                title: "What to do",
                numbered: true,
                rows: [
                  {
                    label:
                      "You have 15 minutes to research this properly. Read past the first result.",
                  },
                  {
                    label: "Take notes on paper, by hand.",
                  },
                  {
                    // "One minute" is written out rather than interpolated
                    // because TIMINGS now fixes every talk at 60s. If that
                    // ever varies again, this line has to change with it.
                    label:
                      "When time's up, talk about it for one minute using your notes.",
                  },
                  {
                    label:
                      "Don't write out what you're going to say. You should still be working it out while you talk.",
                  },
                ],
              },
              {
                title: "Places to possibly start with",
                rows: [
                  ...topic.references.map((ref) => ({
                    label: ref.label,
                    href: ref.url,
                    meta: ref.kind,
                  })),
                  // Always last: the encyclopaedic entries orient you, this is
                  // where you go once they stop being enough.
                  {
                    label: "Search the studies on this",
                    href: studySearchUrl(topic),
                    meta: "scholar",
                  },
                ],
              },
            ]}
          />

            {/* Below the sheet, not above it: the instructions are what to do,
                the toolbox is how. Rolled up by default so the screen still
                opens on the card and the brief. */}
            <ResearchToolbox topic={topic} />
          </div>

          <CountdownTimer
            storageKey={`research:${topic.id}:timer`}
            totalSeconds={RESEARCH_MINUTES * 60}
            className="lg:sticky lg:top-2 lg:self-start"
          />
        </div>
      </div>
    </Panel>
  );
}
