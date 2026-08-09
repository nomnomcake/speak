import { describe, expect, it } from "vitest";
import { KEEP_LIMIT, takesToEvict } from "./recordings";

/**
 * The eviction rule, which is the only part of the recording store that can
 * destroy something a user chose to keep.
 *
 * IndexedDB is not in scope here on purpose — the plumbing either works or
 * fails loudly in a browser, whereas this decides *which* video to delete, and
 * getting it wrong is silent. Both halves matter for different reasons: the
 * cap keeps a daily-use tool from quietly becoming the largest thing on the
 * origin, and the orphan sweep stops a deleted session leaving footage behind
 * that nothing in the UI can reach.
 */

const take = (id: string, savedAt: string) => ({
  id,
  savedAt,
  bytes: 4_000_000,
  mimeType: "video/webm",
});

describe("takesToEvict", () => {
  it("keeps everything when under the cap", () => {
    const stored = [take("a", "2026-08-01T00:00:00Z"), take("b", "2026-08-02T00:00:00Z")];
    expect(takesToEvict(stored, ["a", "b"])).toEqual([]);
  });

  it("drops the oldest once the cap is passed", () => {
    const stored = Array.from({ length: 12 }, (_, i) =>
      take(`t${i}`, `2026-08-${String(i + 1).padStart(2, "0")}T00:00:00Z`),
    );
    const live = stored.map((t) => t.id);
    const doomed = takesToEvict(stored, live, 10);

    // Two over the limit, and the two oldest are the ones that go. Sorted
    // because the order of deletion is not part of the contract — only the set
    // is, and asserting the order would pin an implementation detail.
    expect(doomed.sort()).toEqual(["t0", "t1"]);
  });

  it("keeps the newest, not the first written", () => {
    const stored = [
      take("old", "2026-01-01T00:00:00Z"),
      take("new", "2026-12-31T00:00:00Z"),
    ];
    expect(takesToEvict(stored, ["old", "new"], 1)).toEqual(["old"]);
  });

  it("sweeps a recording whose session is gone", () => {
    // Deleting a row from the archive must not leave the video behind: nothing
    // in the UI can reach it and it still occupies the quota.
    const stored = [take("kept", "2026-08-02T00:00:00Z"), take("orphan", "2026-08-01T00:00:00Z")];
    expect(takesToEvict(stored, ["kept"])).toEqual(["orphan"]);
  });

  it("sweeps orphans even when the cap is not reached", () => {
    const stored = [take("orphan", "2026-08-01T00:00:00Z")];
    expect(takesToEvict(stored, [])).toEqual(["orphan"]);
  });

  it("counts the cap over live takes only, so orphans cannot spare a real one", () => {
    // Nine live plus three orphans is not twelve kept takes. Counting the
    // orphans toward the limit would evict a session the user still has.
    const live = Array.from({ length: 9 }, (_, i) =>
      take(`live${i}`, `2026-08-${String(i + 1).padStart(2, "0")}T00:00:00Z`),
    );
    const orphans = ["x", "y", "z"].map((id) => take(id, "2026-07-01T00:00:00Z"));
    const doomed = takesToEvict([...live, ...orphans], live.map((t) => t.id), 10);

    expect(doomed.sort()).toEqual(["x", "y", "z"]);
  });

  it("handles an empty store", () => {
    expect(takesToEvict([], ["a"])).toEqual([]);
  });

  it("defaults to the announced limit", () => {
    // The UI tells the user this number, so a drift between the two would make
    // the interface a liar.
    const stored = Array.from({ length: KEEP_LIMIT + 1 }, (_, i) =>
      take(`t${i}`, `2026-08-${String(i + 1).padStart(2, "0")}T00:00:00Z`),
    );
    expect(takesToEvict(stored, stored.map((t) => t.id))).toHaveLength(1);
  });
});
