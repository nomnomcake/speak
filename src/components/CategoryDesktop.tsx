"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FolderIcon, Panel } from "@/components/ui";
import { duration, ease } from "@/lib/tokens";
import { TopicRandomizer } from "./TopicRandomizer";

/**
 * CategoryDesktop — folder picking, as a retro desktop.
 *
 * Interaction follows the desktop convention rather than the web one: a click
 * selects, a second click or Enter opens, Escape closes, and clicking empty
 * space deselects. That is the nostalgic part, so the status bar states the
 * rule outright — a user who clicks once and sees only a highlight should not
 * conclude the thing is broken.
 *
 * Opening a folder starts the search immediately. There is no intermediate
 * listing: the folder flap opens and the machine begins reading its contents,
 * which is one continuous gesture rather than two.
 */

export type DesktopFile = {
  name: string;
  /** Carried per file, since the Random folder mixes categories. */
  category: string;
  difficulty: string;
  speakSeconds: number;
};

export type DesktopFolder = {
  id: string;
  label: string;
  count: number;
  files: DesktopFile[];
};

export function CategoryDesktop({ folders }: { folders: DesktopFolder[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const openFolder = folders.find((f) => f.id === openId) ?? null;
  const selectedFolder = folders.find((f) => f.id === selectedId) ?? null;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Unwind one layer at a time: the search, then the selection.
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
    ? `${openFolder.label} — ${openFolder.count} file${openFolder.count === 1 ? "" : "s"}`
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

      {/* The search, spawned by opening a folder.
          Mount-only animation, no AnimatePresence. With an exit transition
          here the outgoing window never unmounted, leaving a dead panel on
          screen whose buttons pointed at state that no longer existed. Same
          reason PageTransition avoids exit variants. */}
      {openFolder ? (
        <motion.div
          key={openFolder.id}
          initial={{ opacity: 0, y: -8, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: duration.base,
            ease: ease.snap,
            // Let the flap finish opening before the window appears.
            delay: 0.14,
          }}
        >
          <TopicRandomizer
            folder={openFolder}
            onClose={() => setOpenId(null)}
          />
        </motion.div>
      ) : null}
    </div>
  );
}
