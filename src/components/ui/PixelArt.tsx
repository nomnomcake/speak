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

/**
 * A biscuit, for the storage notice.
 *
 * Two shapes rather than one, because the chips need their own colour and a
 * run-length row carries no colour of its own — the body is drawn first and
 * the chips punched over it. Eleven units across, which is the smallest grid
 * where a round edge still reads as round rather than as a stop sign.
 */
const COOKIE_BODY: Shape = [
  [[3, 5]],
  [[2, 7]],
  [[1, 9]],
  [[0, 11]],
  [[0, 11]],
  [[0, 11]],
  [[1, 9]],
  [[2, 7]],
  [[3, 5]],
];

/**
 * Five chips, two units wide each.
 *
 * Eight single-unit chips read as speckle rather than chocolate — at this size
 * a one-pixel dot is noise, and enough of them turn a biscuit into a digestive.
 * Fewer and chunkier is more legible and, being the point of the drawing,
 * cuter.
 */
const COOKIE_CHIPS: Shape = [
  [],
  [[4, 2]],
  [],
  [
    [2, 2],
    [7, 2],
  ],
  [],
  [[5, 2]],
  [],
  [[3, 2]],
  [],
];

export function PixelCookie({
  unit = 3,
  fill = "#8fbfb9",
  chip = "#2a3230",
  className,
  style,
}: {
  /** Size of one pixel block, in px. */
  unit?: number;
  fill?: string;
  chip?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const w = shapeWidth(COOKIE_BODY);
  const h = COOKIE_BODY.length;

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
      {COOKIE_BODY.map((runs, y) =>
        runs.map(([start, len], i) => (
          <rect key={`b${y}-${i}`} x={start} y={y} width={len} height={1} fill={fill} />
        )),
      )}
      {COOKIE_CHIPS.map((runs, y) =>
        runs.map(([start, len], i) => (
          <rect key={`c${y}-${i}`} x={start} y={y} width={len} height={1} fill={chip} />
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

/**
 * Paperclip — a desk object for the corner of a card.
 *
 * Drawn as a flat pixel spiral rather than a wire loop; at this size a
 * realistic clip turns to mush, and the stepped outline reads better.
 */
export function Paperclip({
  size = 22,
  fill = "#5a6764",
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
      viewBox="0 0 10 18"
      width={size}
      height={size * 1.8}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden
    >
      {/* outer loop */}
      <rect x="1" y="1" width="1" height="13" fill={fill} />
      <rect x="8" y="1" width="1" height="10" fill={fill} />
      <rect x="2" y="0" width="6" height="1" fill={fill} />
      <rect x="2" y="14" width="5" height="1" fill={fill} />
      <rect x="7" y="11" width="1" height="3" fill={fill} />
      {/* inner return */}
      <rect x="4" y="3" width="1" height="9" fill={fill} />
      <rect x="5" y="12" width="2" height="1" fill={fill} />
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

/**
 * Tool glyphs — the icons on the research toolbox buttons.
 *
 * Drawn rather than imported. Every one of these services has a real logo, and
 * every real logo is a wordmark in a brand colour, which would put five foreign
 * palettes on a screen built from four mint swatches — and would be someone
 * else's trademark sitting in our UI. These say what the destination *is*
 * (reference, search, scholarship, medicine, video) rather than who owns it.
 *
 * All on a 9x9 grid, padded with empty rows so a row of them sits on one
 * baseline regardless of how tall the drawing itself is.
 */
export const TOOL_GLYPHS = {
  /**
   * Open book — a reference work.
   *
   * The spine gap runs the full height. An earlier version closed the bottom
   * row, which at 18px turned the whole glyph into one solid block with a slot
   * cut in it. Two separated page blocks read as a book; one blob does not.
   */
  book: [
    [],
    [
      [2, 2],
      [5, 2],
    ],
    [
      [1, 3],
      [5, 3],
    ],
    [
      [0, 4],
      [5, 4],
    ],
    [
      [0, 4],
      [5, 4],
    ],
    [
      [0, 4],
      [5, 4],
    ],
    [
      [1, 3],
      [5, 3],
    ],
    [],
    [],
  ],
  /** Magnifier, handle to the lower right. */
  magnifier: [
    [[2, 4]],
    [
      [1, 1],
      [6, 1],
    ],
    [
      [0, 1],
      [7, 1],
    ],
    [
      [0, 1],
      [7, 1],
    ],
    [
      [1, 1],
      [6, 1],
    ],
    [[2, 4]],
    [[5, 2]],
    [[6, 2]],
    [[7, 2]],
  ],
  /**
   * Mortarboard — scholarship.
   *
   * Flat board wider than the cap beneath it, button on top, tassel down the
   * right. The tassel is what stops it reading as a lamp: without it, a wide
   * plate over a narrow box is just a table.
   */
  mortarboard: [
    [],
    [[3, 3]],
    [[0, 9]],
    [[1, 7]],
    [
      [2, 5],
      [8, 1],
    ],
    [
      [2, 5],
      [8, 1],
    ],
    [
      [2, 5],
      [7, 2],
    ],
    [],
    [],
  ],
  /** Medical cross. The one unambiguous "this is medicine" mark at 9px. */
  cross: [
    [],
    [[3, 3]],
    [[3, 3]],
    [[0, 9]],
    [[0, 9]],
    [[0, 9]],
    [[3, 3]],
    [[3, 3]],
    [],
  ],
  /** Screen with a play triangle knocked out of it. */
  screen: [
    [[1, 7]],
    [[0, 9]],
    [
      [0, 3],
      [5, 4],
    ],
    [
      [0, 3],
      [6, 3],
    ],
    [
      [0, 3],
      [7, 2],
    ],
    [
      [0, 3],
      [6, 3],
    ],
    [
      [0, 3],
      [5, 4],
    ],
    [[0, 9]],
    [[1, 7]],
  ],
} satisfies Record<string, Shape>;

export type ToolGlyphName = keyof typeof TOOL_GLYPHS;

/**
 * ToolGlyph — one sprite from TOOL_GLYPHS.
 *
 * Fill defaults to `currentColor` so a glyph inherits whatever the button is
 * doing on hover, press and disabled without any of those states needing to
 * know a glyph is in there.
 */
export function ToolGlyph({
  name,
  unit = 2,
  fill = "currentColor",
  className,
  style,
}: {
  name: ToolGlyphName;
  /** Size of one pixel block, in px. */
  unit?: number;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const rows = TOOL_GLYPHS[name];
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
          <rect
            key={`${y}-${i}`}
            x={start}
            y={y}
            width={len}
            height={1}
            fill={fill}
          />
        )),
      )}
    </svg>
  );
}