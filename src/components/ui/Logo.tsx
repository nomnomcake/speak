import { cn } from "@/lib/utils";
import { PixelCloud, Sparkle } from "./PixelArt";

/**
 * Logo — the Speak wordmark.
 *
 * A heavy Outfit wordmark with a pixel cloud drifting behind it and a sparkle
 * off the final letter. The cloud sits in mint at low contrast so the black
 * letterforms stay the thing you read; it is decoration, not a competing mark.
 */

const SIZES = {
  sm: { text: "text-2xl", cloud: 3, sparkle: 9, suffix: true },
  md: { text: "text-4xl", cloud: 5, sparkle: 12, suffix: true },
  lg: { text: "text-6xl sm:text-7xl", cloud: 8, sparkle: 18, suffix: true },
} as const;

export type LogoProps = {
  size?: keyof typeof SIZES;
  /** Hide the cloud and sparkle, leaving the bare wordmark. */
  bare?: boolean;
  /** Drop the `.EXE` suffix. */
  suffix?: boolean;
  className?: string;
};

export function Logo({
  size = "md",
  bare = false,
  suffix = true,
  className,
}: LogoProps) {
  const s = SIZES[size];

  return (
    <div className={cn("relative inline-flex items-end gap-2", className)}>
      {!bare && (
        <PixelCloud
          shape="double"
          unit={s.cloud}
          fill="#d8ecea"
          className="pointer-events-none absolute -top-2 -left-3 -z-10"
        />
      )}

      <span
        className={cn(
          "leading-[0.85] font-bold tracking-tight text-ink",
          s.text,
        )}
      >
        SPEAK
      </span>

      {suffix && (
        <span className="type-hud pb-1 text-slate">.EXE</span>
      )}

      {!bare && (
        <Sparkle
          size={s.sparkle}
          fill="#8fbfb9"
          className="animate-twinkle pointer-events-none absolute -top-1 -right-2"
        />
      )}
    </div>
  );
}
