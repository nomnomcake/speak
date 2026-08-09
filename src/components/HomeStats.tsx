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
  nextMilestone,
  shortLocalDate,
  streakFrom,
  weekLabels,
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


/**
 * A row of blocks, one per day. Filled = a session was completed.
 *
 * Labels are computed from the actual dates. They were hardcoded as
 * M-T-W-T-F-S-S, but the strip is the last seven days *ending today*, so the
 * letters were only correct on a Sunday — and they are read out by screen
 * readers, which were being told the wrong day six times a week.
 */
function WeekStrip({ days, labels }: { days: boolean[]; labels: string[] }) {
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
  const milestone = nextMilestone(collection.done, collection.total);
  const labels = weekLabels(when);

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
        <WeekStrip days={streak.week} labels={labels} />
      </StatTile>

      <StatTile
        title="Topics completed"
        value={ready ? collection.done : "—"}
        unit={`of ${collection.total}`}
        footnote={
          !ready
            ? "Reading history"
            : first
              ? `Since ${shortLocalDate(first)}`
              : "No sessions yet"
        }
      >
        {/* The same milestone bar the dashboard draws. This tile previously fed
            the raw collection ratio while the dashboard fed the milestone one,
            so three sessions read as "1%" here and a 22%-full bar there — the
            exact two-truths problem this component was written to end. */}
        <ProgressBar
          value={ready ? milestone.ratio : 0}
          label={ready ? `Next: ${milestone.target}` : "Collection"}
        />
      </StatTile>
    </div>
  );
}
