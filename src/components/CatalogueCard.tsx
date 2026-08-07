import { PixelFrame, Paperclip, Stamp } from "@/components/ui";
import { Teletype } from "./Teletype";
import type { Topic } from "@/lib/topics";

/**
 * CatalogueCard — the card pulled from the filing cabinet.
 *
 * The Play screen searches a drawer of files; this is the one it handed over,
 * so it is drawn as the same physical object rather than as a content panel.
 * That continuity is the point — no other app's research screen is the back
 * half of its own picker.
 *
 * Typewriter face throughout. This bends the typography rule that reserves
 * Geist Mono for numerics, and does so deliberately: on a catalogue card,
 * monospace *is* the typewriter, and setting it in Outfit would make it a web
 * page again.
 */

export function CatalogueCard({
  topic,
  fileName,
}: {
  topic: Topic;
  /** The generated filename this topic was filed under, e.g. SOC_002.TXT. */
  fileName: string;
}) {
  return (
    <div className="relative">
      {/* Desk objects, sparingly: one clip, hooked over the top edge. */}
      <Paperclip
        size={16}
        className="absolute -top-3 right-8 z-10 drop-shadow-none"
      />

      <PixelFrame
        tone="mist"
        notch={4}
        shadow={5}
        // Barely off-square, so it reads as placed rather than laid out.
        className="rotate-[-0.35deg]"
        innerClassName="relative px-6 py-5 sm:px-8"
      >
        {/* Punched hole */}
        <span
          aria-hidden
          className="absolute top-4 left-4 block size-4 rounded-full border-2 border-ink bg-paper"
        />

        <div className="pl-8">
          <div className="type-hud text-mute">Catalogue card · {fileName}</div>

          <h1 className="mt-2 font-mono text-xl leading-tight font-bold tracking-tight uppercase sm:text-2xl">
            {topic.title}
          </h1>

          <div aria-hidden className="mt-3 h-0.5 w-full bg-ink" />

          <Teletype
            text={topic.researchPrompt}
            className="mt-3 max-w-3xl font-mono text-sm leading-relaxed text-graphite"
          />

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <dl className="space-y-1 font-mono text-xs">
              <div className="flex gap-2">
                <dt className="type-hud w-20 text-mute">Filed</dt>
                <dd className="uppercase">{topic.category}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="type-hud w-20 text-mute">Cross-ref</dt>
                <dd className="uppercase">
                  {topic.references.length} source
                  {topic.references.length === 1 ? "" : "s"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="type-hud w-20 text-mute">Tags</dt>
                <dd className="uppercase">{topic.tags.join(" · ")}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <Stamp tone="alert" rotate={-4}>
                {topic.difficulty}
              </Stamp>
              <Stamp tone="ink" rotate={2.5}>
                Notes — longhand only
              </Stamp>
            </div>
          </div>
        </div>
      </PixelFrame>
    </div>
  );
}
