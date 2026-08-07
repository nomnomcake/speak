import type { BrowserTab } from "@/components/ui";

/** Routes that exist. Anything not listed here is not linkable yet. */
export type RouteKey = "home" | "design-system";

const TABS: Record<RouteKey, { label: string; href: string }> = {
  home: { label: "Speak", href: "/" },
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
