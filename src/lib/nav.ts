import type { BrowserTab } from "@/components/ui";

/** Routes that exist. Anything not listed here is not linkable yet. */
/**
 * Only top-level destinations get a tab. `/research` deliberately does not:
 * it is a page inside the Play flow, reached by opening a folder, so the Play
 * tab stays active there the way a browser tab does when you navigate within
 * a site.
 */
export type RouteKey = "home" | "play" | "design-system";

const TABS: Record<RouteKey, { label: string; href: string }> = {
  home: { label: "Speak", href: "/" },
  play: { label: "Play", href: "/play" },
  "design-system": { label: "Design System", href: "/design-system" },
};

/** Browser tabs with the current route marked active. */
export function tabsFor(active: RouteKey): BrowserTab[] {
  return (Object.keys(TABS) as RouteKey[]).map((key) => ({
    ...TABS[key],
    active: key === active,
  }));
}

/**
 * Bookmarks bar. These stay inert until the session routes exist — rendering
 * them as links now would dead-end on a 404.
 */
export const BOOKMARKS = ["Brief", "Session", "Archive", "Settings"];
