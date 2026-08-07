"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/tokens";

/**
 * FolderIcon — a desktop folder, drawn on a pixel grid.
 *
 * Three parts stacked back to front: the folder's back panel, the papers
 * inside it, and the front flap. Opening rotates the flap forward about its
 * bottom edge and lifts the papers into the gap, which is what reads as
 * "opening" rather than "growing".
 *
 * Selection and opening are separate, as on a real desktop: one click selects,
 * a second click (or Enter, or a double-click) opens. The caller decides what
 * opening means.
 */

const UNIT_W = 24;
const UNIT_H = 20;

export type FolderIconProps = {
  label: string;
  /** Small count shown under the label — "6 topics". */
  meta?: string;
  open?: boolean;
  selected?: boolean;
  /** Icon width in px. The label sits beneath at a fixed width. */
  size?: number;
  disabled?: boolean;
  onSelect?: () => void;
  onOpen?: () => void;
  className?: string;
};

export function FolderIcon({
  label,
  meta,
  open = false,
  selected = false,
  size = 88,
  disabled = false,
  onSelect,
  onOpen,
  className,
}: FolderIconProps) {
  const height = Math.round((size / UNIT_W) * UNIT_H);

  const handleClick = () => {
    if (disabled) return;
    // Classic desktop behaviour: the first click selects, the next one opens.
    if (selected) onOpen?.();
    else onSelect?.();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={handleClick}
      onDoubleClick={() => !disabled && onOpen?.()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (selected) onOpen?.();
          else onSelect?.();
        }
      }}
      className={cn(
        "group flex w-32 flex-col items-center gap-2.5 p-2 select-none",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <motion.svg
        viewBox={`0 0 ${UNIT_W} ${UNIT_H}`}
        width={size}
        height={height}
        shapeRendering="crispEdges"
        aria-hidden
        className="overflow-visible"
        animate={{ y: open ? -2 : 0 }}
        whileHover={disabled ? undefined : { y: -3 }}
        transition={{ duration: duration.fast, ease: ease.pixel }}
      >
        {/* Back panel + tab */}
        <g>
          <rect x="1" y="1" width="9" height="3" fill="#000000" />
          <rect x="1" y="3" width="22" height="15" fill="#000000" />
          <rect x="2" y="2" width="7" height="2" fill="#8fbfb9" />
          <rect x="2" y="4" width="20" height="13" fill="#8fbfb9" />
        </g>

        {/* Papers — only meaningful once the flap is out of the way */}
        <motion.g
          initial={false}
          animate={{ y: open ? -3.5 : 0, opacity: open ? 1 : 0 }}
          transition={{
            duration: duration.base,
            ease: ease.snap,
            delay: open ? 0.06 : 0,
          }}
        >
          <rect x="5" y="6" width="13" height="10" fill="#000000" />
          <rect x="6" y="7" width="11" height="9" fill="#ffffff" />
          <rect x="7" y="9" width="7" height="1" fill="#b7dbd7" />
          <rect x="7" y="11" width="9" height="1" fill="#b7dbd7" />
          <rect x="7" y="13" width="6" height="1" fill="#b7dbd7" />
        </motion.g>

        {/* Front flap — rotates forward about its bottom edge */}
        <motion.g
          initial={false}
          animate={{ rotateX: open ? 58 : 0, y: open ? 1 : 0 }}
          transition={{ duration: duration.base, ease: ease.snap }}
          style={{
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
          }}
        >
          <rect x="1" y="7" width="22" height="11" fill="#000000" />
          <rect x="2" y="8" width="20" height="9" fill="#b7dbd7" />
          {/* Grip notch, so the flap reads as a front face and not a slab */}
          <rect x="10" y="9" width="4" height="1" fill="#8fbfb9" />
        </motion.g>
      </motion.svg>

      {/* Label and count are one unit, so they sit tighter to each other than
          to the icon. Classic desktops invert the label to show selection. */}
      <span className="flex max-w-full flex-col items-center gap-1">
        <span
          className={cn(
            "pixel-clip type-caps max-w-full px-2 py-1 text-center text-[11px] leading-tight break-words transition-colors duration-100",
            selected
              ? "bg-ink text-mint"
              : "text-ink group-hover:bg-mint-soft group-hover:text-ink",
          )}
          style={{ ["--notch" as string]: "2px" }}
        >
          {label}
        </span>

        {/* Muted so the label stays the dominant element — Silkscreen reads
            larger than its 10px suggests, and at slate it outranked the name. */}
        {meta && <span className="type-hud text-mute">{meta}</span>}
      </span>
    </button>
  );
}
