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
import { openNotice, revokeConsent, useConsent } from "@/lib/consent";
import { clearTakes } from "@/lib/recordings";
import {
  achievementsFrom,
  categoryProgress,
  categoryScores,
  clearedCategories,
  collectionProgress,
  completedIds,
  favouriteCategory,
  improvement,
  nextMilestone,
  sampleScoredCount,
  scoreAverages,
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
      {/* `w-32`, measured rather than guessed. Silkscreen at 10px with 0.14em
          tracking runs about 11.9px per character, so the four ten-letter
          categories — PHILOSOPHY, TECHNOLOGY, PSYCHOLOGY, ECONOMICS — need
          roughly 119px. At `w-24` they overran into the first block of their
          own meter; at `w-28` they still overflowed the box and were only
          rescued by the 12px gap. 128px contains them.

          Fixed rather than sized to content, because the meters have to start
          on one line down the list. */}
      <span className="type-hud w-32 shrink-0 text-graphite">{category}</span>
      <ProgressBar
        value={ratio}
        variant="segmented"
        segments={total || 1}
        size="sm"
        className="min-w-0 flex-1"
        ariaLabel={`${category} progress`}
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
  const consent = useConsent();
  const when = ready ? new Date() : new Date(0);

  const done = completedIds(list);
  const categories = categoryProgress(done);
  const collection = collectionProgress(done);
  const favourite = favouriteCategory(done);
  const cleared = clearedCategories(done);
  const streak = streakFrom(list, when);
  const achievements = achievementsFrom(list, when);
  const averages = scoreAverages(list);
  const catScores = categoryScores(list);
  const trend = improvement(list);
  const milestone = nextMilestone(collection.done, collection.total);
  const sampleCount = sampleScoredCount(list);
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
      {/* The dashboard is a grid of tiles with no one panel that names it, so
          the heading is hidden rather than invented as a visible header the
          design does not want. */}
      <h1 className="sr-only">Dashboard</h1>
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
                  ? `${milestone.remaining} to reach ${milestone.target}`
                  : "Reading history"
              }
            >
              {/* Against the next milestone, not the full 350. One percent of a
                  large cabinet reads as "you have done nothing", which is both
                  discouraging and untrue. */}
              <ProgressBar
                value={ready ? milestone.ratio : 0}
                variant="pill"
                ariaLabel={`Progress to ${milestone.target} topics`}
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
                ariaLabel={
                  favourite
                    ? `${favourite.category} progress`
                    : "Favourite category progress"
                }
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
            title="Speaking scores"
            notch={6}
            sprig={false}
            actions={
              averages.count > 0 ? (
                <span className="type-hud text-slate">
                  {averages.count} scored
                </span>
              ) : undefined
            }
          >
            {averages.count === 0 ? (
              <p className="font-mono text-sm leading-relaxed text-slate">
                {sampleCount > 0
                  ? `${sampleCount} session${sampleCount === 1 ? "" : "s"} carry sample scores, which are not averaged here — they are placeholder numbers, not a judgement of how you spoke. Connect a model and real scores will appear.`
                  : "No scored sessions yet. Finish a talk and the report’s scores are kept here so you can watch them move."}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <span className="type-hud text-slate">Average score</span>
                    <div className="font-mono text-4xl leading-none tabular-nums">
                      {averages.overall}
                      <span className="type-caps ml-2 text-slate">/ 100</span>
                    </div>
                  </div>

                  {trend && (
                    <div>
                      <span className="type-hud text-slate">
                        Recent vs earlier
                      </span>
                      <div
                        className={cn(
                          "font-mono text-2xl leading-none tabular-nums",
                          trend.delta > 0 && "text-affirm",
                          trend.delta < 0 && "text-alert",
                        )}
                      >
                        {trend.delta > 0 ? "+" : ""}
                        {trend.delta}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {averages.byDimension.map((d) => (
                    <div key={d.key} className="flex items-center gap-3">
                      <span className="type-hud w-44 shrink-0 text-graphite">
                        {d.label}
                      </span>
                      <ProgressBar
                        value={d.value / 100}
                        variant="segmented"
                        segments={10}
                        size="sm"
                        className="min-w-0 flex-1"
                        ariaLabel={`${d.label}, average score`}
                      />
                      <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-slate">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>

                {catScores.length > 1 && (
                  <div className="flex flex-wrap gap-4 border-t-2 border-ink pt-3">
                    <span className="type-hud text-slate">
                      Strongest: {catScores[0].category} (
                      {catScores[0].average})
                    </span>
                    <span className="type-hud text-slate">
                      Weakest: {catScores[catScores.length - 1].category} (
                      {catScores[catScores.length - 1].average})
                    </span>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </Desk>
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
                      // Recordings go with the history. Erasing the sessions
                      // and leaving the video would be the opposite of what
                      // this button says, and video is the heavier of the two.
                      void clearTakes();
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
            </>
          )}

          {/* The storage controls, pushed to the trailing edge by `ml-auto`.
              "Stored in this browser only" used to be a bare line of text
              floating between the buttons, which read as a caption that had
              lost its picture — and it was the only thing on the row that
              looked interactive without being so. It is a button now, and it
              does the thing that sentence was hinting at: reopens the notice
              so you can read what you agreed to.

              Withdrawal sits beside it, because the two belong together and
              neither belongs next to Start a session. */}
          {ready && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* `secondary`, not `ghost`. Ghost has no plates by design, so
                  this was still a bare line of text on the trailing edge —
                  which is most of what was wrong with it as a caption. If it
                  is a button it should look pressable. */}
              <Button size="sm" variant="secondary" onClick={openNotice}>
                Stored in this browser
              </Button>
              {consent === "granted" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    revokeConsent(() => {
                      void clearTakes();
                      clearAttempts();
                    })
                  }
                >
                  Stop keeping history
                </Button>
              )}
            </div>
          )}
        </div>
      </StaggerItem>
    </Stagger>
  );
}
