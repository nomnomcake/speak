import { Layout, Panel, PixelFrame, PixelCloud, Sparkle } from "@/components/ui";
import type { BrowserTab } from "@/components/ui";

/**
 * LoadingScreen — the fallback a route shows while its segment loads.
 *
 * Renders the full browser frame, not just a spinner. A bare fallback would
 * blank the chrome and bring it back a moment later, which reads as the
 * application restarting rather than a page loading. The window stays; only
 * its contents change.
 *
 * Each route has its own `loading.tsx` passing its own tabs, so the tab strip
 * does not flicker to the wrong active tab mid-navigation.
 *
 * Entirely CSS and entirely server-rendered — no client component, no state.
 * This is the one screen guaranteed to be on-screen *before* the JS for the
 * route it is standing in for has arrived, so anything it needed JS to draw
 * would be blank for exactly as long as it mattered.
 */
export function LoadingScreen({
  tabs,
  label = "Loading",
}: {
  tabs: BrowserTab[];
  label?: string;
}) {
  return (
    <Layout tabs={tabs}>
      <Panel chrome="window" notch={6} sky={{ density: "sparse" }}>
        <div className="flex items-center justify-center px-4 py-16 sm:py-24">
          {/* A paper card floating on the sky — the defining move of the
              reference, and the reason this reads as the product rather than
              as a spinner someone dropped in front of it. */}
          <PixelFrame
            notch={4}
            shadow={5}
            innerClassName="flex flex-col items-center gap-4 px-8 py-7"
          >
            <div className="relative">
              {/* The cloud bobs; the sparkles sit still. One transform for the
                  whole group, per the animation budget — and a sparkle that
                  twinkles is already carrying its own keyframe. */}
              <div className="animate-bob">
                <PixelCloud shape="double" unit={5} fill="var(--color-mint)" />
              </div>

              <Sparkle
                size={9}
                fill="var(--color-mint-deep)"
                className="animate-twinkle absolute -top-1 -right-2"
              />
              <Sparkle
                size={7}
                fill="var(--color-mint-deep)"
                className="animate-twinkle absolute -bottom-1 -left-3"
                style={{ animationDelay: "1.1s" }}
              />
            </div>

            <span className="type-hud text-slate">{label}</span>

            {/* Five blocks passing a light along, rather than a bar sliding a
                gradient. A bar measures something; this one never knew how far
                along the load was, so it should not imply it did. */}
            <div
              className="load-blocks flex gap-1.5"
              role="status"
              aria-label={label}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="pixel-clip size-2.5 bg-mint-soft"
                  style={{ ["--notch" as string]: "1px" }}
                />
              ))}
            </div>
          </PixelFrame>
        </div>
      </Panel>
    </Layout>
  );
}
