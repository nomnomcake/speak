import * as React from "react";
import { cn } from "@/lib/utils";
import { Panel } from "./Panel";
import type { Tone } from "@/lib/tokens";

/**
 * StatTile — a titled window showing one headline number.
 *
 * The number is always Geist Mono and tabular, per the typography rules: any
 * figure the user might compare against another figure has to line up.
 * `children` is a slot beneath the value for a meter, a strip, or any small
 * visual that explains it.
 */

export type StatTileProps = {
  title: React.ReactNode;
  value: React.ReactNode;
  /** Short unit shown next to the value — "days", "completed". */
  unit?: React.ReactNode;
  /** Small print under the tile. */
  footnote?: React.ReactNode;
  /** Right side of the title bar. */
  actions?: React.ReactNode;
  tone?: Tone;
  className?: string;
  children?: React.ReactNode;
};

export function StatTile({
  title,
  value,
  unit,
  footnote,
  actions,
  tone = "paper",
  className,
  children,
}: StatTileProps) {
  const inverted = tone === "ink";

  return (
    <Panel
      chrome="inline"
      title={title}
      tone={tone}
      actions={actions}
      className={cn("h-full", className)}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl leading-none tabular-nums">
            {value}
          </span>
          {unit && (
            <span
              className={cn(
                "type-caps",
                inverted ? "text-mint-soft" : "text-slate",
              )}
            >
              {unit}
            </span>
          )}
        </div>

        {children}

        {footnote && (
          <div
            className={cn(
              "type-hud",
              inverted ? "text-mint" : "text-slate",
            )}
          >
            {footnote}
          </div>
        )}
      </div>
    </Panel>
  );
}
