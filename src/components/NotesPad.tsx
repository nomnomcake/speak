"use client";

import * as React from "react";
import { Check, Trash2 } from "lucide-react";
import { PixelFrame } from "@/components/ui";
import { cn } from "@/lib/utils";
import { readJSON, writeJSON } from "@/lib/storage";

/**
 * NotesPad — a Notepad window.
 *
 * Monospace on ruled paper, autosaving to localStorage. The rules are drawn
 * with a repeating gradient whose period matches the line-height exactly, so
 * text sits on the lines instead of drifting off them as it wraps.
 *
 * Clearing is two-step rather than a confirm dialog: a browser confirm blocks
 * the page and looks nothing like the rest of this, and losing fifteen minutes
 * of notes to a stray click would be unforgivable.
 */

const LINE_HEIGHT = 24;
const SAVE_DEBOUNCE_MS = 400;

export function NotesPad({
  storageKey,
  placeholder = "Type your notes here…",
  className,
}: {
  storageKey: string;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);

  // Restore after mount. Reading during render would differ from the server's
  // empty string and break hydration.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setText(readJSON<string>(storageKey, ""));
      setLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, [storageKey]);

  // Debounced autosave.
  React.useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      writeJSON(storageKey, text);
      setSavedAt(Date.now());
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text, storageKey, loaded]);

  // Drop the confirm state if the user does anything else.
  React.useEffect(() => {
    if (!confirmClear) return;
    const t = setTimeout(() => setConfirmClear(false), 4000);
    return () => clearTimeout(t);
  }, [confirmClear]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split("\n").length : 0;

  return (
    <PixelFrame
      notch={4}
      className={cn("flex h-full flex-col", className)}
      innerClassName="flex h-full flex-col"
    >
      {/* Title bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2">
        <span className="type-caps truncate">NOTES.TXT</span>
        <span className="type-hud text-mute">
          {savedAt ? "Saved" : loaded ? "Not saved" : "Loading"}
        </span>
      </div>
      <div aria-hidden className="h-0.5 shrink-0 bg-ink" />

      {/* Ruled paper */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        spellCheck
        aria-label="Research notes"
        className={cn(
          "min-h-56 w-full flex-1 resize-none px-4 font-mono text-sm text-ink",
          "placeholder:text-mute focus:outline-none",
        )}
        style={{
          lineHeight: `${LINE_HEIGHT}px`,
          paddingTop: 6,
          paddingBottom: 12,
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 29px, var(--color-mint-soft) 29px, var(--color-mint-soft) 30px)",
          backgroundAttachment: "local",
        }}
      />

      {/* Status bar */}
      <div aria-hidden className="h-0.5 shrink-0 bg-ink" />
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2">
        <span className="type-hud text-slate">
          {words} words · {lines} lines
        </span>

        <button
          type="button"
          disabled={!text}
          onClick={() => {
            if (!confirmClear) {
              setConfirmClear(true);
              return;
            }
            setText("");
            writeJSON(storageKey, "");
            setConfirmClear(false);
          }}
          className={cn(
            "pixel-clip type-hud flex items-center gap-1.5 border-2 border-ink px-2 py-1 transition-colors duration-150",
            !text
              ? "cursor-not-allowed bg-paper text-mute opacity-50"
              : confirmClear
                ? "bg-alert text-ink"
                : "bg-paper text-ink hover:bg-mint-soft",
          )}
          style={{ ["--notch" as string]: "2px" }}
        >
          {confirmClear ? <Check size={10} /> : <Trash2 size={10} />}
          {confirmClear ? "Sure?" : "Clear"}
        </button>
      </div>
    </PixelFrame>
  );
}
