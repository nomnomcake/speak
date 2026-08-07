/**
 * Design tokens mirrored from globals.css for use in TypeScript
 * (motion variants, canvas/SVG drawing, chart colours).
 *
 * globals.css is the source of truth for CSS. This file exists so runtime code
 * never hardcodes a hex value inline. If you change one, change both.
 */

export const palette = {
  ink: "#000000",
  graphite: "#2a3230",
  slate: "#5a6764",
  mute: "#8b9794",

  paper: "#ffffff",
  mintMist: "#ecf6f5",
  mintSoft: "#d8ecea",
  mint: "#b7dbd7",
  mintDeep: "#8fbfb9",
  mintShade: "#6fa6a0",

  glow: "#7fe9e0",
  alert: "#e4736a",
  affirm: "#7fb69a",
} as const;

/** 4px base unit. Prefer Tailwind spacing utilities; use these for JS-driven layout. */
export const space = {
  px: 1,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,
} as const;

export const stroke = {
  hair: 1,
  rule: 2,
  frame: 3,
  heavy: 4,
} as const;

export const notch = {
  sm: 3,
  md: 4,
  lg: 6,
} as const;

/**
 * Shared easing curves. Pixel UIs settle fast and never overshoot softly.
 *
 * `glide` is the exception: for whole windows appearing and leaving, where the
 * snappier curves read as a jump-cut rather than a transition. Controls keep
 * using `pixel` and `snap`.
 */
export const ease = {
  pixel: [0.2, 0.9, 0.25, 1],
  snap: [0.16, 1, 0.3, 1],
  glide: [0.22, 0.61, 0.36, 1],
} as const;

export const duration = {
  instant: 0.08,
  fast: 0.16,
  base: 0.24,
  slow: 0.4,
  page: 0.32,
} as const;

export type Tone = "paper" | "mint" | "mist" | "ink" | "ghost";
export type Size = "sm" | "md" | "lg";