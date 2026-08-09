"use client";

import { MotionConfig } from "framer-motion";

/**
 * Honour `prefers-reduced-motion` for framer-motion as well as for CSS.
 *
 * `globals.css` has an @media block that shuts CSS animation down, and it has
 * always covered the page transitions, the spinner and the wallpaper belts —
 * everything hand-authored. It cannot touch framer-motion, which animates via
 * inline styles from JavaScript and never consults a stylesheet.
 *
 * So a user with the OS setting on still got the folder hovers, the card
 * cycling in the search, the GlowBorder aura and every meter easing itself
 * into place. That is most of the motion in the product, and the setting is
 * frequently a vestibular or migraine accommodation rather than a preference.
 *
 * `reducedMotion="user"` makes framer-motion read the same media query: it
 * drops transforms and keeps opacity, so a fade still happens and nothing
 * slides. It has to live in a client component because the root layout is a
 * server one.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
