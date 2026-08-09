import { describe, expect, it } from "vitest";
import { achievementsFrom, nextMilestone, streakFrom } from "./progress";
import type { StoredAttempt } from "./attempts";

/**
 * These lock down the badge thresholds against the size of the cabinet.
 *
 * The thresholds were originally written for 21 topics. When the library grew
 * to 420, "clear one category" silently went from a three-session reward to a
 * sixty-session grind and "every topic" became unreachable — the badges kept
 * rendering, so nothing looked broken. A test is the only thing that notices
 * that kind of drift, because it has no visible symptom.
 */

const DAY = 86_400_000;

function attempt(topicId: string, daysAgo: number): StoredAttempt {
  const at = new Date(Date.now() - daysAgo * DAY).toISOString();
  return {
    id: `${topicId}-${daysAgo}`,
    topicId,
    startedAt: at,
    completedAt: at,
    recordedMs: 60_000,
    aiFeedback: null,
  };
}

const earned = (rows: StoredAttempt[], id: string) =>
  achievementsFrom(rows, new Date()).find((a) => a.id === id)?.earned ?? false;

describe("achievement thresholds", () => {
  it("gives nothing away for zero sessions", () => {
    const none = achievementsFrom([], new Date());
    expect(none.every((a) => !a.earned)).toBe(true);
  });

  it("awards the first badge on the first session", () => {
    expect(earned([attempt("cap-theorem", 0)], "first")).toBe(true);
  });

  it("keeps the early rungs reachable", () => {
    // Ten distinct topics is a first-fortnight achievement, not a milestone.
    const ten = ["cap-theorem", "crispr-targeting", "moral-panic",
      "jevons-paradox", "ship-of-theseus", "therac-25", "blindsight",
      "cantillon-effect", "fairy-circles", "grue-paradox",
    ].map((t, i) => attempt(t, i));
    expect(earned(ten, "ten")).toBe(true);
    expect(earned(ten, "fifty")).toBe(false);
  });

  it("does not award a shelf badge for a handful of topics", () => {
    // The bug this guards: at 21 topics, three in a category cleared it.
    const three = ["cap-theorem", "bufferbloat", "therac-25"].map((t, i) =>
      attempt(t, i),
    );
    expect(earned(three, "shelf")).toBe(false);
    expect(earned(three, "cleared")).toBe(false);
  });

  it("counts distinct topics, not repeated attempts at one", () => {
    const repeats = Array.from({ length: 20 }, (_, i) =>
      attempt("cap-theorem", i),
    );
    expect(earned(repeats, "ten")).toBe(false);
  });
});

describe("streakFrom", () => {
  it("does not break the streak just because today is empty", () => {
    // Counting from today would read zero every morning until you performed.
    const rows = [attempt("cap-theorem", 1), attempt("blindsight", 2)];
    expect(streakFrom(rows, new Date()).current).toBe(2);
  });

  it("counts today when today has a session", () => {
    const rows = [attempt("cap-theorem", 0), attempt("blindsight", 1)];
    expect(streakFrom(rows, new Date()).current).toBe(2);
  });

  it("stops at a gap", () => {
    const rows = [attempt("cap-theorem", 1), attempt("blindsight", 5)];
    expect(streakFrom(rows, new Date()).current).toBe(1);
  });
});

describe("nextMilestone", () => {
  it("aims at a near rung rather than the whole cabinet", () => {
    // The point: 3 of 420 must not render as 0.7% of a bar.
    const m = nextMilestone(3, 420);
    expect(m.target).toBe(10);
    expect(m.remaining).toBe(7);
    expect(m.ratio).toBeGreaterThan(0.2);
  });

  it("moves to the next rung once one is passed", () => {
    expect(nextMilestone(10, 420).target).toBe(25);
    expect(nextMilestone(60, 420).target).toBe(100);
  });

  it("ends at the true total", () => {
    const m = nextMilestone(420, 420);
    expect(m.target).toBe(420);
    expect(m.remaining).toBe(0);
  });

  it("never reports a ratio outside 0 to 1", () => {
    for (const done of [0, 1, 9, 10, 99, 250, 419, 420]) {
      const m = nextMilestone(done, 420);
      expect(m.ratio).toBeGreaterThanOrEqual(0);
      expect(m.ratio).toBeLessThanOrEqual(1);
    }
  });
});
