import { describe, expect, it } from "vitest";
import { countFillers, paceMetrics } from "./filler";

/**
 * The value of these tests is the negative cases.
 *
 * Counting "um" is trivial and would never regress unnoticed. What will
 * regress is the context handling — someone tightens a heuristic, and the
 * report starts telling users to stop saying "like" in "it felt like a
 * paradox". These lock that behaviour down.
 */

describe("countFillers", () => {
  it("returns null for an empty transcript rather than a zero", () => {
    // "You used no filler words" and "there was nothing to read" are
    // different claims and must not collapse into the same number.
    expect(countFillers("")).toBeNull();
    expect(countFillers("   ")).toBeNull();
  });

  it("always counts unambiguous fillers", () => {
    const r = countFillers("um the thing uh works er somehow");
    expect(r?.total).toBe(3);
    expect(r?.breakdown.every((f) => f.ambiguous === false)).toBe(true);
  });

  it("does not count 'like' after a comparison verb", () => {
    expect(countFillers("it felt like a paradox")?.total).toBe(0);
    expect(countFillers("this looks like a tradeoff")?.total).toBe(0);
    expect(countFillers("it seemed like the right call")?.total).toBe(0);
  });

  it("does not count 'like' introducing a noun phrase", () => {
    expect(countFillers("something like the genome")?.total).toBe(0);
  });

  it("counts 'like' used as a tic", () => {
    const r = countFillers("and like the system just stops");
    expect(r?.total).toBe(1);
    expect(r?.breakdown[0]).toMatchObject({ word: "like", ambiguous: true });
  });

  it("does not count 'you know' introducing a clause", () => {
    expect(countFillers("you know that consistency matters")?.total).toBe(0);
    expect(countFillers("you know why it fails")?.total).toBe(0);
  });

  it("counts 'you know' used as a tic, once", () => {
    const r = countFillers("it is, you know, a tradeoff");
    expect(r?.total).toBe(1);
    expect(r?.breakdown[0].word).toBe("you know");
  });

  it("does not count 'kind of' before a noun", () => {
    expect(countFillers("that kind of problem")?.total).toBe(0);
  });

  it("counts 'kind of' as a hedge", () => {
    expect(countFillers("you kind of have to pick")?.total).toBe(1);
  });

  it("counts 'so' only when it opens a thought", () => {
    expect(countFillers("so the mechanism is selection")?.total).toBe(1);
    // Mid-sentence it is a conjunction doing real work.
    expect(countFillers("it rose so the price fell")?.total).toBe(0);
  });

  it("sorts the breakdown by frequency", () => {
    const r = countFillers("um um um uh and like the thing");
    expect(r?.breakdown[0]).toMatchObject({ word: "um", count: 3 });
  });
});

describe("paceMetrics", () => {
  it("reports null for an empty transcript, not zero words", () => {
    expect(paceMetrics("", 60_000)).toEqual({
      wordsSpoken: null,
      wordsPerMinute: null,
    });
  });

  it("computes words per minute over the real duration", () => {
    const text = Array.from({ length: 150 }, () => "word").join(" ");
    expect(paceMetrics(text, 60_000)).toEqual({
      wordsSpoken: 150,
      wordsPerMinute: 150,
    });
    expect(paceMetrics(text, 30_000).wordsPerMinute).toBe(300);
  });

  it("does not divide by zero on a zero-length take", () => {
    expect(paceMetrics("a few words", 0).wordsPerMinute).toBeNull();
  });
});
