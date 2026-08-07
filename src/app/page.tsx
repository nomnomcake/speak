import {
  Badge,
  Button,
  Divider,
  GlowBorder,
  Layout,
  Logo,
  PageTransition,
  Panel,
  PixelFrame,
  ProgressBar,
  StatTile,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { tabsFor } from "@/lib/nav";
import { todaysChallenge, streak, totals } from "@/lib/mock";
import { ArrowRight, Lock } from "lucide-react";

/**
 * Landing page.
 *
 * Phase 2: real layout, mock data. No timers, no session state, no scoring.
 * "Start challenge" is intentionally inert — /session does not exist yet, and
 * a button that 404s is worse than one that waits.
 */

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

export default function HomePage() {
  return (
    <Layout tabs={tabsFor("home")}>
      <PageTransition>
        <Stagger className="space-y-6">
          {/* ---- Hero ------------------------------------------------- */}
          <StaggerItem>
            <GlowBorder rings={3} step={5} notch={6}>
              <Panel
                chrome="window"
                title="Learn it fast. Say it clearly."
                notch={6}
                sky={{ density: "dense", sun: true }}
              >
                <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
                  {/* Logo, supporting line, primary action */}
                  <PixelFrame
                    notch={4}
                    className="md:col-span-2"
                    innerClassName="flex h-full flex-col justify-center gap-6 p-6 sm:p-8"
                  >
                    <Logo size="lg" />

                    <p className="max-w-md text-base leading-relaxed text-graphite">
                      You get one unfamiliar idea, a minute to absorb it, and
                      ninety seconds to explain it from memory.
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                      <Button
                        size="lg"
                        href="/play"
                        iconRight={<ArrowRight size={16} />}
                      >
                        Start challenge
                      </Button>
                      <span className="type-hud text-slate">
                        ~3 min · no setup
                      </span>
                    </div>
                  </PixelFrame>

                  {/* Today's topic — sealed */}
                  <PixelFrame
                    tone="ink"
                    notch={4}
                    innerClassName="flex h-full flex-col gap-4 p-5 text-paper"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="type-hud text-mint">Today&rsquo;s topic</span>
                      <Badge tone="mint">
                        <Lock size={9} />
                        Sealed
                      </Badge>
                    </div>

                    <Divider solid className="bg-paper" />

                    <div className="space-y-3">
                      <div>
                        <div className="type-hud text-mint">Category</div>
                        <div className="text-lg font-semibold capitalize">
                          {todaysChallenge.category}
                        </div>
                      </div>
                      <div>
                        <div className="type-hud text-mint">Difficulty</div>
                        <div className="text-lg font-semibold capitalize">
                          {todaysChallenge.difficulty}
                        </div>
                      </div>
                    </div>

                    <Divider solid className="mt-auto bg-paper" />

                    <div className="grid grid-cols-3 gap-2 text-center">
                      {(
                        [
                          ["Read", todaysChallenge.readSeconds],
                          ["Think", todaysChallenge.lockoutSeconds],
                          ["Speak", todaysChallenge.speakSeconds],
                        ] as const
                      ).map(([label, secs]) => (
                        <div key={label}>
                          <div className="font-mono text-xl tabular-nums">
                            {secs}s
                          </div>
                          <div className="type-hud text-mint">{label}</div>
                        </div>
                      ))}
                    </div>

                    <p className="type-hud leading-relaxed text-mute">
                      Title hidden until the readout
                    </p>
                  </PixelFrame>
                </div>
              </Panel>
            </GlowBorder>
          </StaggerItem>

          {/* ---- Stats ------------------------------------------------ */}
          <StaggerItem>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatTile
                title="Current streak"
                value={streak.current}
                unit="days"
                footnote={`Personal best ${streak.best} days`}
                actions={<Badge tone="affirm">Active</Badge>}
              >
                <WeekStrip days={streak.week} />
              </StatTile>

              <StatTile
                title="Total challenges"
                value={totals.challenges}
                unit="completed"
                footnote={`Since ${totals.since}`}
              >
                <ProgressBar
                  value={totals.averageClarity}
                  label="Average clarity"
                  showValue
                />
              </StatTile>
            </div>
          </StaggerItem>
        </Stagger>
      </PageTransition>
    </Layout>
  );
}
