"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/tokens";

/**
 * PageTransition — mount animation keyed to the route.
 *
 * Deliberately a mount-only animation rather than AnimatePresence exit: in the
 * App Router the outgoing tree is already unmounted by the time a new route
 * commits, so exit variants there are unreliable. Keying on pathname gives a
 * clean re-entry on every navigation.
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
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.page, ease: ease.snap }}
      className={cn("h-full", className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger — reveals children in sequence. Use for panel grids so a screen
 * assembles itself instead of appearing all at once.
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
    <motion.div
      initial="hidden"
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: step } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        shown: { opacity: 1, y: 0 },
      }}
      transition={{ duration: duration.base, ease: ease.snap }}
      className={className}
    >
      {children}
    </motion.div>
  );
}