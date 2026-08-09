import { describe, expect, it } from "vitest";
import { clampScore, stripUngroundedQuotes, verifyQuote } from "./verify";

/**
 * This is the file that stops the product inventing evidence about a person.
 *
 * A coach quoting you saying something you never said is not a small bug — the
 * user cannot check it without rewatching their own recording. The tolerant
 * cases matter as much as the strict ones: a matcher so brittle that real
 * quotes fail would strip everything and make the report useless.
 */

const TRANSCRIPT =
  "the mechanism is selection pressure so bacteria that survive the dose reproduce and the next generation inherits it";

describe("verifyQuote", () => {
  it("accepts an exact phrase", () => {
    expect(verifyQuote("the mechanism is selection pressure", TRANSCRIPT)).toBe(
      true,
    );
  });

  it("ignores casing and punctuation", () => {
    // Web Speech output has no punctuation; a model will add it back.
    expect(
      verifyQuote("The mechanism is selection pressure!", TRANSCRIPT),
    ).toBe(true);
  });

  it("rejects a fabricated sentence", () => {
    expect(
      verifyQuote("I want to talk about the Dunning Kruger effect", TRANSCRIPT),
    ).toBe(false);
  });

  it("rejects a plausible sentence that was never said", () => {
    // The important case. This is the kind of thing someone might say about
    // this topic, which is exactly why it must not pass.
    expect(
      verifyQuote("antibiotics kill the weakest bacteria first", TRANSCRIPT),
    ).toBe(false);
  });

  it("rejects an empty quote", () => {
    expect(verifyQuote("", TRANSCRIPT)).toBe(false);
  });

  it("rejects a quote longer than the transcript", () => {
    expect(verifyQuote(TRANSCRIPT + " and then some more", TRANSCRIPT)).toBe(
      false,
    );
  });

  it("rejects anything when the transcript is empty", () => {
    expect(verifyQuote("anything at all", "")).toBe(false);
  });

  /**
   * Scrambles built from the transcript's own words.
   *
   * The first implementation compared against a Set, so word order and
   * repetition were both ignored and every one of these validated as a
   * verbatim quotation. A reordering is not a quote — it is a sentence the
   * speaker never uttered, assembled from ones they did.
   */
  it("rejects the transcript's own words in the wrong order", () => {
    const t =
      "consistency means every read gets the most recent write and you can only have two of three properties";
    expect(verifyQuote("only can you system", t)).toBe(false);
    expect(verifyQuote("have two only can you", t)).toBe(false);
    expect(verifyQuote("of three properties two have only can you", t)).toBe(
      false,
    );
    expect(
      verifyQuote("the most recent write gets read every means consistency the", t),
    ).toBe(false);
  });

  it("still accepts a real quote with a dropped word", () => {
    const t =
      "consistency means every read gets the most recent write and you can only have two of three properties";
    expect(verifyQuote("every read gets the most recent write", t)).toBe(true);
    // "the" dropped — a recognition slip, not a reordering.
    expect(verifyQuote("gets most recent write", t)).toBe(true);
  });
});

describe("stripUngroundedQuotes", () => {
  it("keeps a grounded quote", () => {
    const r = stripUngroundedQuotes("selection pressure", TRANSCRIPT);
    expect(r).toEqual({ quote: "selection pressure", stripped: false });
  });

  it("removes an invented quote and reports it", () => {
    const r = stripUngroundedQuotes("a sentence never spoken", TRANSCRIPT);
    expect(r).toEqual({ quote: null, stripped: true });
  });

  it("strips everything when there is no transcript to check against", () => {
    // Nothing can be attributed to a speaker whose words were never captured.
    const r = stripUngroundedQuotes("anything", null);
    expect(r).toEqual({ quote: null, stripped: true });
  });

  it("treats an absent quote as absent, not as a strip", () => {
    expect(stripUngroundedQuotes(null, TRANSCRIPT)).toEqual({
      quote: null,
      stripped: false,
    });
  });
});

describe("clampScore", () => {
  it("clamps a model that answers on the wrong scale", () => {
    // A 0-10 answer would otherwise render as an almost-empty bar.
    expect(clampScore(7)).toBe(7);
    expect(clampScore(140)).toBe(100);
    expect(clampScore(-20)).toBe(0);
  });

  it("rounds to an integer", () => {
    expect(clampScore(81.6)).toBe(82);
  });

  it("rejects non-numbers rather than coercing them", () => {
    expect(clampScore("85")).toBeNull();
    expect(clampScore(null)).toBeNull();
    expect(clampScore(NaN)).toBeNull();
    expect(clampScore(Infinity)).toBeNull();
  });
});
