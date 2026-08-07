import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Printout — continuous-feed paper carrying one or more sections.
 *
 * Sources and angles share one sheet rather than living in two differently
 * styled boxes. On real fanfold stock the sprocket holes and green bars are
 * properties of the *paper*, not of the rows printed on it — they run at a
 * fixed pitch regardless of content. Drawing them as backgrounds rather than
 * per-row elements is both more faithful and more robust: a row that wraps to
 * two lines simply covers two bands, instead of knocking every hole below it
 * out of alignment.
 */

/** Text line height, and the height of one green bar. */
const LINE = 24;
/** Sprocket pitch — one hole every two lines, as on half-inch tractor feed. */
const HOLE_PITCH = LINE * 2;

export type PrintoutRow = {
  label: string;
  href?: string;
  meta?: string;
};

export type PrintoutSection = {
  title: string;
  rows: PrintoutRow[];
};

function SprocketStrip({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "w-6 shrink-0 bg-mint-mist",
        side === "left"
          ? "border-r-2 border-dashed border-mint-shade"
          : "border-l-2 border-dashed border-mint-shade",
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at center, var(--color-paper) 3.5px, var(--color-mint-shade) 3.5px, var(--color-mint-shade) 5px, transparent 5px)",
        backgroundSize: `100% ${HOLE_PITCH}px`,
        backgroundRepeat: "repeat-y",
        backgroundPosition: `center ${HOLE_PITCH / 2}px`,
      }}
    />
  );
}

export function Printout({
  sections,
  className,
}: {
  sections: PrintoutSection[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pixel-clip flex overflow-hidden border-2 border-ink bg-paper",
        className,
      )}
      style={{ ["--notch" as string]: "2px" }}
    >
      <SprocketStrip side="left" />

      <div
        className="min-w-0 flex-1"
        style={{
          // Green-bar stock: alternating bands at exactly one line each, so
          // printed lines land inside them.
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${LINE}px, var(--color-mint-mist) ${LINE}px, var(--color-mint-mist) ${LINE * 2}px)`,
          lineHeight: `${LINE}px`,
        }}
      >
        {sections.map((section, s) => (
          <section key={section.title}>
            {/* Printed section header, struck through the bands */}
            <h3
              className="type-hud bg-ink px-3 text-mint"
              style={{ lineHeight: `${LINE}px` }}
            >
              {section.title}
            </h3>

            <ul>
              {section.rows.map((row, i) => {
                const inner = (
                  <>
                    <span className="shrink-0 text-mute tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">{row.label}</span>

                    {/* Meta and icon are one group pinned to the first line's
                        height, so they stay on that line's baseline when the
                        label wraps instead of drifting apart. */}
                    {(row.meta || row.href) && (
                      <span
                        className="flex shrink-0 items-center gap-1.5"
                        style={{ height: LINE }}
                      >
                        {row.meta && (
                          <span className="type-hud hidden text-mute sm:block">
                            {row.meta}
                          </span>
                        )}
                        {row.href && (
                          <ExternalLink size={11} className="text-mint-shade" />
                        )}
                      </span>
                    )}
                  </>
                );

                return (
                  <li key={row.label} className="px-3 font-mono text-xs">
                    {row.href ? (
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 hover:bg-mint-soft"
                      >
                        {inner}
                      </a>
                    ) : (
                      <span className="flex gap-3">{inner}</span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Tear line between sections — the paper continues. */}
            {s < sections.length - 1 && (
              <div
                aria-hidden
                className="border-t-2 border-dashed border-mint-shade"
                style={{ height: LINE }}
              />
            )}
          </section>
        ))}
      </div>

      <SprocketStrip side="right" />
    </div>
  );
}
