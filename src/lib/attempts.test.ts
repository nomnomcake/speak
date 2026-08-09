import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The store's failures are all silent ones.
 *
 * Nothing here throws where a user can see it — by design, because taking down
 * the screen someone is looking at after they have just spoken is worse than a
 * bad save. That decision is only defensible if the quiet paths are actually
 * correct, and every bug this file pins down was invisible from the UI: a save
 * that reported success and wrote nothing, a newer build's data destroyed by an
 * older one, a Decline that only closed a banner.
 *
 * `window` and `document` are stubbed rather than mocked through jsdom so the
 * suite stays a plain node run.
 */

const KEY = "speak:attempts";
const FOREIGN = "speak:attempts:foreign";

function makeStorage(overrides: Partial<Storage> = {}) {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
    ...overrides,
  } as Storage & { __map: Map<string, string> };
}

let storage: ReturnType<typeof makeStorage>;
let cookie = "";

async function load() {
  // Fresh module each time — the store keeps a cache and a dirty flag.
  vi.resetModules();
  return import("./attempts");
}

function attempt(over: Record<string, unknown> = {}) {
  return {
    id: "a1",
    topicId: "prion-misfolding",
    startedAt: "2026-08-01T10:00:00.000Z",
    completedAt: "2026-08-01T10:01:05.000Z",
    recordedMs: 65000,
    aiFeedback: null,
    ...over,
  } as never;
}

/** Listeners the store registers for cross-tab `storage` events. */
let winListeners: Record<string, Array<() => void>>;

function stubWindow(s: Storage) {
  winListeners = {};
  vi.stubGlobal("window", {
    localStorage: s,
    addEventListener: (type: string, fn: () => void) => {
      (winListeners[type] ??= []).push(fn);
    },
    removeEventListener: (type: string, fn: () => void) => {
      winListeners[type] = (winListeners[type] ?? []).filter((f) => f !== fn);
    },
  });
  vi.stubGlobal("localStorage", s);
}

beforeEach(() => {
  storage = makeStorage();
  cookie = "speak_consent=granted";
  stubWindow(storage);
  vi.stubGlobal("document", {
    get cookie() {
      return cookie;
    },
    set cookie(v: string) {
      cookie = v;
    },
  });
});

