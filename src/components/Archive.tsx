"use client";

import * as React from "react";
import { ChevronRight, Shuffle, Trash2 } from "lucide-react";
import { Badge, Button, Panel, PixelFrame, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { fileNameFor, getTopic } from "@/lib/topics";
import {
  deleteAttempt,
  getAttemptsServerSnapshot,
  getAttemptsSnapshot,
  subscribeAttempts,
  type StoredAttempt,
} from "@/lib/attempts";
import { SCORE_KEYS, SCORE_LABELS } from "@/lib/ai/types";

/**
 * Archive — what you said, session by session.
 *
 * The dashboard answers "how am I doing" with a handful of derived figures.
 * This answers "what did I say that time", which needs the individual take,
 * and the two stay separate because merging them produces a weak version of
 * both.
 *
 * Every report was already being stored; until now only the averages were
 * readable, so a specific session's feedback existed and could not be seen.
 * Rows expand in place rather than navigating: a session is a small thing and
 * a route transition to read four lines is a worse experience than a shade.
 *
 * The recording is not here and cannot be. Takes live in memory for the length
 * of the report and die with the tab — deliberately, since every one is video
 * of someone's face in their home.
 */

function shortDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function Row({ attempt }: { attempt: StoredAttempt }) {
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const topic = getTopic(attempt.topicId);
  const fb = attempt.aiFeedback;
  const score = fb?.overallScore ?? null;

  return (
    <div className="border-b-2 border-mint-soft last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors duration-150 hover:text-mint-shade"
        >
          <ChevronRight
            size={13}
            className={cn(
              "ease-pixel shrink-0 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
          <span className="shrink-0 font-mono text-xs text-graphite">
            {topic ? fileNameFor(topic) : attempt.topicId}
          </span>
          {/* Safe to show: the session is over, so there is no synthesis
              left to give away. */}
          <span className="min-w-0 flex-1 truncate text-sm text-graphite">
            {topic?.title ?? "Unknown topic"}
          </span>
        </button>

        <span className="type-hud shrink-0 text-mute">
          {shortDate(attempt.completedAt)}
        </span>
        <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-slate">
          {score !== null ? score : "—"}
        </span>
      </div>

      <div className="window-shade" data-open={open}>
        <div>
          <div className="space-y-4 bg-mint-mist px-4 py-4">
            {fb ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={fb.source === "mock" ? "alert" : "mint"}>
                    {fb.source === "mock" ? "Sample scores" : "Model"}
                  </Badge>
                  <span className="type-hud text-slate">
                    {Math.round(attempt.recordedMs / 1000)}s spoken
                  </span>
                  {fb.metrics.wordsPerMinute !== null && (
                    <span className="type-hud text-slate">
                      {fb.metrics.wordsPerMinute} wpm
                    </span>
                  )}
                  {fb.fillerWords && (
                    <span className="type-hud text-slate">
                      {fb.fillerWords.total} fillers
                    </span>
                  )}
                </div>

                {fb.summary && (
                  <p className="text-sm leading-relaxed text-graphite">
                    {fb.summary}
                  </p>
                )}

                {fb.scores && (
                  <div className="space-y-1.5">
                    {SCORE_KEYS.map((k) =>
                      typeof fb.scores?.[k] === "number" ? (
                        <div key={k} className="flex items-center gap-3">
                          <span className="type-hud w-28 shrink-0 text-graphite">
                            {SCORE_LABELS[k]}
                          </span>
                          <ProgressBar
                            value={(fb.scores[k] as number) / 100}
                            variant="segmented"
                            segments={10}
                            size="sm"
                            className="min-w-0 flex-1"
                          />
                          <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-slate">
                            {fb.scores[k]}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}

                {fb.strongestMoment && (
                  <PixelFrame notch={3} border={2} innerClassName="px-3 py-2">
                    <span className="type-hud text-affirm">
                      Strongest moment
                    </span>
                    <p className="mt-1 text-sm text-graphite">
                      {fb.strongestMoment.text}
                    </p>
                    {fb.strongestMoment.quote && (
                      <p className="mt-1 border-l-2 border-mint-deep pl-2 font-mono text-xs text-slate">
                        &ldquo;{fb.strongestMoment.quote}&rdquo;
                      </p>
                    )}
                  </PixelFrame>
                )}

                {fb.transcript && (
                  <details>
                    <summary className="type-hud cursor-pointer text-slate">
                      Transcript
                    </summary>
                    <p className="mt-2 font-mono text-xs leading-relaxed text-graphite">
                      {fb.transcript.text}
                    </p>
                  </details>
                )}
              </>
            ) : (
              <p className="font-mono text-xs leading-relaxed text-slate">
                This session was recorded before analysis existed, or the
                analysis did not run. Only the timings were kept.
              </p>
            )}

            <div className="flex items-center gap-2 border-t-2 border-ink pt-3">
              {confirm ? (
                <>
                  <Button
                    size="sm"
                    variant="danger"
                    iconLeft={<Trash2 size={13} />}
                    onClick={() => deleteAttempt(attempt.id)}
                  >
                    Delete this session
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirm(false)}
                  >
                    Keep
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<Trash2 size={13} />}
                  onClick={() => setConfirm(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Archive() {
  const list = React.useSyncExternalStore(
    subscribeAttempts,
    getAttemptsSnapshot,
    getAttemptsServerSnapshot,
  );
  const ready = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const rows = [...list].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  );

  return (
    <Panel
      chrome="window"
      title="Archive"
      notch={6}
      flush
      actions={
        ready ? (
          <span className="type-hud text-slate">
            {rows.length} session{rows.length === 1 ? "" : "s"}
          </span>
        ) : undefined
      }
    >
      {!ready ? (
        <p className="px-4 py-6 font-mono text-sm text-slate">
          Reading history…
        </p>
      ) : rows.length === 0 ? (
        <div className="space-y-4 px-4 py-6">
          <p className="font-mono text-sm leading-relaxed text-slate">
            Nothing here yet. Every session you finish is kept on this device,
            with its report, so you can read back what you actually said.
          </p>
          <Button size="sm" href="/play" iconLeft={<Shuffle size={13} />}>
            Start a session
          </Button>
        </div>
      ) : (
        <div>
          {rows.map((a) => (
            <Row key={a.id} attempt={a} />
          ))}
        </div>
      )}
    </Panel>
  );
}
