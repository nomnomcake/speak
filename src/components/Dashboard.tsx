"use client";

import * as React from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Panel,
  PixelFrame,
  ProgressBar,
  Stagger,
  StaggerItem,
  Stamp,
  StatTile,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { fileNameFor, getTopic, type Category } from "@/lib/topics";
import {
  clearAttempts,
  getAttemptsServerSnapshot,
  getAttemptsSnapshot,
  subscribeAttempts,
} from "@/lib/attempts";
import {
  achievementsFrom,
  categoryProgress,
  clearedCategories,
  collectionProgress,
  completedIds,
  favouriteCategory,
  streakFrom,
} from "@/lib/progress";

/**
 * Dashboard — the control panel, reading real sessions.
 *
 * A desk of small windows rather than one scrolling report. They lift a pixel
 * on hover to say they are objects; none of them actually move — see the
 * `desk-panel` utility for why that is deliberate.
 *
 * Everything is derived from stored attempts. There are no numbers on this
 * screen that are not the consequence of a session someone actually did, which
 * is why the average-clarity and total-attempts figures that used to sit here
 * are gone: nothing scores a take yet, so those were decoration.
 */

function Desk({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("desk-panel", className)}>{children}</div>;
}

function CategoryRow({
  category,
  done,
  total,
  ratio,
}: {
  category: Category;
  done: number;
  total: number;
  ratio: number;
}) {
  const cleared = total > 0 && done === total;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-mint-mist">
      <span className="type-hud w-24 shrink-0 text-graphite">{category}</span>
      <ProgressBar
        value={ratio}
        variant="segmented"
        segments={total || 1}
        size="sm"
        className="min-w-0 flex-1"
      />
      <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-slate">
        {done}/{total}
      </span>
      <span className="w-4 shrink-0">
        {cleared && <span className="block text-affirm">★</span>}
      </span>
    </div>
  );
}

function secondsLabel(ms: number) {
  if (ms <= 0) return "—";
  return `${Math.round(ms / 1000)}s`;
}

