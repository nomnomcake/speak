import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Badge, Button, Divider, Panel, PixelFrame } from "@/components/ui";
import { CountdownTimer } from "./CountdownTimer";
import { PaperNotes } from "./PaperNotes";
import { timingsFor, type Topic } from "@/lib/topics";

/**
 * ResearchWindow — the research phase as a desktop application.
 *
 * Title bar, toolbar, a notepad, a timer widget and a resources sidebar. The
 * topic title is shown here, unlike everywhere else in the product: you cannot
 * research what you cannot see. Sealed means "until selected", not "until the
 * readout".
 *
 * Notes are taken on real paper, not typed — see PaperNotes for why. Storage
 * keys are namespaced per topic, so switching topics keeps its own timer
 * rather than inheriting the last one's.
 */

const RESEARCH_MINUTES = 15;

export function ResearchWindow({ topic }: { topic: Topic }) {
  const timings = timingsFor(topic);

  return (
    <Panel
      chrome="window"
      notch={6}
      title="RESEARCH.EXE"
      actions={
        <span className="type-hud text-slate">
          {RESEARCH_MINUTES} min
        </span>
      }
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
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="secondary" href="/play" iconLeft={<ArrowLeft size={13} />}>
            Folders
          </Button>
          <div aria-hidden className="hidden h-6 w-0.5 bg-ink sm:block" />
          <Badge tone="mint">{topic.category}</Badge>
          <Badge tone="paper">{topic.difficulty}</Badge>
          <div className="ml-auto">
            <Button size="sm" iconRight={<ArrowRight size={13} />}>
              Ready to speak
            </Button>
          </div>
        </div>

        <Divider />

        {/* Topic */}
        <PixelFrame notch={4} border={2} innerClassName="space-y-2 p-4">
          <h1 className="text-2xl leading-tight font-bold sm:text-3xl">
            {topic.title}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-graphite">
            {topic.researchPrompt}
          </p>
        </PixelFrame>

        {/* Notes + sidebar */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PaperNotes storageKey={`research:${topic.id}:paper`} />
          </div>

          <div className="space-y-4">
            <CountdownTimer
              storageKey={`research:${topic.id}:timer`}
              totalSeconds={RESEARCH_MINUTES * 60}
            />

            {/* Angles */}
            <PixelFrame notch={4} border={2} innerClassName="space-y-3 p-4">
              <span className="type-hud text-slate">Angles to consider</span>
              <ol className="space-y-2">
                {topic.suggestedAngles.map((angle, i) => (
                  <li key={angle} className="flex gap-2 text-sm leading-snug">
                    <span className="font-mono text-xs text-mint-shade tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-graphite">{angle}</span>
                  </li>
                ))}
              </ol>
            </PixelFrame>

            {/* References */}
            <PixelFrame notch={4} border={2} innerClassName="space-y-3 p-4">
              <span className="type-hud text-slate">Resources</span>
              <ul className="space-y-2">
                {topic.references.map((ref) => (
                  <li key={ref.url}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 text-sm leading-snug"
                    >
                      <ExternalLink
                        size={12}
                        className="mt-1 shrink-0 text-mint-shade"
                      />
                      <span className="underline decoration-mint-deep decoration-2 underline-offset-2 group-hover:bg-mint-soft">
                        {ref.label}
                      </span>
                    </a>
                    {ref.kind && (
                      <span className="type-hud ml-5 text-mute">{ref.kind}</span>
                    )}
                  </li>
                ))}
              </ul>
            </PixelFrame>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {topic.tags.map((tag) => (
                <Badge key={tag} tone="paper">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
