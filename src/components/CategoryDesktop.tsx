"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FolderIcon, Panel } from "@/components/ui";
import { ease } from "@/lib/tokens";
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
  /** Topic id, so the randomiser can hand the pick to the research screen. */
  id: string;
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

/**
 * How long the desktop is held after a folder opens: long enough for the flap
 * to play at full opacity, plus the fade-out that hands over to the search.
 */
const OPEN_BEAT_MS = 330;

export function CategoryDesktop({ folders }: { folders: DesktopFolder[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  /** Set the moment a folder is opened, cleared once the search takes over. */
  const [openingId, setOpeningId] = React.useState<string | null>(null);

  const openFolder = folders.find((f) => f.id === openId) ?? null;
  const selectedFolder = folders.find((f) => f.id === selectedId) ?? null;

  // The search replaces the desktop rather than appearing under it, so the
  // folder would otherwise unmount before its flap finished opening. This
  // holds the desktop for one beat so that animation is actually seen.
  React.useEffect(() => {
    if (!openingId) return;
    const t = setTimeout(() => {
      setOpenId(openingId);
      setOpeningId(null);
    }, OPEN_BEAT_MS);
    return () => clearTimeout(t);
  }, [openingId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Unwind one layer at a time: the search, then the selection.
        if (openId || openingId) {
          setOpenId(null);
          setOpeningId(null);
        } else setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, openingId]);

  /**
   * The status bar only appears when it has something to say. An idle item
   * count is noise — the folders are right there and countable.
   */
  const status = openFolder
    ? `${openFolder.label} — ${openFolder.count} file${openFolder.count === 1 ? "" : "s"}`
    : selectedFolder
      ? `${selectedFolder.label} selected — click again or press Enter to open`
      : null;

  // The search takes the window over. Rendering it under the desktop pushed it
  // below the fold, so it had to be scrolled to.
  if (openFolder) {
    return (
      <motion.div
        key={openFolder.id}
        // Rises in rather than dropping down, so it reads as arriving from
        // where the desktop went. No scale: rubber-banding a whole window
        // looks cheap at this size, and the fade carries the transition.
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: ease.glide }}
      >
        <TopicRandomizer folder={openFolder} onClose={() => setOpenId(null)} />
      </motion.div>
    );
  }

  return (
    // The desktop fades out as it hands over, so the swap is a crossfade
    // rather than a cut. The delay lets the folder flap play at full opacity
    // first — fading immediately would hide the animation being triggered.
    <motion.div
      className="space-y-5"
      animate={openingId ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 }}
      transition={{
        duration: openingId ? 0.18 : 0.2,
        ease: ease.glide,
        delay: openingId ? 0.13 : 0,
      }}
    >
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
              open={openingId === folder.id}
              onSelect={() => setSelectedId(folder.id)}
              onOpen={() => {
                setSelectedId(folder.id);
                setOpeningId(folder.id);
              }}
            />
          ))}
        </div>
      </Panel>
    </motion.div>
  );
}
