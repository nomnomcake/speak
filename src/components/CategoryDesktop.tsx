"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, X } from "lucide-react";
import {
  Badge,
  Button,
  Divider,
  FolderIcon,
  Panel,
  PixelFrame,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/tokens";

/**
 * CategoryDesktop — folder picking, as a retro desktop.
 *
 * Interaction follows the desktop convention rather than the web one: a click
 * selects, a second click or Enter opens, Escape closes, and clicking empty
 * space deselects. That is the nostalgic part, so the status bar states the
 * rule outright — a user who clicks once and sees only a highlight should not
 * conclude the thing is broken.
 *
 * Opening does not navigate. It reveals the folder's contents in a window
 * below, which keeps the metaphor intact and avoids a route that has nowhere
 * to go yet.
 */

export type DesktopFile = {
  name: string;
  difficulty: string;
  speakSeconds: number;
};

export type DesktopFolder = {
  id: string;
  label: string;
  count: number;
  files: DesktopFile[];
};

/** A sealed file inside an opened folder. */
function FileRow({ file, index }: { file: DesktopFile; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: duration.fast,
        ease: ease.snap,
        delay: 0.04 * index,
      }}
      className="flex items-center gap-3 px-3 py-2"
    >
      {/* Pixel document glyph */}
      <svg
        viewBox="0 0 10 12"
        width={16}
        height={19}
        shapeRendering="crispEdges"
        aria-hidden
        className="shrink-0"
      >
        <rect x="0" y="0" width="10" height="12" fill="#000000" />
        <rect x="1" y="1" width="8" height="10" fill="#ffffff" />
        <rect x="2" y="3" width="6" height="1" fill="#b7dbd7" />
        <rect x="2" y="5" width="6" height="1" fill="#b7dbd7" />
        <rect x="2" y="7" width="4" height="1" fill="#b7dbd7" />
      </svg>

      <span className="min-w-0 flex-1 truncate font-mono text-xs">
        {file.name}
      </span>

      <span className="type-hud hidden shrink-0 text-slate sm:block">
        {file.difficulty}
      </span>

      <span className="shrink-0 font-mono text-xs text-slate tabular-nums">
        {file.speakSeconds}s
      </span>

      <Lock size={11} className="shrink-0 text-mute" aria-label="sealed" />
    </motion.div>
  );
}

export function CategoryDesktop({ folders }: { folders: DesktopFolder[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const openFolder = folders.find((f) => f.id === openId) ?? null;
  const selectedFolder = folders.find((f) => f.id === selectedId) ?? null;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (openId) setOpenId(null);
        else setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  /**
   * The status bar only appears when it has something to say. An idle item
   * count is noise — the folders are right there and countable.
   */
  const status = openFolder
    ? `${openFolder.label} — ${openFolder.count} sealed file${openFolder.count === 1 ? "" : "s"}`
    : selectedFolder
      ? `${selectedFolder.label} selected — click again or press Enter to open`
      : null;

  return (
    <div className="space-y-5">
      {/* No title bar: the tab and the address bar already say Play, so a
          PLAY.EXE header was the third label for the same thing. The status
          bar at the foot still carries the window's state. */}
      <Panel
        chrome="window"
        notch={6}
        sky={{ density: "sparse" }}
        footer={
          status ? <span className="type-hud text-slate">{status}</span> : undefined
        }
      >
        {/* Clicking empty desktop deselects, as it would on a real one. */}
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
          className="grid grid-cols-2 justify-items-center gap-4 py-2 sm:grid-cols-3 lg:grid-cols-4"
        >
          {folders.map((folder) => (
            <FolderIcon
              key={folder.id}
              label={folder.label}
              meta={`${folder.count} topic${folder.count === 1 ? "" : "s"}`}
              selected={selectedId === folder.id}
              open={openId === folder.id}
              onSelect={() => setSelectedId(folder.id)}
              onOpen={() => {
                setSelectedId(folder.id);
                setOpenId(folder.id);
              }}
            />
          ))}
        </div>
      </Panel>

      {/* The opened folder, as its own window. */}
      <AnimatePresence mode="wait">
        {openFolder && (
          <motion.div
            key={openFolder.id}
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{
              duration: duration.base,
              ease: ease.snap,
              // Let the flap finish opening before the window appears.
              delay: 0.14,
            }}
          >
            <Panel
              chrome="window"
              notch={6}
              title={`${openFolder.label.toUpperCase()} — ${openFolder.count} FILES`}
              actions={
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  aria-label="Close folder"
                  className={cn(
                    "pixel-clip flex size-6 items-center justify-center border-2 border-ink bg-paper",
                    "transition-colors duration-150 hover:bg-alert",
                  )}
                  style={{ ["--notch" as string]: "2px" }}
                >
                  <X size={11} />
                </button>
              }
            >
              <div className="space-y-4">
                <PixelFrame notch={3} border={2} innerClassName="divide-y-2 divide-ink">
                  {openFolder.files.map((file, i) => (
                    <FileRow key={file.name} file={file} index={i} />
                  ))}
                </PixelFrame>

                <Divider />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge tone="mint">
                      <Lock size={9} />
                      Titles sealed
                    </Badge>
                    <span className="type-hud text-slate">
                      Revealed at the readout
                    </span>
                  </div>

                  <Button iconRight={<ArrowRight size={15} />}>
                    Start from this folder
                  </Button>
                </div>
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
