import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BackgroundGrid — the animated desktop behind every screen.
 *
 * Four stacked layers, all CSS-animated so they never trigger a React render:
 *   1. mint field          2. blueprint grid
 *   3. two parallax cloud belts   4. twinkling sparkles + horizon
 *
 * Clouds are drawn as whole-pixel rects at `shapeRendering="crispEdges"`; each
 * belt is a doubled strip translated by exactly -50%, which loops seamlessly.
 */

/** A pixel cloud built from three stacked runs, in 1x units. */
function PixelCloud({
  x,
  y,
  unit,
  opacity = 1,
}: {
  x: number;
  y: number;
  unit: number;
  opacity?: number;
}) {
  const rows = [
    { start: 4, len: 7, row: 0 },
    { start: 2, len: 12, row: 1 },
    { start: 0, len: 17, row: 2 },
  ];
  return (
    <g opacity={opacity}>
      {rows.map((r) => (
        <rect
          key={r.row}
          x={x + r.start * unit}
          y={y + r.row * unit}
          width={r.len * unit}
          height={unit}
          fill="#ffffff"
        />
      ))}
    </g>
  );
}

function CloudBelt({
  unit,
  clouds,
  opacity,
}: {
  unit: number;
  clouds: Array<{ x: number; y: number; s: number }>;
  opacity: number;
}) {
  const W = 1200;
  const strip = (offset: number) => (
    <g transform={`translate(${offset} 0)`}>
      {clouds.map((c, i) => (
        <PixelCloud
          key={i}
          x={c.x}
          y={c.y}
          unit={unit * c.s}
          opacity={opacity}
        />
      ))}
    </g>
  );
  return (
    <svg
      viewBox={`0 0 ${W * 2} 200`}
      preserveAspectRatio="xMinYMid slice"
      shapeRendering="crispEdges"
      className="h-full w-[200%]"
      aria-hidden
    >
      {strip(0)}
      {strip(W)}
    </svg>
  );
}

/** Four-point pixel sparkle, as in the reference's CONNECT panel. */
function Sparkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      className={cn("absolute", className)}
      style={style}
      aria-hidden
    >
      <rect x="3" y="0" width="1" height="7" fill="#ffffff" />
      <rect x="0" y="3" width="7" height="1" fill="#ffffff" />
      <rect x="2" y="2" width="3" height="3" fill="#ffffff" />
    </svg>
  );
}

const SPARKLES = [
  { left: "12%", top: "18%", size: 14, delay: "0s" },
  { left: "78%", top: "12%", size: 10, delay: "0.8s" },
  { left: "34%", top: "62%", size: 12, delay: "1.6s" },
  { left: "88%", top: "54%", size: 16, delay: "2.2s" },
  { left: "58%", top: "31%", size: 9, delay: "1.1s" },
  { left: "22%", top: "82%", size: 11, delay: "2.7s" },
];

export type BackgroundGridProps = {
  /** Drop the cloud belts for dense screens that need a calmer field. */
  clouds?: boolean;
  sparkles?: boolean;
  className?: string;
};

export function BackgroundGrid({
  clouds = true,
  sparkles = true,
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

      {clouds && (
        <>
          {/* Far belt — small, slow, low contrast. */}
          <div className="animate-drift-slow absolute top-[8%] left-0 h-40 w-[200%] opacity-45">
            <CloudBelt
              unit={4}
              opacity={1}
              clouds={[
                { x: 80, y: 20, s: 1 },
                { x: 420, y: 60, s: 0.75 },
                { x: 760, y: 10, s: 1.1 },
                { x: 1010, y: 70, s: 0.8 },
              ]}
            />
          </div>

          {/* Near belt — larger, faster, brighter. */}
          <div className="animate-drift-mid absolute top-[34%] left-0 h-56 w-[200%] opacity-80">
            <CloudBelt
              unit={6}
              opacity={1}
              clouds={[
                { x: 200, y: 40, s: 1.3 },
                { x: 640, y: 0, s: 1 },
                { x: 980, y: 66, s: 1.5 },
              ]}
            />
          </div>
        </>
      )}

      {sparkles &&
        SPARKLES.map((s, i) => (
          <Sparkle
            key={i}
            className="animate-twinkle"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
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