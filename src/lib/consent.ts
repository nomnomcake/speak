"use client";

import * as React from "react";

/**
 * Storage consent.
 *
 * The banner this backs is a real one, not decoration. Speak had no cookies at
 * all when it was asked for — everything lives in `localStorage` — so a notice
 * saying "we use cookies" would have been the product's first lie to the user,
 * on the first screen, about privacy. Two things make it honest instead:
 *
 *  1. The decision itself is stored in a cookie, so the notice is describing
 *     something that exists rather than something borrowed from other sites.
 *  2. Declining actually does something. History stops being written. A banner
 *     whose Decline button only dismisses the banner is worse than no banner,
 *     because it manufactures a record of consent that was never given.
 *
 * The line between the two categories is the ordinary one. Session history is
 * optional: the product works without it, you just lose the archive. The
 * countdown is not — the fifteen-minute phase is explicitly allowed to survive
 * a closed tab, and without that storage the feature is not degraded, it is
 * broken. Both are named in the notice rather than hidden behind "strictly
 * necessary".
 *
 * The countdown and the consent cookie are the whole list. There is no
 * notepad: the research screen tells you to take notes on paper, by hand.
 */

const COOKIE = "speak_consent";

/** A year. Long enough not to nag, short enough that the answer is not forever. */
const MAX_AGE = 60 * 60 * 24 * 365;

export type Consent = "granted" | "denied" | "unset";

export function readConsent(): Consent {
  if (typeof document === "undefined") return "unset";
  // Bounded by the cookie name so `other_speak_consent` cannot match.
  const hit = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE}=`));
  const value = hit?.slice(COOKIE.length + 1);
  return value === "granted" || value === "denied" ? value : "unset";
}

export function writeConsent(next: Exclude<Consent, "unset">) {
  // `SameSite=Lax` and no `Secure`, so it still works on plain-HTTP localhost.
  // There is nothing sensitive in it — it holds the word granted or denied.
  document.cookie = `${COOKIE}=${next}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  emit();
}

/**
 * Withdrawing consent has to remove what was collected under it.
 *
 * Consent that can be given but not taken back is not consent, and leaving the
 * data in place while flipping a flag would mean the archive quietly repopulates
 * the moment the answer changes back.
 */
export function revokeConsent(onPurge: () => void) {
  writeConsent("denied");
  onPurge();
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeConsent(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/**
 * Read consent in a component.
 *
 * `useSyncExternalStore` rather than an effect, for the same reason the attempt
 * store uses it: the server has no cookies, so the server snapshot is always
 * "unset" and the client corrects it on hydration without a mismatch.
 */
export function useConsent(): Consent {
  return React.useSyncExternalStore(
    subscribeConsent,
    readConsent,
    () => "unset" as const,
  );
}
