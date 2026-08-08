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
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { HomeStats } from "@/components/HomeStats";
import { tabsFor } from "@/lib/nav";
import { todaysChallenge } from "@/lib/mock";
import { ArrowRight, Lock } from "lucide-react";

/**
 * Landing page.
 *
 * The day's topic is real, drawn deterministically from the registry. The two
 * figures are real too and come from stored sessions — see `HomeStats`, which
 * is a client island because they only exist in the browser.
 *
 * Scoring is the part that is still missing, which is why nothing here reports
 * how well anything went.
 */

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
                      You get one unfamiliar idea, fifteen minutes to research
                      it, and one minute to explain it from your notes.
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                      <Button
                        size="lg"
                        href="/play"
                        iconRight={<ArrowRight size={16} />}
                      >
                        Start challenge
                      </Button>
                      {/* 15 minutes of research, then a minute of talking.
                          The old "~3 min" predated the research phase and
                          undersold the commitment by a factor of five. */}
                      <span className="type-hud text-slate">
                        ~16 min · no setup
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
                          [
                            "Research",
                            `${todaysChallenge.researchSeconds / 60}m`,
                          ],
                          ["Think", `${todaysChallenge.lockoutSeconds}s`],
                          ["Speak", `${todaysChallenge.speakSeconds}s`],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <div className="font-mono text-xl tabular-nums">
                            {value}
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
            {/* A client island: these read stored sessions, which only exist
                in the browser. Kept in one component with the dashboard's
                derivations so the two screens cannot report different streaks
                for the same history again. */}
            <HomeStats />
          </StaggerItem>
        </Stagger>
      </PageTransition>
    </Layout>
  );
}
