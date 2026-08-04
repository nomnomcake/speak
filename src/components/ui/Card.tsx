"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PixelFrame } from "./PixelFrame";
import { duration, ease, type Tone } from "@/lib/tokens";

/**
 * Card — a compact surface for a single unit of content.
 *
 * Lighter than Panel: no title bar chrome, optional eyebrow + heading. When
 * `interactive` is set it carries a hard offset shadow that the card slides
 * into on hover, which is the pixel-OS equivalent of a lift.
 */

export type CardProps = {
  /** Small uppercase pixel label above the heading. */
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  /** Right-aligned slot on the heading row — a value, badge, or icon. */
  trailing?: React.ReactNode;
  tone?: Tone;
  interactive?: boolean;
  notch?: number;
  className?: string;
  children?: React.ReactNode;
};

export function Card({
  eyebrow,
  title,
  trailing,
  tone = "paper",
  interactive = false,
  notch = 4,
  className,
  children,
}: CardProps) {
  const inverted = tone === "ink";

  const frame = (
    <PixelFrame
      tone={tone}
      notch={notch}
      shadow={interactive ? 4 : 0}
      interactive={interactive}
      className={cn("h-full", className)}
      innerClassName={cn(
        "flex h-full flex-col gap-3 p-4",
        inverted ? "text-paper" : "text-ink",
      )}
    >
      {(eyebrow || title || trailing) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            {eyebrow && (
              <div
                className={cn(
                  "text-hud",
                  inverted ? "text-mint" : "text-slate",
                )}
              >
                {eyebrow}
              </div>
            )}
            {title && (
              <div className="truncate text-lg leading-tight font-semibold">
                {title}
              </div>
            )}
          </div>
          {trailing && <div className="shrink-0">{trailing}</div>}
        </div>
      )}
      {children && (
        <div
          className={cn(
            "flex-1 text-sm leading-relaxed",
            inverted ? "text-mint-soft" : "text-graphite",
          )}
        >
          {children}
        </div>
      )}
    </PixelFrame>
  );

  if (!interactive) return frame;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ duration: duration.fast, ease: ease.pixel }}
      className="h-full"
    >
      {frame}
    </motion.div>
  );
}