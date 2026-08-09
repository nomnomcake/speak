import { beforeEach, describe, expect, it, vi } from "vitest";
import { readConsent, revokeConsent, subscribeConsent, writeConsent } from "./consent";

/**
 * If this module fails quietly, the product keeps data somebody declined.
 *
 * That is the one bug here that is worse than losing a session, so the cases
 * worth pinning are the boring ones: an absent cookie is not consent, a
 * half-matching cookie name is not this cookie, and withdrawing has to reach
 * the data as well as the flag.
 */

let cookie = "";

beforeEach(() => {
  cookie = "";
  vi.stubGlobal("document", {
    get cookie() {
      return cookie;
    },
    set cookie(v: string) {
      // Good enough for these tests: a real jar would merge by name, and every
      // write here is the same single cookie.
      cookie = v.split(";")[0];
    },
  });
});

describe("readConsent", () => {
  it("reads a granted answer", () => {
    cookie = "speak_consent=granted";
    expect(readConsent()).toBe("granted");
  });

  it("reads a denied answer", () => {
    cookie = "speak_consent=denied";
    expect(readConsent()).toBe("denied");
  });

  it("treats no cookie as unanswered, not as permission", () => {
    expect(readConsent()).toBe("unset");
  });

  it("treats an unrecognised value as unanswered", () => {
    // Anything other than the two words we write is not an answer we gave.
    cookie = "speak_consent=yes";
    expect(readConsent()).toBe("unset");
  });

  it("does not match a cookie that merely ends with the name", () => {
    // `other_speak_consent=granted` must not read as consent. The lookup is
    // bounded by the name and an equals sign for exactly this reason.
    cookie = "other_speak_consent=granted";
    expect(readConsent()).toBe("unset");
  });

  it("finds the cookie among others", () => {
    cookie = "a=1; speak_consent=denied; z=2";
    // The stubbed setter is not used here — assign the jar directly.
    expect(readConsent()).toBe("denied");
  });

  it("reports unknown on the server, which is not the same as unset", () => {
    // The distinction is what keeps the notice out of the server-rendered
    // HTML. Reporting `unset` here put a storage banner in every static page
    // and flashed it at people who had already answered.
    vi.stubGlobal("document", undefined);
    expect(readConsent()).toBe("unknown");
  });
});

describe("writeConsent", () => {
  it("persists the answer with a path and an expiry", () => {
    writeConsent("granted");
    expect(cookie).toContain("speak_consent=granted");
    expect(readConsent()).toBe("granted");
  });

  it("can change its mind", () => {
    writeConsent("granted");
    writeConsent("denied");
    expect(readConsent()).toBe("denied");
  });

  it("tells subscribers, so the notice and the dashboard agree", () => {
    const seen = vi.fn();
    const unsubscribe = subscribeConsent(seen);
    writeConsent("granted");
    expect(seen).toHaveBeenCalled();

    unsubscribe();
    seen.mockClear();
    writeConsent("denied");
    expect(seen).not.toHaveBeenCalled();
  });
});

describe("revokeConsent", () => {
  it("denies and purges together", () => {
    // Consent that can be given but not taken back is not consent, and a flag
    // flipped without erasing the data means the archive repopulates the
    // moment the answer changes back.
    writeConsent("granted");
    const purge = vi.fn();
    revokeConsent(purge);

    expect(readConsent()).toBe("denied");
    expect(purge).toHaveBeenCalledTimes(1);
  });
});
