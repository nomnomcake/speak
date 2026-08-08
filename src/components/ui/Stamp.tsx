import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Stamp — a rubber-stamped label.
 *
 * Sits at a slight angle with a heavy outline, in the desaturated alert red
 * that stands in for stamp ink. The tilt is the whole trick: a level stamp
 * reads as a badge, an angled one reads as something a person pressed onto the
 * card by hand.
 *
 * Deliberately not `Badge`. Badges are UI chrome; this is a mark on an object.
 */

type StampTone = "ink" | "alert" | "mint";

const TONE: Record<StampTone, string> = {
  ink: "border-ink text-ink",
  alert: "border-alert text-alert",
  mint: "border-mint-shade text-mint-shade",
};

export type StampProps = {
  tone?: StampTone;
  /** Degrees of tilt. Small values only — this is a stamp, not a sticker. */
  rotate?: number;
  /** Hover text. A stamp is terse by nature; this is where the long form goes. */
  title?: string;
  className?: string;
  children: React.ReactNode;
};

export function Stamp({
  tone = "alert",
  rotate = -4,
  title,
  className,
  children,
}: StampProps) {
  return (
    <span
      title={title}
      className={cn(
        "type-hud inline-block border-[3px] px-2 py-1 leading-none",
        // Ink never prints perfectly solid.
        "opacity-85",
        TONE[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
