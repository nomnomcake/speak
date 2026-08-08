"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * PageTransition — mount animation keyed to the route.
 *
 * Deliberately a mount-only animation rather than AnimatePresence exit: in the
 * App Router the outgoing tree is already unmounted by the time a new route
 * commits, so exit variants there are unreliable. Keying on pathname gives a
 * clean re-entry on every navigation — remounting restarts the CSS animation.
 *
 * The animation itself is CSS (`animate-page-in` in globals.css), not
 * framer-motion, which is the exception in this codebase. It hides the whole
 * page while it runs, so it has to be the one animation that cannot fail to
 * finish: a JS animation leaves the page blank in a background tab and trips a
 * hydration mismatch under reduced motion. The keyframe carries the reasoning.
 */

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={cn("animate-page-in h-full", className)}>
      {children}
    </div>
  );
}

/**
 * Stagger — reveals children in sequence. Use for panel grids so a screen
 * assembles itself instead of appearing all at once.
 *
 * CSS-driven for the same reason as PageTransition: these wrappers hide real
 * content, so the reveal must not be something that can fail to run. The
 * parent owns the whole effect via `stagger-in`, which selects its own
 * children — so `StaggerItem` is a plain div, and an item rendered from inside
 * another component still lands in the sequence at its true DOM position.
 */
export function Stagger({
  children,
  step = 0.06,
  className,
}: {
  children: React.ReactNode;
  step?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("stagger-in", className)}
      style={{ ["--stagger-step" as string]: `${step}s` }}
    >
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}