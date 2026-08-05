import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PixelArt — the decorative sprite set.
 *
 * Everything here is drawn as whole-pixel rects at `shapeRendering="crispEdges"`
 * so it stays hard-edged at any scale. Shapes are authored as run-length rows:
 * each row is a list of [startColumn, length] pairs on a 1-unit grid, which
 * makes a cloud readable as data instead of a wall of <rect> tags.
 */

type Run = [start: number, length: number];
type Shape = Run[][];

/** Cloud silhouettes, smallest to largest. */
export const CLOUDS: Record<string, Shape> = {
  // Tiny two-row puff.
  wisp: [[[2, 4]], [[0, 8]]],
  // Classic three-row cloud.
  classic: [[[4, 7]], [[2, 12]], [[0, 17]]],
  // Twin-bump cloud — the cutest of the set, reads clearly at large sizes.
  double: [
    [
      [3, 3],
      [9, 4],
    ],
    [[2, 12]],
    [[1, 15]],
    [[0, 17]],
  ],
  // Tall rounded puff.
  puff: [[[5, 4]], [[3, 9]], [[1, 13]], [[0, 15]]],
  // Wide low bank.
  bank: [
    [
      [6, 5],
      [14, 3],
    ],
    [[3, 17]],
    [[0, 23]],
  ],
};

export type CloudShape = keyof typeof CLOUDS;

function shapeWidth(shape: Shape) {
  return Math.max(...shape.flatMap((row) => row.map(([s, l]) => s + l)));
}

export function PixelCloud({
  shape = "classic",
  unit = 6,
  fill = "#ffffff",
  className,
  style,
}: {
  shape?: CloudShape;
  /** Size of one pixel block, in px. */
  unit?: number;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const rows = CLOUDS[shape];
  const w = shapeWidth(rows);
  const h = rows.length;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * unit}
      height={h * unit}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden
    >
      {rows.map((runs, y) =>
        runs.map(([start, len], i) => (
          <rect key={`${y}-${i}`} x={start} y={y} width={len} height={1} fill={fill} />
        )),
      )}
    </svg>
  );
}

/** Four-point pixel sparkle, as in the reference's CONNECT panel. */
export function Sparkle({
  size = 12,
  fill = "#ffffff",
  className,
  style,
}: {
  size?: number;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 7 7"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden
    >
      <rect x="3" y="0" width="1" height="7" fill={fill} />
      <rect x="0" y="3" width="7" height="1" fill={fill} />
      <rect x="2" y="2" width="3" height="3" fill={fill} />
    </svg>
  );
}

/**
 * Sprig — the little plant that sits in the corner of every title bar in the
 * reference. Two leaves and a stem, drawn in ink so it reads on white chrome.
 */
export function Sprig({
  size = 16,
  fill = "currentColor",
  className,
}: {
  size?: number;
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 9 9"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {/* stem */}
      <rect x="4" y="3" width="1" height="6" fill={fill} />
      {/* left leaf */}
      <rect x="1" y="3" width="3" height="1" fill={fill} />
      <rect x="0" y="4" width="1" height="1" fill={fill} />
      <rect x="1" y="5" width="3" height="1" fill={fill} />
      {/* right leaf */}
      <rect x="5" y="1" width="3" height="1" fill={fill} />
      <rect x="8" y="2" width="1" height="1" fill={fill} />
      <rect x="5" y="3" width="3" height="1" fill={fill} />
    </svg>
  );
}

/** Pixel sun — a stepped disc with rays, for the top corner of a sky. */
export function Sun({
  size = 48,
  fill = "#ffffff",
  className,
  style,
}: {
  size?: number;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 11 11"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden
    >
      <rect x="4" y="3" width="3" height="5" fill={fill} />
      <rect x="3" y="4" width="5" height="3" fill={fill} />
      <rect x="5" y="0" width="1" height="2" fill={fill} />
      <rect x="5" y="9" width="1" height="2" fill={fill} />
      <rect x="0" y="5" width="2" height="1" fill={fill} />
      <rect x="9" y="5" width="2" height="1" fill={fill} />
    </svg>
  );
}