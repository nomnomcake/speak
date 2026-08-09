"use client";

import * as React from "react";
import {
  Download,
  Pause,
  Play,
  RotateCcw,
  Save,
  Shuffle,
  Trash2,
} from "lucide-react";
import { Badge, Button, Panel, PixelFrame } from "@/components/ui";
import { KEEP_LIMIT, keepTake, pruneTakes } from "@/lib/recordings";
import { loadAttempts } from "@/lib/attempts";
import { fileNameFor, type Topic } from "@/lib/topics";

/**
 * ReviewWindow — the take, in a media player.
 *
 * Modelled on the desktop media players this product's whole visual language
 * comes from: a framed window, a transport row you could hit without reading,
 * a scrub bar, and a status strip that tells you what the thing is doing.
 *
 * The one rule holding it together is that nothing here judges the recording.
 * Scoring belongs to the readout and reads the transcript; this screen exists
 * so the speaker can watch themselves, which is a different and much blunter
 * kind of feedback. See vision.md on why there is a camera at all.
 */

function mmss(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Status = "stopped" | "playing" | "paused";

export function ReviewWindow({
  recording,
  topic,
  onDelete,
  attemptId,
}: {
  recording: Blob;
  topic: Topic;
  onDelete: () => void;
  /**
   * The attempt this take belongs to. Absent when the session could not be
   * saved, and then there is nothing to attach a recording to — so the Keep
   * control is not offered rather than offered and quietly broken.
   */
  attemptId?: string | null;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [status, setStatus] = React.useState<Status>("stopped");
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  /**
   * Keeping is opt-in, and stays opt-in.
   *
   * Until now a take died with the tab, and that was the thing which made it
   * safe to record someone's face without ceremony. Replay reverses it, so the
   * choice has to become explicit rather than disappear: nothing is written
   * unless this is pressed, and the button says where it goes and what the
   * limit is instead of implying either.
   */
  const [kept, setKept] = React.useState<"no" | "saving" | "yes" | "failed">(
    "no",
  );

  // Revoked on unmount. An object URL pins the whole recording in memory until
  // it is released, and a session's take is measured in megabytes.
  const url = React.useMemo(() => URL.createObjectURL(recording), [recording]);
  React.useEffect(() => () => URL.revokeObjectURL(url), [url]);

  /**
   * MediaRecorder's webm arrives with `duration: Infinity` — the container is
   * written without a duration because the length is not known while it is
   * being recorded. Seeking to the end forces the browser to work it out, and
   * without this the scrub bar and the total time are both NaN.
   */
  const handleMetadata = React.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.duration === Infinity || Number.isNaN(el.duration)) {
      const onSeeked = () => {
        el.removeEventListener("seeked", onSeeked);
        el.currentTime = 0;
        setDuration(Number.isFinite(el.duration) ? el.duration : 0);
      };
      el.addEventListener("seeked", onSeeked);
      el.currentTime = 1e101;
    } else {
      setDuration(el.duration);
    }
  }, []);

  const toggle = React.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }, []);

  const replay = React.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play();
  }, []);

  const seek = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = videoRef.current;
      if (!el || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      el.currentTime = Math.min(duration, Math.max(0, ratio * duration));
    },
    [duration],
  );

  const progress = duration > 0 ? Math.min(1, time / duration) : 0;
  const downloadName = `speak-${fileNameFor(topic).replace(/\.TXT$/i, "").toLowerCase()}.webm`;

  return (
    <Panel
      chrome="window"
      title="Review"
      notch={6}
      sprig={false}
      actions={
        <Badge tone={status === "playing" ? "affirm" : "paper"}>
          {status === "playing"
            ? "Playing"
            : status === "paused"
              ? "Paused"
              : "Stopped"}
        </Badge>
      }
    >
      <div className="space-y-4">
        <PixelFrame tone="ink" notch={4} innerClassName="overflow-hidden">
          <video
            ref={videoRef}
            src={url}
            playsInline
            onLoadedMetadata={handleMetadata}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onPlay={() => setStatus("playing")}
            onPause={() => setStatus("paused")}
            onEnded={() => setStatus("stopped")}
            // Click-to-toggle, the way every player has worked for thirty
            // years. The transport row below is the discoverable path; this is
            // the one people reach for without thinking.
            onClick={toggle}
            className="block w-full cursor-pointer object-contain"
            style={{ aspectRatio: "16 / 9" }}
          />
        </PixelFrame>

        {/* Scrub bar. Hard-edged and clickable across its whole width — a thin
            draggable thumb is a precision task, and there is nothing precise
            to do in a sixty-second clip. */}
        <div className="space-y-2">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            onClick={seek}
            onKeyDown={(e) => {
              const el = videoRef.current;
              if (!el) return;
              if (e.key === "ArrowRight") el.currentTime += 2;
              if (e.key === "ArrowLeft") el.currentTime -= 2;
            }}
            className="pixel-clip h-5 w-full cursor-pointer border-2 border-ink bg-paper"
            style={{ ["--notch" as string]: "2px" }}
          >
            <div
              className="pixel-hatch h-full bg-mint-deep"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs tabular-nums text-graphite">
              {mmss(time)} / {mmss(duration)}
            </span>
            <span className="type-hud text-mute">
              {sizeLabel(recording.size)} · webm
            </span>
          </div>
        </div>

        {/* Transport, then the things that change something. Kept apart so
            Delete is never adjacent to Play. */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={toggle}
            iconLeft={
              status === "playing" ? <Pause size={15} /> : <Play size={15} />
            }
            className="min-w-28"
          >
            {status === "playing" ? "Pause" : "Play"}
          </Button>
          <Button
            variant="secondary"
            onClick={replay}
            iconLeft={<RotateCcw size={15} />}
          >
            Replay
          </Button>
        </div>

        <div className="h-0.5 w-full bg-ink" aria-hidden />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            href={url}
            download={downloadName}
            iconLeft={<Download size={13} />}
          >
            Download
          </Button>

          {attemptId && kept !== "yes" && (
            <Button
              variant="secondary"
              size="sm"
              loading={kept === "saving"}
              iconLeft={<Save size={13} />}
              onClick={() => {
                setKept("saving");
                void keepTake(attemptId, recording).then(async (ok) => {
                  if (!ok) return setKept("failed");
                  // Prune immediately so the cap is real at the moment it is
                  // claimed, rather than at some later visit to the archive.
                  await pruneTakes(loadAttempts().map((a) => a.id));
                  setKept("yes");
                });
              }}
            >
              Keep this take
            </Button>
          )}

          {confirmDelete ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={onDelete}
                iconLeft={<Trash2 size={13} />}
              >
                Delete for good
              </Button>
              {/* "Cancel", not "Keep it" — there is now a Keep this take
                  button a few pixels away that means something else entirely,
                  and two Keeps on one row is how someone stores a recording
                  they were trying to abandon. */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              iconLeft={<Trash2 size={13} />}
            >
              Delete
            </Button>
          )}

          <div className="ml-auto">
            <Button size="sm" href="/play" iconLeft={<Shuffle size={13} />}>
              New challenge
            </Button>
          </div>
        </div>

        {/* Says where it went and what the limit is. The cap is announced
            rather than enforced quietly, because dropping someone's oldest
            recording without a word is the same silent data loss the attempt
            store shipped once already. */}
        {attemptId && (
          <p className="type-hud leading-relaxed text-slate">
            {kept === "yes"
              ? `Kept on this device. The archive replays your last ${KEEP_LIMIT}; older takes are dropped as new ones are kept.`
              : kept === "failed"
                ? "Could not be kept. Session history is switched off, or the browser refused the storage."
                : "Otherwise this take is gone when you close the tab."}
          </p>
        )}

        {confirmDelete && (
          <p className="type-hud text-alert">
            This take only exists here. Deleting it cannot be undone.
          </p>
        )}
      </div>
    </Panel>
  );
}

/** Shown once the take is gone, or when there was never one to show. */
export function ReviewEmpty({ reason }: { reason: string }) {
  return (
    <Panel chrome="window" title="Review" notch={6} sprig={false}>
      <div className="space-y-4 py-6">
        <p className="font-mono text-sm text-graphite">{reason}</p>
        <Button size="sm" href="/play" iconLeft={<Shuffle size={13} />}>
          New challenge
        </Button>
      </div>
    </Panel>
  );
}
