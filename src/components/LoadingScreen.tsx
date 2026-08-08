import { Layout, Panel, Spinner } from "@/components/ui";
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
 * The bar is indeterminate on purpose. A percentage would be a lie — nothing
 * here knows how far along the load is.
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
        <div className="flex flex-col items-center justify-center gap-5 py-16">
          <Spinner size="lg" />

          <span className="type-caps text-sm">{label}</span>

          {/* Marching hatch: the sheen keyframe shifts the stripe pattern by
              exactly one tile, so it loops without a visible jump. */}
          <div
            className="pixel-clip h-4 w-56 overflow-hidden border-2 border-ink bg-paper"
            style={{ ["--notch" as string]: "2px" }}
            role="progressbar"
            aria-label={label}
          >
            <div className="pixel-hatch animate-sheen h-full w-full bg-mint" />
          </div>
        </div>
      </Panel>
    </Layout>
  );
}
