"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/tokens";

/**
 * ProgressBar — the reference's skill meter, generalised.
 *
 * The pill is the one intentionally rounded shape in the system; in the
 * reference it is the only curve on the page, which is exactly what makes it
 * read as a gauge rather than a container. `segmented` and `bar` variants keep
 * the hard-edged geometry for denser readouts.
 *
 * `invert` is required on ink-toned surfaces — the default ink-on-paper
 * treatment is invisible against a black fill.
 */

type Variant = "pill" | "segmented" | "bar";

export type ProgressBarProps = {
  /** 0–1. Values outside the range are clamped. */
  value: number;
  variant?: Variant;
  label?: React.ReactNode;
  /** Show the numeric percentage on the right of the label row. */
  showValue?: boolean;
  /** Block count for `segmented`. */
  segments?: number;
  /** Diagonal hatch fill instead of solid — for soft or estimated values. */
  hatch?: boolean;
  /** Flip to white-on-black for use inside `tone="ink"` surfaces. */
  invert?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const HEIGHT = { sm: "h-3", md: "h-4" } as const;

export function ProgressBar({
  value,
  variant = "pill",
  label,
  showValue = false,
  segments = 12,
  hatch = false,
  invert = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const filled = Math.round((pct / 100) * segments);

  const meter = (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={typeof label === "string" ? label : undefined}
      className="w-full"
    >
      {variant === "segmented" ? (
        <div className={cn("flex w-full gap-1", HEIGHT[size])}>
          {Array.from({ length: segments }).map((_, i) => (
            <motion.span
              key={i}
              className={cn(
                "flex-1 border-2",
                invert ? "border-paper" : "border-ink",
                i < filled
                  ? invert
                    ? "bg-mint"
                    : "bg-ink"
                  : invert
                    ? "bg-transparent"
                    : "bg-paper",
              )}
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{
                duration: duration.fast,
                ease: ease.pixel,
                delay: i * 0.025,
              }}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "relative w-full overflow-hidden border-2",
            invert ? "border-paper bg-graphite" : "border-ink bg-paper",
            HEIGHT[size],
            variant === "pill" ? "rounded-full" : "pixel-clip",
          )}
          style={
            variant === "bar"
              ? ({ ["--notch" as string]: "2px" } as React.CSSProperties)
              : undefined
          }
        >
          <motion.div
            className={cn(
              "h-full",
              variant === "pill" && "rounded-full",
              hatch
                ? cn("pixel-hatch", invert ? "bg-mint-shade" : "bg-mint")
                : invert
                  ? "bg-mint"
                  : "bg-mint-deep",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: duration.slow, ease: ease.snap }}
          />
        </div>
      )}
    </div>
  );

  if (!label && !showValue) return <div className={className}>{meter}</div>;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        {label && (
          <span
            className={cn(
              "text-caps",
              invert ? "text-mint-soft" : "text-graphite",
            )}
          >
            {label}
          </span>
        )}
        {showValue && (
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              invert && "text-paper",
            )}
          >
            {pct}%
          </span>
        )}
      </div>
      {meter}
    </div>
  );
}