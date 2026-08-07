import { ExternalLink } from "lucide-react";
import { PixelFrame } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Dossier — the loose sheets filed behind the card.
 *
 * Deliberately quiet. An earlier version of this was full tractor-feed
 * printout: sprocket holes, green-bar stripes, dashed tear lines and inverted
 * header bars, all at once. Four textures competing in one panel, sitting
 * directly beside the catalogue card and fighting it for attention.
 *
 * The card is the object on this screen. Everything supporting it should
 * recede, so this is a typed sheet and nothing more: monospace, hairline rules,
 * generous spacing, one solid divider between sections.
 */

export type DossierRow = {
  label: string;
  href?: string;
  meta?: string;
};

export type DossierSection = {
  title: string;
  /** Numbered rows read as steps; unnumbered read as a reference list. */
  numbered?: boolean;
  rows: DossierRow[];
};

function Row({
  row,
  index,
  numbered,
}: {
  row: DossierRow;
  index: number;
  numbered: boolean;
}) {
  const inner = (
    <>
      <span className="w-6 shrink-0 text-mint-shade tabular-nums">
        {numbered ? String(index + 1).padStart(2, "0") : "—"}
      </span>

      <span className="min-w-0 flex-1 leading-relaxed text-graphite">
        {row.label}
      </span>

      {(row.meta || row.href) && (
        <span className="flex shrink-0 items-center gap-2 pt-0.5">
          {row.meta && (
            <span className="type-hud hidden text-mute sm:block">
              {row.meta}
            </span>
          )}
          {row.href && <ExternalLink size={11} className="text-mint-shade" />}
        </span>
      )}
    </>
  );

  const className = "flex gap-3 px-5 py-3 font-mono text-xs";

  return row.href ? (
    <a
      href={row.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        className,
        "transition-colors duration-150 hover:bg-mint-mist",
      )}
    >
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export function Dossier({
  sections,
  className,
}: {
  sections: DossierSection[];
  className?: string;
}) {
  return (
    <PixelFrame notch={4} border={2} className={className}>
      {sections.map((section, s) => (
        <section key={section.title}>
          {/* A solid rule between sections; hairlines within them. The weight
              difference is what groups the rows without boxing them. */}
          {s > 0 && <div aria-hidden className="h-0.5 w-full bg-ink" />}

          <h3 className="type-hud px-5 pt-4 pb-1 text-slate">
            {section.title}
          </h3>

          <div className="divide-y divide-mint-soft">
            {section.rows.map((row, i) => (
              <Row
                key={row.label}
                row={row}
                index={i}
                numbered={section.numbered ?? false}
              />
            ))}
          </div>

          {s === sections.length - 1 && <div className="h-2" />}
        </section>
      ))}
    </PixelFrame>
  );
}
