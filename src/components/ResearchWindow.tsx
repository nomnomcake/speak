import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Divider, Panel } from "@/components/ui";
import { CatalogueCard } from "./CatalogueCard";
import { CountdownTimer } from "./CountdownTimer";
import { Printout } from "./Printout";
import { fileNameFor, timingsFor, type Topic } from "@/lib/topics";

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
 */

const RESEARCH_MINUTES = 15;

export function ResearchWindow({ topic }: { topic: Topic }) {
  const timings = timingsFor(topic);

  return (
    <Panel
      chrome="window"
      notch={6}
      title="RESEARCH.EXE"
      actions={<span className="type-hud text-slate">{RESEARCH_MINUTES} min</span>}
      footer={
        <>
          <span className="type-hud text-slate">
            Notes go on paper · the timer saves itself
          </span>
          <span className="type-hud text-slate">
            Speaks for {timings.speakSeconds}s
          </span>
        </>
      }
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
          {/* Sources and angles share one sheet. Two separately styled boxes
              side by side read as two systems; one printout with two printed
              sections reads as output from the same machine. */}
          <Printout
            className="lg:col-span-2"
            sections={[
              {
                title: "Sources · continuous feed",
                rows: topic.references.map((ref) => ({
                  label: ref.label,
                  href: ref.url,
                  meta: ref.kind,
                })),
              },
              {
                title: "Angles on file",
                rows: topic.suggestedAngles.map((angle) => ({ label: angle })),
              },
            ]}
          />

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
