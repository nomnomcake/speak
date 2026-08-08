"use client";

import * as React from "react";
import { Badge, ProgressBar, StatTile } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  getAttemptsServerSnapshot,
  getAttemptsSnapshot,
  subscribeAttempts,
} from "@/lib/attempts";
import {
  collectionProgress,
  completedIds,
  streakFrom,
} from "@/lib/progress";

/**
 * HomeStats — the landing page's two figures, read from real sessions.
 *
 * A client island inside an otherwise static page. It exists because the
 * landing page and the dashboard were reporting different numbers for the same
 * thing: one hardcoded a seven-day streak while the other counted what had
 * actually happened. Two truths on two screens is worse than no figures at
 * all, because the user has no way to tell which one is lying.
 *
 * Same store and same derivations as the dashboard, so they cannot drift
 * again.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Formatted by hand: `toLocaleDateString` varies by machine locale. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** A row of blocks, one per day. Filled = a session was completed. */
function WeekStrip({ days }: { days: boolean[] }) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="flex items-end gap-1.5">
      {days.map((done, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span
            aria-label={`${labels[i]}: ${done ? "completed" : "missed"}`}
            className={cn(
              "block size-5 border-2 border-ink",
              done ? "bg-mint-deep" : "bg-paper",
            )}
          />
          <span className="type-hud text-mute">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function HomeStats() {
  const list = React.useSyncExternalStore(
    subscribeAttempts,
    getAttemptsSnapshot,
    getAttemptsServerSnapshot,
  );

  // The server cannot know what day it is where the user is, so the streak
  // waits for the client rather than rendering a guess and correcting it.
  const ready = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const when = ready ? new Date() : new Date(0);
  const streak = streakFrom(list, when);
  const collection = collectionProgress(completedIds(list));

  const first = list.reduce<string | null>(
    (earliest, a) =>
      earliest === null || a.completedAt < earliest ? a.completedAt : earliest,
    null,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatTile
        title="Current streak"
        value={ready ? streak.current : "—"}
        unit="days"
        footnote={
          ready ? `Personal best: ${streak.best} days` : "Reading history"
        }
        // Only claims "active" when it is. A permanent badge is a sticker.
        actions={
          ready && streak.current > 0 ? (
            <Badge tone="affirm">Active</Badge>
          ) : undefined
        }
      >
        <WeekStrip days={streak.week} />
      </StatTile>

      <StatTile
        title="Topics completed"
        value={ready ? collection.done : "—"}
        unit={`of ${collection.total}`}
        footnote={
          !ready
            ? "Reading history"
            : first
              ? `Since ${shortDate(first)}`
              : "No sessions yet"
        }
      >
        {/* Was "average clarity", which had no source — nothing scores a take
            yet. This is the same collection figure the dashboard shows. */}
        <ProgressBar
          value={ready ? collection.ratio : 0}
          label="Collection"
          showValue
        />
      </StatTile>
    </div>
  );
}
