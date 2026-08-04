import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Spinner — eight pixel blocks on a ring, rotating in 8 discrete steps.
 *
 * Stepped rather than continuous: a smooth spin would be the only
 * non-quantised motion in the product and would read as foreign.
 */

const SIZES = {
  sm: { box: 16, dot: 3 },
  md: { box: 24, dot: 4 },
  lg: { box: 40, dot: 6 },
} as const;

export type SpinnerProps = {
  size?: keyof typeof SIZES;
  /** Block colour. `current` inherits the surrounding text colour. */
  tone?: "ink" | "paper" | "mint" | "current";
  label?: string;
  className?: string;
};

const toneFill: Record<NonNullable<SpinnerProps["tone"]>, string> = {
  ink: "bg-ink",
  paper: "bg-paper",
  mint: "bg-mint-deep",
  current: "bg-current",
};

export function Spinner({
  size = "md",
  tone = "ink",
  label = "Loading",
  className,
}: SpinnerProps) {
  const { box, dot } = SIZES[size];
  const radius = box / 2 - dot / 2;

  return (
    <span
      role="status"
      aria-label={label}
      className={cn("relative inline-block animate-step-spin", className)}
      style={{ width: box, height: box }}
    >
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <span
            key={i}
            className={cn("absolute block", toneFill[tone])}
            style={{
              width: dot,
              height: dot,
              // Quantised to whole pixels so blocks never land on half-pixels.
              left: Math.round(box / 2 - dot / 2 + Math.cos(angle) * radius),
              top: Math.round(box / 2 - dot / 2 + Math.sin(angle) * radius),
              opacity: 0.2 + (i / 8) * 0.8,
            }}
          />
        );
      })}
    </span>
  );
}