export function Dashboard() {
  /**
   * `null` until mounted, and the first client render must match the server's.
   *
   * localStorage does not exist during SSR, so reading it inline would render
   * one tree on the server and a different one on the client — the hydration
   * mismatch this project has already been bitten by once. The effect runs
   * after the matching render, and `ready` keeps the figures blank rather than
   * flashing zeroes that are about to become real numbers.
   */
  const list = React.useSyncExternalStore(
    subscribeAttempts,
    getAttemptsSnapshot,
    getAttemptsServerSnapshot,
  );

  // Same mechanism, used only to know which side of hydration we are on. The
  // server can never answer "what day is it for the user", so the streak has
  // to wait for the client rather than guess and be corrected.
  const ready = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [confirmClear, setConfirmClear] = React.useState(false);
  const when = ready ? new Date() : new Date(0);

  const done = completedIds(list);
  const categories = categoryProgress(done);
  const collection = collectionProgress(done);
  const favourite = favouriteCategory(done);
  const cleared = clearedCategories(done);
  const streak = streakFrom(list, when);
  const achievements = achievementsFrom(list, when);
  const earned = achievements.filter((a) => a.earned).length;

  const recent = [...list]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 6);

  const dash = (v: React.ReactNode) => (ready ? v : "—");

  return (
    /**
     * The desk assembles itself, the way the landing page does.
     *
     * The stagger sits on `StaggerItem`, one element above `Desk`, and that
     * separation is load-bearing: `page-in` ends on `transform: none` with
     * `fill-mode: both`, and a finished animation outranks a plain declaration
     * — so putting both on the same element would leave every panel's hover
     * lift permanently overridden by the entrance it just finished.
     */
    <Stagger className="space-y-5">
      <StaggerItem>
        <div className="grid gap-5 md:grid-cols-3">
          <Desk>
            <StatTile
              title="Current streak"
              value={dash(streak.current)}
              unit="days"
              footnote={ready ? `Best: ${streak.best}` : "Reading history"}
            >
              <div className="flex gap-1">
                {streak.week.map((hit, i) => (
                  <span
                    key={i}
                    className={cn(
                      "pixel-clip block h-6 flex-1 border-2 border-ink",
                      ready && hit ? "bg-mint-deep" : "bg-paper",
                    )}
                    style={{ ["--notch" as string]: "2px" }}
                    title={hit ? "Session completed" : "No session"}
                  />
                ))}
              </div>
            </StatTile>
          </Desk>

          <Desk>
            <StatTile
              title="Completed topics"
              value={dash(collection.done)}
              unit={`of ${collection.total}`}
              footnote={
                ready
                  ? `${list.length} session${list.length === 1 ? "" : "s"} recorded`
                  : "Reading history"
              }
            >
              <ProgressBar
                value={ready ? collection.ratio : 0}
                variant="pill"
              />
            </StatTile>
          </Desk>

          <Desk>
            <StatTile
              title="Favourite category"
              value={dash(favourite ? favourite.done : 0)}
              unit={favourite ? favourite.category : "none yet"}
              footnote={
                cleared.length > 0
                  ? `Cleared: ${cleared.join(", ")}`
                  : "No category cleared yet"
              }
            >
              <ProgressBar
                value={favourite ? favourite.ratio : 0}
                variant="segmented"
                segments={favourite ? favourite.total : 3}
                size="sm"
              />
            </StatTile>
          </Desk>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="grid gap-5 lg:grid-cols-3">
          <Desk className="lg:col-span-2">
            <Panel
              chrome="window"
              title="Category progress"
              notch={6}
              sprig={false}
              flush
              actions={
                <span className="type-hud text-slate">
                  {dash(`${collection.done}/${collection.total}`)}
                </span>
              }
            >
              <div className="divide-y divide-mint-soft py-1">
                {categories.map((c) => (
                  <CategoryRow key={c.category} {...c} />
                ))}
              </div>
            </Panel>
          </Desk>

          <Desk>
            <Panel
              chrome="window"
              title="Recent sessions"
              notch={6}
              sprig={false}
              flush
            >
              <div className="divide-y divide-mint-soft py-1">
                {recent.length === 0 && (
                  <div className="px-4 py-5">
                    <p className="type-hud text-mute">
                      {ready ? "Nothing yet" : "Reading history"}
                    </p>
                  </div>
                )}

                {recent.map((a) => {
                  const topic = getTopic(a.topicId);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-mint-mist"
                      // Safe to show: this session is over, so there is no
                      // synthesis left to give away.
                      title={topic?.title}
                    >
                      <span className="font-mono text-xs text-graphite">
                        {topic ? fileNameFor(topic) : a.topicId}
                      </span>
                      <span className="type-hud ml-auto text-mute">
                        {a.completedAt.slice(0, 10)}
                      </span>
                      <span className="w-9 text-right font-mono text-xs tabular-nums text-slate">
                        {secondsLabel(a.recordedMs)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </Desk>
        </div>
      </StaggerItem>

      <StaggerItem>
        <Desk>
          <Panel
            chrome="window"
            title="Achievements"
            notch={6}
            // The dashboard's one sprig. This is the sky panel and the screen's
            // signature window; the tiles and lists above it go without.
            sky={{ density: "sparse" }}
            actions={
              <Badge tone="mint">
                {dash(`${earned}/${achievements.length}`)}
              </Badge>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {achievements.map((a, i) => {
                const on = ready && a.earned;
                return (
                  <PixelFrame
                    key={a.id}
                    notch={4}
                    border={2}
                    shadow={on ? 4 : 0}
                    // Never `ghost`: a transparent fill sits on the black border
                    // plate and renders solid black, which turned these into
                    // unreadable slabs once already.
                    tone={on ? "paper" : "mist"}
                    className={cn("sticker", !on && "opacity-75")}
                    style={{
                      ["--tilt" as string]: `${i % 2 === 0 ? -1.5 : 1.5}deg`,
                    }}
                    innerClassName="flex h-full flex-col items-center gap-2 px-3 py-4 text-center"
                  >
                    <Stamp tone={on ? "alert" : "mint"} rotate={on ? -4 : 0}>
                      {on ? "Earned" : "Locked"}
                    </Stamp>
                    <span className="type-caps text-graphite">{a.label}</span>
                    <span className="type-hud text-mute">{a.detail}</span>
                  </PixelFrame>
                );
              })}
            </div>
          </Panel>
        </Desk>
      </StaggerItem>

      {/* Housekeeping, kept last and quiet. */}
      <StaggerItem>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" href="/play" iconLeft={<Sparkles size={13} />}>
            Start a session
          </Button>

          {ready && list.length > 0 && (
            <>
              {confirmClear ? (
                <>
                  <Button
                    size="sm"
                    variant="danger"
                    iconLeft={<RotateCcw size={13} />}
                    // No local state to update: clearAttempts notifies the store
                    // and useSyncExternalStore re-reads it.
                    onClick={() => {
                      clearAttempts();
                      setConfirmClear(false);
                    }}
                  >
                    Erase {list.length} session
                    {list.length === 1 ? "" : "s"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<RotateCcw size={13} />}
                  onClick={() => setConfirmClear(true)}
                >
                  Clear history
                </Button>
              )}
              <span className="type-hud text-mute">
                Stored in this browser only
              </span>
            </>
          )}
        </div>
      </StaggerItem>
    </Stagger>
  );
}
