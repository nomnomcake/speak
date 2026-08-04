import {
  Badge,
  Button,
  Card,
  Divider,
  GlowBorder,
  Layout,
  PageTransition,
  Panel,
  PixelFrame,
  ProgressBar,
  Spinner,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { palette, space } from "@/lib/tokens";
import { ArrowRight, Mic, RotateCcw, Play } from "lucide-react";

/**
 * Design system reference.
 *
 * Static by design — this phase ships the visual language only. Every value
 * shown here is illustrative; no timers, state, or business logic.
 */

function Section({
  index,
  title,
  note,
  children,
}: {
  index: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <StaggerItem>
      <section className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-hud text-slate">{index}</span>
          <h2 className="text-caps text-base">{title}</h2>
          <div aria-hidden className="pixel-rule mt-1 hidden flex-1 sm:block" />
        </div>
        {note && (
          <p className="max-w-2xl text-sm leading-relaxed text-graphite">
            {note}
          </p>
        )}
        {children}
      </section>
    </StaggerItem>
  );
}

const SWATCHES: Array<{ name: string; token: string; hex: string }> = [
  { name: "Ink", token: "--color-ink", hex: palette.ink },
  { name: "Graphite", token: "--color-graphite", hex: palette.graphite },
  { name: "Slate", token: "--color-slate", hex: palette.slate },
  { name: "Paper", token: "--color-paper", hex: palette.paper },
  { name: "Mint Mist", token: "--color-mint-mist", hex: palette.mintMist },
  { name: "Mint Soft", token: "--color-mint-soft", hex: palette.mintSoft },
  { name: "Mint", token: "--color-mint", hex: palette.mint },
  { name: "Mint Deep", token: "--color-mint-deep", hex: palette.mintDeep },
  { name: "Mint Shade", token: "--color-mint-shade", hex: palette.mintShade },
  { name: "Glow", token: "--color-glow", hex: palette.glow },
  { name: "Alert", token: "--color-alert", hex: palette.alert },
  { name: "Affirm", token: "--color-affirm", hex: palette.affirm },
];

const SPACING = Object.entries(space).filter(([k]) => k !== "px");

export default function DesignSystemPage() {
  return (
    <Layout status={<Badge tone="mint">Design System</Badge>}>
      <PageTransition>
        <Stagger className="space-y-10">
          {/* ---- Hero ------------------------------------------------- */}
          <StaggerItem>
            <GlowBorder rings={3} step={5} notch={6}>
              <Panel
                chrome="window"
                title="SPEAK.EXE — Design System"
                notch={6}
                actions={<span className="text-hud text-slate">v0.1.0</span>}
              >
                <div className="grid gap-6 p-4 md:grid-cols-[1.4fr_1fr] md:items-center">
                  <div className="space-y-4">
                    <h1 className="text-4xl leading-[1.05] font-bold sm:text-5xl">
                      Learn it fast.
                      <br />
                      Say it clearly.
                    </h1>
                    <p className="max-w-lg text-sm leading-relaxed text-graphite">
                      Speak is a training simulator for synthesis under
                      pressure. This page is the component reference — the
                      shared visual language every screen is built from.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="lg" iconRight={<ArrowRight size={16} />}>
                        Start a session
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        iconLeft={<Play size={16} />}
                      >
                        Watch demo
                      </Button>
                    </div>
                  </div>

                  <PixelFrame
                    tone="ink"
                    notch={4}
                    innerClassName="space-y-3 p-4 text-paper"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-hud text-mint">Live readout</span>
                      <Badge tone="mint" pulse>
                        Rec
                      </Badge>
                    </div>
                    <Divider solid className="bg-paper" />
                    <ProgressBar value={0.82} label="Clarity" showValue invert />
                    <ProgressBar
                      value={0.64}
                      variant="segmented"
                      label="Density"
                      invert
                    />
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-hud text-mint">Words / min</span>
                      <span className="font-mono text-2xl tabular-nums">
                        148
                      </span>
                    </div>
                  </PixelFrame>
                </div>
              </Panel>
            </GlowBorder>
          </StaggerItem>

          {/* ---- 01 Palette ------------------------------------------- */}
          <Section
            index="01"
            title="Palette"
            note="Sampled from the reference: true black rules on paper white, over a mint field. Alert and Affirm are the only additions, desaturated far enough that they never break the near-monochrome read."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {SWATCHES.map((s) => (
                <PixelFrame key={s.token} notch={3}>
                  <div className="h-16 w-full" style={{ background: s.hex }} />
                  <div className="space-y-0.5 border-t-2 border-ink px-2.5 py-2">
                    <div className="text-caps text-[11px]">{s.name}</div>
                    <div className="font-mono text-[10px] text-slate uppercase">
                      {s.hex}
                    </div>
                  </div>
                </PixelFrame>
              ))}
            </div>
          </Section>

          {/* ---- 02 Typography ---------------------------------------- */}
          <Section
            index="02"
            title="Typography"
            note="Three families, strictly separated. Outfit carries everything readable, Silkscreen is reserved for micro-labels, Geist Mono for anything numeric."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <Card eyebrow="Outfit" title="Interface & prose">
                <div className="space-y-2">
                  <div className="text-3xl font-bold">Synthesis</div>
                  <div className="text-lg font-semibold">Semibold heading</div>
                  <p className="text-sm">
                    Body copy sits at 14px with relaxed leading. Long-form
                    briefs use the same face at 16px.
                  </p>
                </div>
              </Card>
              <Card eyebrow="Silkscreen" title="HUD micro-labels">
                <div className="space-y-3">
                  <div className="text-hud">Session · Ready · Archive</div>
                  <div className="text-hud text-slate">
                    Uppercase · 10px · 0.14em
                  </div>
                  <p className="text-sm">
                    Never set below 10px, and never used for sentences.
                  </p>
                </div>
              </Card>
              <Card eyebrow="Geist Mono" title="Numerics">
                <div className="space-y-2 font-mono tabular-nums">
                  <div className="text-3xl">02:14</div>
                  <div className="text-sm">148 WPM · 7 fillers</div>
                  <div className="text-sm text-slate">0123456789</div>
                </div>
              </Card>
            </div>
          </Section>

          {/* ---- 03 Buttons ------------------------------------------- */}
          <Section
            index="03"
            title="Buttons"
            note="Each key rests on a hard shadow plate and presses into it. Hover lifts one pixel, active drops the full offset. No springs — nothing in this system overshoots."
          >
            <Panel title="Variants" chrome="inline">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="mint">Mint</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>

                <Divider />

                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" iconLeft={<Mic size={13} />}>
                    Small
                  </Button>
                  <Button size="md" iconLeft={<Mic size={15} />}>
                    Medium
                  </Button>
                  <Button size="lg" iconLeft={<Mic size={17} />}>
                    Large
                  </Button>
                </div>

                <Divider />

                <div className="flex flex-wrap items-center gap-3">
                  <Button loading>Recording</Button>
                  <Button disabled>Disabled</Button>
                  <Button variant="secondary" iconLeft={<RotateCcw size={15} />}>
                    Retry
                  </Button>
                </div>
              </div>
            </Panel>
          </Section>

          {/* ---- 04 Surfaces ------------------------------------------ */}
          <Section
            index="04"
            title="Surfaces"
            note="Panel, Card and PixelFrame are the same primitive at three levels of chrome. Every one of them shares the stepped corner, which is what holds the system together."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel
                chrome="window"
                title="Window"
                notch={6}
                actions={<span className="text-hud text-slate">.EXE</span>}
              >
                <div className="p-3 text-sm leading-relaxed text-graphite">
                  Framed title bar. Used for top-level regions where the window
                  metaphor should be explicit.
                </div>
              </Panel>

              <Panel
                chrome="inline"
                title="Inline"
                footer={<span className="text-hud text-slate">Footer slot</span>}
              >
                <p className="text-sm leading-relaxed text-graphite">
                  Flush title with a rule beneath. The default for nested
                  modules and side rails.
                </p>
              </Panel>

              <Panel chrome="inline" title="Inverted" tone="ink">
                <p className="text-sm leading-relaxed text-mint-soft">
                  Ink tone flips the whole surface to white-on-black for focus
                  states and live readouts.
                </p>
              </Panel>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card eyebrow="Static" title="Card">
                Flat surface, no shadow. For dense grids.
              </Card>
              <Card eyebrow="Hover me" title="Interactive" interactive>
                Carries a shadow plate and slides into it on hover.
              </Card>
              <Card eyebrow="Tone" title="Mint" tone="mint">
                Tinted fill for grouping related cards.
              </Card>
              <Card
                eyebrow="Tone"
                title="Ink"
                tone="ink"
                trailing={<Badge tone="mint">04</Badge>}
              >
                Inverted card with a trailing slot.
              </Card>
            </div>
          </Section>

          {/* ---- 05 Meters -------------------------------------------- */}
          <Section
            index="05"
            title="Meters"
            note="The pill is the only rounded shape in the system. In the reference it is the sole curve on the page, which is precisely why it reads as a gauge and not a container."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Pill" chrome="inline">
                <div className="space-y-4">
                  <ProgressBar value={0.92} label="Clarity" showValue />
                  <ProgressBar value={0.64} label="Structure" showValue />
                  <ProgressBar value={0.38} label="Density" showValue />
                  <ProgressBar value={0.55} label="Pace" showValue hatch />
                </div>
              </Panel>

              <Panel title="Segmented & bar" chrome="inline">
                <div className="space-y-4">
                  <ProgressBar
                    value={0.75}
                    variant="segmented"
                    label="Confidence"
                    showValue
                  />
                  <ProgressBar
                    value={0.45}
                    variant="segmented"
                    segments={20}
                    label="Coverage"
                    showValue
                  />
                  <ProgressBar value={0.68} variant="bar" label="Signal" showValue />
                  <ProgressBar value={0.3} variant="bar" size="sm" />
                </div>
              </Panel>
            </div>
          </Section>

          {/* ---- 06 Feedback ------------------------------------------ */}
          <Section
            index="06"
            title="Feedback"
            note="Loading is quantised to eight steps. Badges carry status, and the pulse square marks anything live."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Spinner" chrome="inline">
                <div className="flex items-center gap-8 py-2">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                </div>
              </Panel>

              <Panel title="Badges" chrome="inline">
                <div className="flex flex-wrap items-center gap-2 py-2">
                  <Badge>Default</Badge>
                  <Badge tone="mint">Mint</Badge>
                  <Badge tone="paper">Paper</Badge>
                  <Badge tone="affirm">Passed</Badge>
                  <Badge tone="alert">Missed</Badge>
                  <Badge tone="ink" pulse>
                    Live
                  </Badge>
                </div>
              </Panel>

              <Panel title="Glow" chrome="inline">
                <div className="flex items-center justify-center py-4">
                  <GlowBorder rings={3} step={4} notch={4}>
                    <PixelFrame
                      notch={4}
                      innerClassName="px-5 py-3 text-caps text-sm"
                    >
                      Focus target
                    </PixelFrame>
                  </GlowBorder>
                </div>
              </Panel>
            </div>
          </Section>

          {/* ---- 07 Spacing ------------------------------------------- */}
          <Section
            index="07"
            title="Spacing"
            note="A 4px base unit. Controls use 8/12, panels use 16/24, page rhythm uses 32/48. Nothing lands off the grid — half-pixels are what make pixel art look broken."
          >
            <Panel chrome="none" flush>
              <div className="space-y-2 p-4">
                {SPACING.map(([name, value]) => (
                  <div key={name} className="flex items-center gap-4">
                    <span className="text-hud w-10 shrink-0 text-slate">
                      {name}
                    </span>
                    <span className="w-12 shrink-0 font-mono text-xs tabular-nums">
                      {value}px
                    </span>
                    <span
                      className="h-3 bg-ink"
                      style={{ width: value as number }}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          </Section>
        </Stagger>
      </PageTransition>
    </Layout>
  );
}