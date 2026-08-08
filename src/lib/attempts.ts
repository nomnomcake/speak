"use client";

/**
 * Attempt storage.
 *
 * localStorage, per topic-schema.md: no account, no server, and the recording
 * itself never goes anywhere. Only the fact that a session happened is kept —
 * the take lives in memory for the review screen and is gone when the tab is.
 *
 * The shape here is deliberately narrower than the `Attempt` in the schema.
 * `transcript`, `metrics` and `scores` are all still unimplemented, and writing
 * empty strings and zeroes for them would put fabricated data in storage that
 * later reads could not tell apart from the real thing. Fields arrive when the
 * phases that produce them do.
 */

const KEY = "speak:attempts";
const VERSION = 1;

export type StoredAttempt = {
  id: string;
  topicId: string;
  /** ISO 8601, absolute — never a relative string in stored data. */
  startedAt: string;
  completedAt: string;
  /** Length of the take. 0 when nothing could be recorded. */
  recordedMs: number;
};

type Envelope = { version: number; attempts: StoredAttempt[] };

function isAttempt(v: unknown): v is StoredAttempt {
  if (typeof v !== "object" || v === null) return false;
  const a = v as Record<string, unknown>;
  return (
    typeof a.id === "string" &&
    typeof a.topicId === "string" &&
    typeof a.startedAt === "string" &&
    typeof a.completedAt === "string" &&
    typeof a.recordedMs === "number"
  );
}

/**
 * Read what is there, discarding anything that is not an attempt.
 *
 * localStorage is shared with every other script on the origin and survives
 * every version of this app that has ever run in the browser. Trusting its
 * contents is how a dashboard ends up rendering `undefined` — so a malformed
 * entry is dropped rather than repaired, and a malformed *file* resets.
 */
export function loadAttempts(): StoredAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return [];
    const env = parsed as Partial<Envelope>;
    if (env.version !== VERSION || !Array.isArray(env.attempts)) return [];
    return env.attempts.filter(isAttempt);
  } catch {
    return [];
  }
}

function write(attempts: StoredAttempt[]) {
  if (typeof window === "undefined") return;
  try {
    const env: Envelope = { version: VERSION, attempts };
    window.localStorage.setItem(KEY, JSON.stringify(env));
  } catch {
    // Private mode, or the quota is full. Losing the record of a session is
    // bad; taking down the screen the user is looking at is worse.
  }
}

export function saveAttempt(attempt: StoredAttempt): StoredAttempt[] {
  const next = [...loadAttempts(), attempt];
  write(next);
  emit();
  return next;
}

export function clearAttempts() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* see write() */
  }
  emit();
}

/* ---------------------------------------------------------------------------
   Store subscription
   ------------------------------------------------------------------------ */

/**
 * Exposed as an external store so React can read it with
 * `useSyncExternalStore` rather than an effect that calls setState.
 *
 * That is not a style preference. Reading localStorage during render would
 * produce a different tree on the server than the client, and reading it in an
 * effect means the component renders once with the wrong answer first. This
 * hands React a server snapshot and a client snapshot and lets it do the right
 * thing with both.
 */
const listeners = new Set<() => void>();

/**
 * The snapshot must be referentially stable between reads or
 * `useSyncExternalStore` re-renders forever. Cached against the raw string, so
 * a new array is only built when the stored text actually changed.
 */
const EMPTY: StoredAttempt[] = [];
let cachedRaw: string | null = null;
let cachedValue: StoredAttempt[] = EMPTY;

/**
 * Invalidation is a flag, not a sentinel value.
 *
 * Setting `cachedRaw = null` to mean "stale" looks equivalent and is not:
 * `null` is also what `getItem` returns when nothing is stored. Clearing the
 * history therefore compared null against null, decided nothing had changed,
 * and handed back the previous snapshot — the dashboard kept showing three
 * sessions after erasing all three.
 */
let dirty = true;

function emit() {
  dirty = true;
  listeners.forEach((l) => l());
}

export function subscribeAttempts(onChange: () => void): () => void {
  listeners.add(onChange);
  // `storage` fires only in *other* tabs, which is exactly the case the
  // in-process listener set cannot cover.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getAttemptsSnapshot(): StoredAttempt[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (dirty || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = loadAttempts();
    dirty = false;
  }
  return cachedValue;
}

/** Nothing is known during SSR, and pretending otherwise breaks hydration. */
export function getAttemptsServerSnapshot(): StoredAttempt[] {
  return EMPTY;
}

/** Stable enough for a local list, without pulling in a uuid dependency. */
export function newAttemptId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
