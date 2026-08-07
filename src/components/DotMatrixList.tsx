import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicReference } from "@/lib/topics";

/**
 * DotMatrixList — sources as continuous-feed printout.
 *
 * Sprocket holes down both edges, a perforated tear line inside each, and
 * alternating green-bar rows. Row height and hole pitch are the same constant,
 * which is what makes the holes line up with the rows instead of drifting —
 * the detail that separates this from a list with circles glued to it.
 */

const ROW = 40;

function Sprockets({ count, side }: { count: number; side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex w-6 shrink-0 flex-col bg-mint-mist",
        side === "left"
          ? "border-r-2 border-dashed border-mint-shade"
          : "border-l-2 border-dashed border-mint-shade",
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="flex items-center justify-center"
          style={{ height: ROW }}
        >
          <span className="block size-2 rounded-full border-2 border-mint-shade bg-paper" />
        </span>
      ))}
    </div>
  );
}

export function DotMatrixList({
  items,
  className,
}: {
  items: readonly TopicReference[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pixel-clip overflow-hidden border-2 border-ink bg-paper",
        className,
      )}
      style={{ ["--notch" as string]: "2px" }}
    >
      <div className="flex">
        <Sprockets count={items.length} side="left" />

        <ul className="min-w-0 flex-1">
          {items.map((ref, i) => (
            <li
              key={ref.url}
              // Green-bar stripes: the alternating tint that made fanfold
              // paper readable across a wide row.
              className={cn(i % 2 === 1 && "bg-mint-mist")}
              style={{ height: ROW }}
            >
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full items-center gap-3 px-3 font-mono text-xs"
              >
                <span className="shrink-0 text-mute tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate group-hover:bg-mint-soft">
                  {ref.label}
                </span>
                {ref.kind && (
                  <span className="type-hud hidden shrink-0 text-mute sm:block">
                    {ref.kind}
                  </span>
                )}
                <ExternalLink size={11} className="shrink-0 text-mint-shade" />
              </a>
            </li>
          ))}
        </ul>

        <Sprockets count={items.length} side="right" />
      </div>
    </div>
  );
}
