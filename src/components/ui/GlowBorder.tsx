"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlowBorder — an emphasis aura for the one element that matters right now.
 *
 * The glow is drawn as concentric stepped plates rather than a blur, so it
 * stays inside the pixel-art language: an aura made of pixels, not light.
 * `soft` adds a real blurred bloom on top for hero moments only.
 */

export type GlowBorderProps = {
  /** Pulse the aura continuously. Off = static halo. */
  active?: boolean;
  /** Number of concentric plates. 2–4 reads best. */
  rings?: number;
  /** Gap between plates in px. */
  step?: number;
  /** Add a blurred bloom behind the plates. Use sparingly. */
  soft?: boolean;
  /** Corner cut, should match the wrapped surface. */
  notch?: number;
  className?: string;
  children: React.ReactNode;
};

const ringTone = ["bg-mint-deep", "bg-mint", "bg-mint-soft", "bg-mint-mist"];

export function GlowBorder({
  active = true,
  rings = 3,
  step = 4,
  soft = false,
  notch = 6,
  className,
  children,
}: GlowBorderProps) {
  const plates = Array.from({ length: Math.max(0, rings) });

  return (
    <div
      className={cn("relative isolate", className)}
      style={{ ["--notch" as string]: `${notch}px` }}
    >
      {soft && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-6 -z-20 bg-glow blur-2xl"
          initial={{ opacity: 0.3 }}
          animate={active ? { opacity: [0.25, 0.6, 0.25] } : { opacity: 0.3 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {plates.map((_, i) => {
        const inset = -((plates.length - i) * step);
        return (
          <motion.div
            key={i}
            aria-hidden
            className={cn(
              "pixel-clip pointer-events-none absolute -z-10",
              ringTone[Math.min(i, ringTone.length - 1)],
            )}
            style={{ inset }}
            initial={{ opacity: 0.9 }}
            animate={
              active
                ? { opacity: [0.35, 0.95, 0.35] }
                : { opacity: 0.75 }
            }
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.18,
            }}
          />
        );
      })}

      {children}
    </div>
  );
}