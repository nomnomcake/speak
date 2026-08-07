"use client";

import * as React from "react";
import Link, { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

/**
 * Button — a physical pixel key.
 *
 * It rests on a hard black shadow plate; pressing translates the key into the
 * plate so the shadow disappears. That single gesture is the product's core
 * microinteraction and is deliberately CSS-driven rather than spring-animated —
 * a spring would overshoot, and nothing in a pixel UI overshoots.
 *
 * `ghost` is the one variant with no plates at all. It can't use a transparent
 * fill over the black border plate, because transparent over black is just
 * black — it gets a bare hit area that tints on hover instead.
 *
 * With `href`, the key becomes a link and shows a spinner while the navigation
 * is pending. Without that, a slow transition — an uncompiled route in dev, or
 * a poor connection in production — looks like a dead button, because nothing
 * on screen changes between the click and the new page.
 */

type Variant = "primary" | "secondary" | "mint" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<Variant, { fill: string; text: string }> = {
  primary: { fill: "bg-ink", text: "text-paper" },
  secondary: { fill: "bg-paper", text: "text-ink" },
  mint: { fill: "bg-mint", text: "text-ink" },
  ghost: { fill: "bg-transparent", text: "text-ink" },
  danger: { fill: "bg-alert", text: "text-ink" },
};

const SIZE: Record<ButtonSize, { pad: string; text: string; gap: string }> = {
  sm: { pad: "px-3 py-1.5", text: "text-xs", gap: "gap-1.5" },
  md: { pad: "px-4 py-2.5", text: "text-sm", gap: "gap-2" },
  lg: { pad: "px-6 py-3.5", text: "text-base", gap: "gap-2.5" },
};

export type ButtonProps = {
  variant?: Variant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /**
   * Render as a link instead of a button, with identical visuals.
   *
   * A `<button>` nested inside an `<a>` is invalid HTML, so navigation has to
   * be built in rather than achieved by wrapping. Ignored when disabled.
   */
  href?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Reads the enclosing Link's pending state. Must be rendered inside a `Link`,
 * which is why this exists as a component rather than a hook call in Button.
 */
function LinkAwareInner({
  render,
}: {
  render: (busy: boolean) => React.ReactNode;
}) {
  const { pending } = useLinkStatus();
  return <>{render(pending)}</>;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      disabled,
      href,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const v = VARIANT[variant];
    const s = SIZE[size];
    const isGhost = variant === "ghost";
    const isOff = disabled || loading;
    const offset = size === "sm" ? 3 : 4;

    const renderLabel = (busy: boolean) => (
      <>
        {busy ? (
          <Spinner
            size={size === "lg" ? "md" : "sm"}
            tone="current"
            label="Working"
          />
        ) : (
          iconLeft
        )}
        {children}
        {!busy && iconRight}
      </>
    );

    const renderInner = (busy: boolean) =>
      isGhost ? (
        <span
          className={cn(
            "pixel-clip flex items-center justify-center whitespace-nowrap",
            "font-semibold tracking-wide uppercase text-ink",
            "transition-colors duration-150",
            !isOff && "group-hover:bg-mint-soft group-active:bg-mint",
            s.pad,
            s.text,
            s.gap,
          )}
        >
          {renderLabel(busy)}
        </span>
      ) : (
        <>
          {/* Shadow plate. Hidden while pressed so the key looks depressed. */}
          <span
            aria-hidden
            className={cn(
              "pixel-clip absolute inset-0 bg-ink transition-opacity duration-100",
              !isOff && "group-active:opacity-0",
            )}
            style={{ transform: `translate(${offset}px, ${offset}px)` }}
          />

          {/* Key body — black plate holding the inset fill. The 3px inset is
              padding, not a margin on the fill: a vertical margin would
              collapse through this plate and leave the key without top and
              bottom edges. */}
          <span
            className={cn(
              "pixel-clip relative block bg-ink p-[3px] transition-transform duration-100 ease-[cubic-bezier(0.2,0.9,0.25,1)]",
              !isOff &&
                "group-hover:-translate-x-px group-hover:-translate-y-px group-active:translate-x-[var(--press)] group-active:translate-y-[var(--press)]",
            )}
            style={{ ["--press" as string]: `${offset}px` }}
          >
            <span
              className={cn(
                "pixel-clip flex items-center justify-center whitespace-nowrap",
                "font-semibold tracking-wide uppercase",
                v.fill,
                v.text,
                s.pad,
                s.text,
                s.gap,
              )}
            >
              {renderLabel(busy)}
            </span>
          </span>
        </>
      );

    const rootClass = cn(
      "group relative inline-block select-none",
      "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ink",
      fullWidth && "w-full",
      // Only a true disable dims the key. A loading button keeps full
      // contrast so the spinner stays legible.
      disabled && !loading && "cursor-not-allowed opacity-45",
      loading && "cursor-wait",
      className,
    );
    const rootStyle = { ["--notch" as string]: "3px" };

    if (href && !isOff) {
      return (
        <Link href={href} className={rootClass} style={rootStyle}>
          <LinkAwareInner render={renderInner} />
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isOff}
        data-loading={loading || undefined}
        className={rootClass}
        style={rootStyle}
        {...rest}
      >
        {renderInner(loading)}
      </button>
    );
  },
);
