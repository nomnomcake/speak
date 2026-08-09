"use client";

/**
 * How long was actually spent researching.
 *
 * Recovered from the countdown timer's own saved state rather than measured
 * separately. The timer already persists `{ remainingMs, running, savedAt }`
 * so a reload does not cost the session; that record is the honest answer to
 * "how long did they research", and inventing a second clock beside it would
 * be two numbers waiting to disagree.
 *
 * Returns null when the timer was never started. That is a third state,
 * distinct from "researched for zero seconds" — someone who skipped straight
 * to speaking and someone whose timer never loaded are not the same person,
 * and the report should not claim otherwise.
 */

import { RESEARCH_SECONDS } from "@/lib/topics";

type Saved = { remainingMs: number; running: boolean; savedAt: number };

/** Must match the key ResearchWindow passes to CountdownTimer. */
export function researchTimerKey(topicId: string): string {
  return `research:${topicId}:timer`;
}

export function readResearchMs(topicId: string): number | null {
  if (typeof window === "undefined") return null;

  let saved: Saved | null = null;
  try {
    const raw = window.localStorage.getItem(researchTimerKey(topicId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const s = parsed as Partial<Saved>;
    if (typeof s.remainingMs !== "number" || typeof s.savedAt !== "number") {
      return null;
    }
    saved = { remainingMs: s.remainingMs, running: s.running === true, savedAt: s.savedAt };
  } catch {
    return null;
  }

  const totalMs = RESEARCH_SECONDS * 1000;

  // A timer left running while the tab was closed is charged the time that
  // passed, matching how CountdownTimer resumes it. Anything else would let
  // someone bank research time by walking away.
  const drift = saved.running ? Date.now() - saved.savedAt : 0;
  const remaining = Math.max(0, saved.remainingMs - drift);
  const elapsed = Math.max(0, Math.min(totalMs, totalMs - remaining));

  return elapsed;
}
