import {
  Badge,
  Panel,
  PixelFrame,
  ProgressBar,
  Stamp,
  StatTile,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { fileNameFor, getTopic, type Category } from "@/lib/topics";
import { achievements, recentSessions, streak, totals } from "@/lib/mock";
import {
  categoryProgress,
  clearedCategories,
  collectionProgress,
  favouriteCategory,
} from "@/lib/progress";

/**
 * Dashboard — the control panel.
 *
 * A desk of small windows rather than one scrolling report: the point of a
 * control panel is that each thing is its own object you could pick up. They
 * lift a pixel on hover to say so, and none of them actually move — see the
 * `desk-panel` utility for why that is deliberate.
 *
 * Every figure here derives from one list of completed topic ids. Nothing on
 * this screen is a number typed in next to another number.
 */

/** Wraps a panel so the whole thing lifts, since Panel owns its own markup. */
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
    <div className="group/row flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-mint-mist">
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

      {/* Only the finished ones get a mark. A tick on every row is wallpaper. */}
      <span className="w-4 shrink-0">
        {cleared && <span className="block text-affirm">★</span>}
      </span>
    </div>
  );
}

export function Dashboard() {
  const categories = categoryProgress();
  const collection = collectionProgress();
  const favourite = favouriteCategory();
  const cleared = clearedCategories();
  const earned = achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-5">
      {/* Row one: the three numbers someone opens this screen to see. */}
      <div className="grid gap-5 md:grid-cols-3">
        <Desk>
          <StatTile
            title="Current streak"
            value={streak.current}
            unit="days"
            footnote={`Best ${streak.best}`}
          >
            {/* Seven stamps, one per day. A calendar strip beats a number for
                the same reason a sticker chart does: you can see the gap. */}
            <div className="flex gap-1">
              {streak.week.map((hit, i) => (
                <span
                  key={i}
                  className={cn(
                    "pixel-clip block h-6 flex-1 border-2 border-ink",
                    hit ? "bg-mint-deep" : "bg-paper",
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
            value={collection.done}
            unit={`of ${collection.total}`}
            footnote={`${totals.challenges} attempts since ${totals.since}`}
          >
            <ProgressBar value={collection.ratio} variant="pill" />
          </StatTile>
        </Desk>

        <Desk>
          <StatTile
            title="Favourite category"
            value={favourite ? favourite.done : 0}
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

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Category progress — the widest thing, so it gets two columns. */}
        <Desk className="lg:col-span-2">
          <Panel
            chrome="window"
            title="Category progress"
            notch={6}
            sprig={false}
            flush
            actions={
              <span className="type-hud text-slate">
                {collection.done}/{collection.total}
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
              {recentSessions.map((s) => {
                const topic = getTopic(s.topicId);
                return (
                  <div
                    key={`${s.topicId}-${s.at}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-mint-mist"
                    // The title is safe to show here: this session is over, so
                    // there is no synthesis left to give away.
                    title={topic?.title}
                  >
                    <span className="font-mono text-xs text-graphite">
                      {topic ? fileNameFor(topic) : s.topicId}
                    </span>
                    <span className="type-hud ml-auto text-mute">{s.at}</span>
                    <span className="w-9 text-right font-mono text-xs tabular-nums text-slate">
                      {Math.round(s.clarity * 100)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </Desk>
      </div>

      {/* The sticker book. */}
      <Desk>
        <Panel
          chrome="window"
          title="Achievements"
          notch={6}
          sprig={false}
          sky={{ density: "sparse" }}
          actions={
            <Badge tone="mint">
              {earned}/{achievements.length}
            </Badge>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {achievements.map((a, i) => (
              <PixelFrame
                key={a.id}
                notch={4}
                border={2}
                shadow={a.earned ? 4 : 0}
                // Locked is `mist`, never `ghost`. A transparent fill sits on
                // top of the black border plate and renders as solid black —
                // the trap component-map.md warns about — which turned the
                // locked stickers into unreadable dark slabs.
                tone={a.earned ? "paper" : "mist"}
                // Alternating tilt so the grid reads as things stuck on a page
                // rather than cells in a table. Straightens on hover.
                className={cn("sticker", !a.earned && "opacity-75")}
                style={{ ["--tilt" as string]: `${i % 2 === 0 ? -1.5 : 1.5}deg` }}
                innerClassName="flex h-full flex-col items-center gap-2 px-3 py-4 text-center"
              >
                <Stamp
                  tone={a.earned ? "alert" : "mint"}
                  rotate={a.earned ? -4 : 0}
                >
                  {a.earned ? "Earned" : "Locked"}
                </Stamp>

                <span className="type-caps text-graphite">{a.label}</span>
                <span className="type-hud text-mute">{a.detail}</span>
              </PixelFrame>
            ))}
          </div>
        </Panel>
      </Desk>
    </div>
  );
}
