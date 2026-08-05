import { cn } from "@/lib/utils";
import { PixelCloud, Sparkle, Sun, type CloudShape } from "./PixelArt";

/**
 * PixelSky — a mint sky surface with pixel clouds, for use *inside* a window.
 *
 * This is the structural idea from the reference: clouds don't only sit behind
 * the page, they fill the interior of each window, and white panels float on
 * top of them. Positions are hardcoded rather than random so server and client
 * render identically.
 *
 * Everything here is static. A page carries seven or more skies, so animating
 * each cloud puts ~100 simultaneous transforms on the compositor and locks the
 * tab. All drift lives in BackgroundGrid's three belts instead, where one
 * transform moves a whole strip.
 */

type Cloud = {
  shape: CloudShape;
  /** Percent from the left edge. */
  x: number;
  /** Percent from the top edge. */
  y: number;
  unit: number;
  opacity: number;
};

const LAYOUTS: Record<string, Cloud[]> = {
  sparse: [
    { shape: "classic", x: 6, y: 14, unit: 4, opacity: 0.85 },
    { shape: "wisp", x: 72, y: 8, unit: 3, opacity: 0.7 },
    { shape: "double", x: 84, y: 62, unit: 4, opacity: 0.8 },
    { shape: "puff", x: 34, y: 74, unit: 3, opacity: 0.6 },
  ],
  normal: [
    { shape: "double", x: 3, y: 10, unit: 5, opacity: 0.95 },
    { shape: "wisp", x: 27, y: 30, unit: 3, opacity: 0.65 },
    { shape: "classic", x: 44, y: 6, unit: 4, opacity: 0.85 },
    { shape: "puff", x: 66, y: 48, unit: 4, opacity: 0.75 },
    { shape: "bank", x: 78, y: 12, unit: 4, opacity: 0.9 },
    { shape: "wisp", x: 14, y: 66, unit: 4, opacity: 0.7 },
    { shape: "classic", x: 52, y: 76, unit: 3, opacity: 0.6 },
    { shape: "double", x: 88, y: 80, unit: 3, opacity: 0.65 },
  ],
  dense: [
    { shape: "bank", x: 2, y: 6, unit: 5, opacity: 0.95 },
    { shape: "wisp", x: 22, y: 22, unit: 4, opacity: 0.7 },
    { shape: "double", x: 36, y: 4, unit: 5, opacity: 0.9 },
    { shape: "puff", x: 58, y: 26, unit: 4, opacity: 0.8 },
    { shape: "classic", x: 74, y: 8, unit: 5, opacity: 0.9 },
    { shape: "wisp", x: 92, y: 34, unit: 3, opacity: 0.6 },
    { shape: "classic", x: 8, y: 52, unit: 4, opacity: 0.8 },
    { shape: "double", x: 30, y: 68, unit: 4, opacity: 0.75 },
    { shape: "puff", x: 54, y: 58, unit: 3, opacity: 0.65 },
    { shape: "bank", x: 70, y: 74, unit: 4, opacity: 0.85 },
    { shape: "wisp", x: 46, y: 86, unit: 3, opacity: 0.55 },
    { shape: "classic", x: 86, y: 62, unit: 3, opacity: 0.6 },
  ],
};

/** Kept to three per sky — opacity animations are cheap, but not free. */
const SPARKLES = [
  { x: 18, y: 18, size: 11, delay: "0s" },
  { x: 62, y: 12, size: 9, delay: "1.1s" },
  { x: 82, y: 44, size: 10, delay: "2.3s" },
];

export type PixelSkyProps = {
  density?: keyof typeof LAYOUTS;
  sun?: boolean;
  sparkles?: boolean;
  className?: string;
};

export function PixelSky({
  density = "normal",
  sun = false,
  sparkles = true,
  className,
}: PixelSkyProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden bg-mint",
        className,
      )}
    >
      {sun && (
        <Sun size={44} className="absolute" style={{ right: "4%", top: "8%" }} />
      )}

      {LAYOUTS[density].map((c, i) => (
        <PixelCloud
          key={i}
          shape={c.shape}
          unit={c.unit}
          className="absolute"
          style={{ left: `${c.x}%`, top: `${c.y}%`, opacity: c.opacity }}
        />
      ))}

      {sparkles &&
        SPARKLES.map((s, i) => (
          <Sparkle
            key={i}
            size={s.size}
            className="animate-twinkle absolute"
            style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: s.delay }}
          />
        ))}
    </div>
  );
}