describe("saveAttempt", () => {
  it("round-trips an attempt", async () => {
    const { saveAttempt, loadAttempts } = await load();
    expect(saveAttempt(attempt())).toBe(true);
    expect(loadAttempts()).toHaveLength(1);
    expect(loadAttempts()[0].topicId).toBe("prion-misfolding");
  });

  it("reports failure instead of pretending, when storage refuses", async () => {
    // Private browsing and a full quota both look like this. The old version
    // returned its in-memory array, so a full report rendered for a session
    // that was never written and nothing on screen said so.
    storage = makeStorage({
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    stubWindow(storage);
    const { saveAttempt, loadAttempts } = await load();

    expect(saveAttempt(attempt())).toBe(false);
    expect(loadAttempts()).toHaveLength(0);
  });

  it("refuses to write once history has been declined", async () => {
    // The whole point of the notice. A Decline that only dismisses a banner
    // manufactures a record of consent nobody gave.
    cookie = "speak_consent=denied";
    const { saveAttempt, loadAttempts } = await load();

    expect(saveAttempt(attempt())).toBe(false);
    expect(loadAttempts()).toHaveLength(0);
  });

  it("still writes when the notice has not been answered yet", async () => {
    // Someone can take their first go before reading the dialog; losing that
    // take would be a worse trade than keeping it and honouring a later
    // Decline, which erases it.
    cookie = "";
    const { saveAttempt, loadAttempts } = await load();

    expect(saveAttempt(attempt())).toBe(true);
    expect(loadAttempts()).toHaveLength(1);
  });
});

describe("reading a file this build did not write", () => {
  it("treats a newer version as empty rather than guessing at it", async () => {
    storage.setItem(
      KEY,
      JSON.stringify({ version: 99, attempts: [attempt({ id: "future" })] }),
    );
    const { loadAttempts } = await load();
    expect(loadAttempts()).toEqual([]);
  });

  it("parks the newer file aside instead of overwriting it", async () => {
    // Run a preview build once, come back, and the next save used to destroy
    // every session — with a comment above it claiming to prevent exactly this.
    const future = JSON.stringify({
      version: 99,
      attempts: [attempt({ id: "future" })],
    });
    storage.setItem(KEY, future);

    const { saveAttempt } = await load();
    saveAttempt(attempt({ id: "present" }));

    expect(storage.getItem(FOREIGN)).toBe(future);
  });

  it("survives a corrupt file without throwing", async () => {
    storage.setItem(KEY, "{not json at all");
    const { loadAttempts } = await load();
    expect(loadAttempts()).toEqual([]);
  });

  it("drops entries that are not attempts, keeping the ones that are", async () => {
    storage.setItem(
      KEY,
      JSON.stringify({
        version: 2,
        attempts: [attempt(), { nonsense: true }, null, "x"],
      }),
    );
    const { loadAttempts } = await load();
    expect(loadAttempts()).toHaveLength(1);
  });
});

describe("update, delete and clear", () => {
  it("attaches a report to an attempt already written", async () => {
    const { saveAttempt, updateAttempt, loadAttempts } = await load();
    saveAttempt(attempt());
    updateAttempt("a1", { aiFeedback: { source: "mock" } as never });
    expect(loadAttempts()[0].aiFeedback).toEqual({ source: "mock" });
  });

  it("ignores an update for an id that is not there", async () => {
    const { saveAttempt, updateAttempt, loadAttempts } = await load();
    saveAttempt(attempt());
    updateAttempt("nope", { recordedMs: 1 } as never);
    expect(loadAttempts()[0].recordedMs).toBe(65000);
  });

  it("deletes one and leaves the rest", async () => {
    const { saveAttempt, deleteAttempt } = await load();
    saveAttempt(attempt({ id: "a1" }));
    saveAttempt(attempt({ id: "a2" }));
    expect(deleteAttempt("a1").map((a) => a.id)).toEqual(["a2"]);
  });

  it("clears everything", async () => {
    const { saveAttempt, clearAttempts, loadAttempts } = await load();
    saveAttempt(attempt());
    clearAttempts();
    expect(loadAttempts()).toEqual([]);
  });
});

describe("subscription and snapshots", () => {
  it("notifies subscribers when history changes", async () => {
    const { subscribeAttempts, saveAttempt } = await load();
    const seen = vi.fn();
    const unsubscribe = subscribeAttempts(seen);

    saveAttempt(attempt());
    expect(seen).toHaveBeenCalled();

    unsubscribe();
    seen.mockClear();
    saveAttempt(attempt({ id: "a2" }));
    expect(seen).not.toHaveBeenCalled();
  });

  it("also wakes on a write from another tab", async () => {
    // The in-process listener set cannot see a second tab, and `storage` fires
    // only in the tabs that did not write — so the two together are the whole
    // picture and neither alone is.
    const { subscribeAttempts } = await load();
    const seen = vi.fn();
    const unsubscribe = subscribeAttempts(seen);

    winListeners.storage.forEach((fn) => fn());
    expect(seen).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(winListeners.storage).toHaveLength(0);
  });

  it("returns a new snapshot after a write and a stable one otherwise", async () => {
    // useSyncExternalStore re-renders on identity change, so a snapshot that
    // changed identity every call would loop, and one that never changed would
    // leave the dashboard stale. Clearing history stopped updating the UI once,
    // because the cache used `null` to mean stale and `getItem` also returns
    // `null` for an empty store.
    const { getAttemptsSnapshot, saveAttempt } = await load();
    const first = getAttemptsSnapshot();
    expect(getAttemptsSnapshot()).toBe(first);

    saveAttempt(attempt());
    expect(getAttemptsSnapshot()).not.toBe(first);
  });

  it("gives the server an empty history rather than reaching for storage", async () => {
    const { getAttemptsServerSnapshot } = await load();
    expect(getAttemptsServerSnapshot()).toEqual([]);
  });
});

describe("newAttemptId", () => {
  it("does not collide", async () => {
    const { newAttemptId } = await load();
    const ids = new Set(Array.from({ length: 500 }, () => newAttemptId()));
    expect(ids.size).toBe(500);
  });
});
