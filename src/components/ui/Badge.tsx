import * as React from "react";
import { cn } from "@/lib/utils";

/** Badge — a small pixel tag for status, counts, and keyboard hints. */

type BadgeTone = "ink" | "paper" | "mint" | "alert" | "affirm";

const TONE: Record<BadgeTone, string> = {
  ink: "bg-ink text-paper",
  paper: "bg-paper text-ink",
  mint: "bg-mint text-ink",
  alert: "bg-alert text-ink",
  affirm: "bg-affirm text-ink",
};

export type BadgeProps = {
  tone?: BadgeTone;
  /** Blinking square to the left, for live/recording states. */
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Badge({
  tone = "ink",
  pulse = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "pixel-clip type-hud inline-flex items-center gap-1.5 border-2 border-ink px-2 py-1",
        TONE[tone],
        className,
      )}
      style={{ ["--notch" as string]: "2px" }}
    >
      {pulse && (
        <span
          aria-hidden
          className="animate-blink block size-1.5 bg-current"
        />
      )}
      {children}
    </span>
  );
}

/** Divider — a dotted pixel rule. `solid` for structural separations. */
export function Divider({
  solid = false,
  className,
}: {
  solid?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(solid ? "h-0.5 w-full bg-ink" : "pixel-rule w-full", className)}
    />
  );
}