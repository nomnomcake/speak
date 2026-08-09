import type { BrowserTab } from "@/components/ui";

/**
 * Only top-level destinations get a tab. `/research` and `/session`
 * deliberately do not: they are pages within the Play flow, so the Play tab
 * stays active there the way a browser tab does when you navigate within a
 * site.
 */
export type RouteKey =
  | "home"
  | "play"
  | "dashboard"
  | "archive"
  | "design-system";

const TABS: Record<RouteKey, { label: string; href: string }> = {
  // "Home", not "Speak". The tab strip is navigation, and every other tab is
  // where you are going rather than what the product is called — the product
  // name belongs on the page, not in a wayfinding label.
  home: { label: "Home", href: "/" },
  play: { label: "Play", href: "/play" },
  dashboard: { label: "Dashboard", href: "/dashboard" },
  archive: { label: "Archive", href: "/archive" },
  "design-system": { label: "Design System", href: "/design-system" },
};

/**
 * Is the design system reachable?
 *
 * It is a workbench — unfinished states, components out of context, decisions
 * not yet made — and does not belong in front of anyone but the person
 * building the thing. Visible in development, or wherever
 * `SPEAK_SHOW_DESIGN_SYSTEM=1` is set server-side.
 *
 * Read on the server only. It is not `NEXT_PUBLIC_`, so the value never
 * reaches a bundle and the tab simply is not rendered rather than being
 * rendered and hidden.
 */
export function designSystemVisible(): boolean {
  // One explicit switch, defaulting to hidden.
  //
  // An earlier version also opened the door whenever NODE_ENV was
  // "development", which turned out to be true in places it had no business
  // being true — the page shipped to a production build regardless. Tying
  // access to a single variable that must be deliberately set removes the
  // guesswork: if it is not in the environment, the page does not exist.
  return process.env.SPEAK_SHOW_DESIGN_SYSTEM === "1";
}

/** Browser tabs with the current route marked active. */
export function tabsFor(active: RouteKey): BrowserTab[] {
  const keys = (Object.keys(TABS) as RouteKey[]).filter(
    (key) => key !== "design-system" || designSystemVisible(),
  );

  return keys.map((key) => ({
    ...TABS[key],
    active: key === active,
  }));
}

/**
 * Bookmarks bar. These stay inert until the session routes exist — rendering
 * them as links now would dead-end on a 404.
 */
export const BOOKMARKS = ["Brief", "Session", "Archive", "Settings"];
