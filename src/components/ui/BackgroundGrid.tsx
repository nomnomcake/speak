import * as React from "react";
import { cn } from "@/lib/utils";
import { PixelCloud, Sparkle, Sun, type CloudShape } from "./PixelArt";

/**
 * BackgroundGrid — the animated desktop behind every screen.
 *
 * Five layers, all CSS-animated so they never trigger a React render:
 *   1. mint field   2. blueprint grid   3. sun
 *   4. three parallax cloud belts       5. sparkles + horizon ridge
 *
 * Each belt is a 200%-wide strip holding two identical halves; drifting it by
 * exactly -50% loops seamlessly. A cloud at x% of a half sits at x/2% of the
 * strip, which is why the positions below are halved when rendered.
 */

type BeltCloud = { shape: CloudShape; x: number; y: number; unit: number };

const FAR: BeltCloud[] = [
  { shape: "wisp", x: 4, y: 30, unit: 3 },
  { shape: "classic", x: 17, y: 8, unit: 3 },
  { shape: "double", x: 31, y: 46, unit: 3 },
  { shape: "wisp", x: 45, y: 18, unit: 2 },
  { shape: "puff", x: 58, y: 40, unit: 3 },
  { shape: "classic", x: 71, y: 4, unit: 3 },
  { shape: "wisp", x: 85, y: 34, unit: 3 },
  { shape: "bank", x: 93, y: 14, unit: 2 },
];

const MID: BeltCloud[] = [
  { shape: "double", x: 7, y: 22, unit: 5 },
  { shape: "puff", x: 24, y: 54, unit: 4 },
  { shape: "classic", x: 40, y: 6, unit: 5 },
  { shape: "wisp", x: 55, y: 40, unit: 4 },
  { shape: "bank", x: 68, y: 16, unit: 5 },
  { shape: "double", x: 87, y: 50, unit: 4 },
];

const NEAR: BeltCloud[] = [
  { shape: "bank", x: 12, y: 30, unit: 7 },
  { shape: "double", x: 42, y: 4, unit: 6 },
  { shape: "puff", x: 63, y: 44, unit: 7 },
  { shape: "classic", x: 88, y: 20, unit: 6 },
];

function CloudBelt({
  clouds,
  speed,
  opacity,
  className,
}: {
  clouds: BeltCloud[];
  speed: "animate-drift-slow" | "animate-drift-mid" | "animate-drift-fast";
  opacity: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Promoted to its own layer so the drift is a compositor transform
        // rather than a repaint of every cloud on every frame.
        "absolute left-0 w-[200%] transform-gpu will-change-transform",
        speed,
        opacity,
        className,
      )}
    >
      {[0, 1].map((half) =>
        clouds.map((c, i) => (
          <PixelCloud
            key={`${half}-${i}`}
            shape={c.shape}
            unit={c.unit}
            className="absolute"
            style={{ left: `${c.x / 2 + half * 50}%`, top: `${c.y}%` }}
          />
        )),
      )}
    </div>
  );
}

const SPARKLES = [
  { left: "11%", top: "16%", size: 14, delay: "0s" },
  { left: "78%", top: "10%", size: 10, delay: "0.8s" },
  { left: "33%", top: "58%", size: 12, delay: "1.6s" },
  { left: "89%", top: "50%", size: 16, delay: "2.2s" },
  { left: "57%", top: "28%", size: 9, delay: "1.1s" },
  { left: "21%", top: "78%", size: 11, delay: "2.7s" },
  { left: "66%", top: "70%", size: 10, delay: "3.4s" },
  { left: "45%", top: "88%", size: 12, delay: "1.9s" },
];

export type BackgroundGridProps = {
  /** Drop the cloud belts for dense screens that need a calmer field. */
  clouds?: boolean;
  sparkles?: boolean;
  sun?: boolean;
  className?: string;
};

export function BackgroundGrid({
  clouds = true,
  sparkles = true,
  sun = true,
  className,
}: BackgroundGridProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mint",
        className,
      )}
    >
      <div className="pixel-grid absolute inset-0" />

      {sun && (
        <Sun
          size={56}
          className="animate-bob absolute top-[6%] right-[7%] opacity-70"
          style={{ animationDuration: "10s" }}
        />
      )}

      {clouds && (
        <>
          <CloudBelt
            clouds={FAR}
            speed="animate-drift-slow"
            opacity="opacity-45"
            className="top-[4%] h-40"
          />
          <CloudBelt
            clouds={MID}
            speed="animate-drift-mid"
            opacity="opacity-70"
            className="top-[26%] h-56"
          />
          <CloudBelt
            clouds={NEAR}
            speed="animate-drift-fast"
            opacity="opacity-90"
            className="top-[54%] h-64"
          />
        </>
      )}

      {sparkles &&
        SPARKLES.map((s, i) => (
          <Sparkle
            key={i}
            size={s.size}
            className="animate-twinkle absolute"
            style={{ left: s.left, top: s.top, animationDelay: s.delay }}
          />
        ))}

      {/* Horizon — a stepped pixel ridge anchoring the bottom edge. */}
      <svg
        viewBox="0 0 240 40"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="absolute inset-x-0 bottom-0 h-24 w-full opacity-55"
        aria-hidden
      >
        <path
          fill="#ffffff"
          d="M0 40 L0 28 L16 28 L16 22 L32 22 L32 16 L48 16 L48 10 L64 10 L64 16 L80 16 L80 22 L96 22 L96 18 L112 18 L112 12 L128 12 L128 20 L144 20 L144 26 L160 26 L160 20 L176 20 L176 14 L192 14 L192 22 L208 22 L208 28 L224 28 L224 24 L240 24 L240 40 Z"
        />
      </svg>

      {/* Dither wash to keep the flat mint from banding on large displays. */}
      <div className="pixel-dither absolute inset-0" />
    </div>
  );
}