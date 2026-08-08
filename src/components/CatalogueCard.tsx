import {
  Brain,
  Cpu,
  FlaskConical,
  Hourglass,
  Lightbulb,
  Mic,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { PixelFrame, Paperclip, Stamp } from "@/components/ui";
import { Teletype } from "./Teletype";
import {
  RESEARCH_SECONDS,
  timingsFor,
  type Category,
  type Topic,
} from "@/lib/topics";

/**
 * One glyph per category. Keyed off the CATEGORIES union, so adding a category
 * is a compile error here rather than a silently missing icon.
 */
const CATEGORY_ICON: Record<Category, typeof Brain> = {
  science: FlaskConical,
  economics: TrendingUp,
  philosophy: Lightbulb,
  technology: Cpu,
  history: Hourglass,
  psychology: Brain,
  society: Users,
};

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
  const CategoryIcon = CATEGORY_ICON[topic.category];

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
            {/* Icons rather than a "Filed: economics" row. The category is
                worth a glance, not a labelled field, and the two durations are
                the only other facts that change what you do next. */}
            <div className="flex items-center gap-5 font-mono text-xs">
              <span
                className="flex items-center gap-2"
                title={`Filed under ${topic.category}`}
              >
                <CategoryIcon size={15} className="text-mint-shade" />
                <span className="sr-only">Filed under {topic.category}</span>
              </span>

              <span className="flex items-center gap-2" title="Research time">
                <Timer size={15} className="text-mint-shade" />
                {RESEARCH_SECONDS / 60}m
              </span>

              <span className="flex items-center gap-2" title="Talk length">
                <Mic size={15} className="text-mint-shade" />
                {timingsFor(topic).speakSeconds}s
              </span>
            </div>

            {/* One stamp only. The longhand stamp said the same thing as
                instruction 02, and a bare difficulty word stamped on a card
                does not say what it is measuring. */}
            <Stamp tone="alert" rotate={-4}>
              Difficulty: {topic.difficulty}
            </Stamp>
          </div>
        </div>
      </PixelFrame>
    </div>
  );
}
