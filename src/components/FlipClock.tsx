"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/tokens";

/**
 * FlipClock — split-flap digits.
 *
 * Each digit is a hinged card with a seam across its middle. Changing the
 * character remounts it, replaying a short rotateX so the new value drops into
 * place. A mechanical board reads warmer than a glowing LCD, and the seam is
 * what sells it — without that line the flip looks like a card fading.
 *
 * Only the digits animate. The colon is fixed, as it is on a real board.
 */

function FlipDigit({ char, expired }: { char: string; expired: boolean }) {
  return (
    <span
      className="relative inline-block"
      style={{ perspective: 320 }}
      aria-hidden
    >
      <motion.span
        key={char}
        initial={{ rotateX: -78 }}
        animate={{ rotateX: 0 }}
        transition={{ duration: 0.16, ease: ease.pixel }}
        className={cn(
          // Mid-tone cards with ink digits: solid black blocks were the
          // heaviest thing on screen and pulled the eye off the card, but
          // mint-mist at light weight went too far the other way and the
          // digits stopped reading as a display.
          "pixel-clip block border-2 border-ink px-2 py-1 text-center font-mono text-4xl leading-none tabular-nums sm:text-5xl",
          expired ? "bg-alert text-ink" : "bg-mint-shade text-ink",
        )}
        style={{
          ["--notch" as string]: "2px",
          transformOrigin: "50% 50%",
        }}
      >
        {char}
      </motion.span>

      {/* The hinge. Darker than the card face now that the face is mid-tone,
          so it reads as a fold rather than a highlight. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-px bg-graphite/45"
      />
    </span>
  );
}

export function FlipClock({
  value,
  expired = false,
  className,
}: {
  /** Formatted as MM:SS. */
  value: string;
  expired?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center gap-1", className)}
      role="timer"
      aria-label={value}
    >
      {value.split("").map((char, i) =>
        char === ":" ? (
          <span
            key={`sep-${i}`}
            aria-hidden
            className={cn(
              "px-0.5 font-mono text-3xl leading-none sm:text-4xl",
              expired ? "text-alert" : "text-ink",
            )}
          >
            :
          </span>
        ) : (
          <FlipDigit key={`d-${i}`} char={char} expired={expired} />
        ),
      )}
    </div>
  );
}
