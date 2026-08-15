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

/**
 * `unknown` is the server's answer, and it is not the same as `unset`.
 *
 * The server has no cookie to read, so it cannot know. Reporting that as
 * `unset` made the notice part of the server-rendered HTML, which meant every
 * page load flashed a storage banner at people who had already answered it —
 * visible until hydration replaced it with nothing. A consent dialog that
 * reappears on every navigation is the exact thing that trains users to click
 * it away without reading.
 *
 * Distinguishing the two costs one render: the notice draws nothing until the
 * client has actually looked at the cookie.
 */
export type Consent = "granted" | "denied" | "unset" | "unknown";

export function readConsent(): Consent {
  if (typeof document === "undefined") return "unknown";
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

/**
 * Reopening the notice after it has been answered.
 *
 * The dialog is normally shown only while the answer is `unset`, which left no
 * way back to it — you could withdraw consent from the dashboard but not read
 * what you had agreed to. A privacy notice you cannot go back and re-read is
 * halfway to not having one.
 */
let forced = false;

export function openNotice() {
  forced = true;
  emit();
}

export function closeNotice() {
  forced = false;
  emit();
}

/** True while the notice has been summoned rather than triggered by `unset`. */
export function useNoticeOpen(): boolean {
  return React.useSyncExternalStore(
    subscribeConsent,
    () => forced,
    () => false,
  );
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
 * store uses it: the server snapshot is `unknown`, and the client replaces it
 * with the real answer on hydration without a mismatch.
 */
export function useConsent(): Consent {
  return React.useSyncExternalStore(
    subscribeConsent,
    readConsent,
    () => "unknown" as const,
  );
}
