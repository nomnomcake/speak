import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tokens";

/**
 * PixelFrame — the root primitive of the entire design system.
 *
 * Every surface in Speak is this: a black plate with square-stepped corners,
 * holding an inset fill of the same shape. Panel, Card, Button, Badge and the
 * meters are all PixelFrame with different padding and tone. That is the whole
 * reason unrelated screens read as one product.
 *
 * The stepped corner comes from `.pixel-clip`, which reads a `--notch` custom
 * property so a single clip-path definition serves every size.
 */

const toneFill: Record<Tone, string> = {
  paper: "bg-paper",
  mint: "bg-mint",
  mist: "bg-mint-mist",
  ink: "bg-ink",
  ghost: "bg-transparent",
};

export type PixelFrameProps = {
  /** Interior fill. `ink` inverts to white-on-black, as in the reference. */
  tone?: Tone;
  /** Corner cut in px. 3 for controls, 4 for cards, 6 for full windows. */
  notch?: number;
  /** Border thickness in px. */
  border?: number;
  /**
   * Hard offset drop shadow, in px. The reference uses a solid black block,
   * never a blur. `0` disables it.
   */
  shadow?: number;
  /** Lift on hover — a 2px translate against the shadow. Requires `shadow`. */
  interactive?: boolean;
  /** Class applied to the inner fill (padding, layout, typography). */
  innerClassName?: string;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

export const PixelFrame = React.forwardRef<HTMLDivElement, PixelFrameProps>(
  function PixelFrame(
    {
      tone = "paper",
      notch = 4,
      border = 3,
      shadow = 0,
      interactive = false,
      className,
      innerClassName,
      children,
      style,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn("relative", interactive && "group/frame", className)}
        style={{ ...style, ["--notch" as string]: `${notch}px` }}
        {...rest}
      >
        {/* Hard shadow plate — a separate layer because clip-path would
            otherwise crop a box-shadow away. */}
        {shadow > 0 && (
          <div
            aria-hidden
            className={cn(
              "pixel-clip pointer-events-none absolute inset-0 bg-ink",
              interactive &&
                "transition-transform duration-150 ease-[cubic-bezier(0.2,0.9,0.25,1)] group-hover/frame:translate-x-0 group-hover/frame:translate-y-0",
            )}
            style={{ transform: `translate(${shadow}px, ${shadow}px)` }}
          />
        )}

        {/* Black plate → the border. */}
        <div
          className={cn(
            // h-full so a height set on the root reaches the inner surface.
            // With an auto-height root this computes to auto and changes
            // nothing, so it is safe for every non-stretched usage.
            "pixel-clip relative h-full bg-ink",
            interactive &&
              "transition-transform duration-150 ease-[cubic-bezier(0.2,0.9,0.25,1)] group-hover/frame:-translate-x-px group-hover/frame:-translate-y-px",
          )}
        >
          {/* Inset fill → the surface. */}
          <div
            className={cn("pixel-clip h-full", toneFill[tone], innerClassName)}
            style={{ margin: border }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);