"use client";

/**
 * Kept takes.
 *
 * This is the one store that holds video of someone's face in their home, so
 * the rules around it are stricter than for anything else in the product.
 *
 *  - **It never leaves the device.** IndexedDB is local storage; nothing here
 *    uploads. `topic-schema.md` is explicit that recordings must not go
 *    anywhere by default, and adding replay is not a reason to change that.
 *  - **Keeping is opt-in, per take.** The default is still that a recording
 *    dies with the tab. Replay reversed "deliberately ephemeral", so the thing
 *    that made that decision safe — nobody accumulating footage of themselves
 *    without choosing to — has to be preserved as an explicit choice instead.
 *  - **A declined history keeps nothing.** Someone who turned off session
 *    history did not agree to something heavier.
 *
 * localStorage is not an option: it stores strings, caps out around 5MB, and a
 * single minute of video is several. IndexedDB stores Blobs natively and has a
 * real quota.
 */

import { readConsent } from "@/lib/consent";

const DB = "speak";
const STORE = "takes";
const VERSION = 1;

/**
 * How many takes are kept before the oldest is dropped.
 *
 * A minute of video is a few megabytes, and this is a practice tool someone
 * might use daily — unbounded, it would quietly become the largest thing this
 * origin owns. Ten is enough to compare yourself against last week and small
 * enough to stay well inside any browser's quota.
 *
 * The cap is announced in the UI rather than enforced silently. Deleting
 * someone's recording without saying so is precisely the kind of quiet data
 * loss the attempt store already had once.
 */
export const KEEP_LIMIT = 10;

export type TakeMeta = {
  id: string;
  savedAt: string;
  bytes: number;
  mimeType: string;
};

type StoredTake = TakeMeta & { blob: Blob };

/**
 * Which takes to drop, given what is stored and what the attempt list still
 * knows about.
 *
 * Pure, and separated from the database for that reason: the quota rule and
 * the orphan rule are the parts worth testing, and neither needs IndexedDB.
 *
 * Orphans are real rather than theoretical — deleting a session from the
 * archive leaves its video behind unless something goes looking, and a
 * recording nobody can reach is the worst of both: invisible to the user and
 * still on disk.
 */
export function takesToEvict(
  stored: TakeMeta[],
  liveAttemptIds: Iterable<string>,
  limit = KEEP_LIMIT,
): string[] {
  const live = new Set(liveAttemptIds);
  const orphans = stored.filter((t) => !live.has(t.id));
  const kept = stored
    .filter((t) => live.has(t.id))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return [...orphans.map((t) => t.id), ...kept.slice(limit).map((t) => t.id)];
}

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB, VERSION);
    } catch {
      // Firefox in private mode throws here rather than failing the request.
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return open().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        let request: IDBRequest<T>;
        try {
          request = run(db.transaction(STORE, mode).objectStore(STORE));
        } catch {
          db.close();
          return resolve(null);
        }
        request.onsuccess = () => {
          resolve(request.result);
          db.close();
        };
        request.onerror = () => {
          resolve(null);
          db.close();
        };
      }),
  );
}

/**
 * Keep a take. Returns false when it was not kept, and the caller must say so
 * — a Keep button that silently does nothing is worse than no Keep button.
 */
export async function keepTake(id: string, blob: Blob): Promise<boolean> {
  if (readConsent() === "denied") return false;
  const record: StoredTake = {
    id,
    blob,
    savedAt: new Date().toISOString(),
    bytes: blob.size,
    mimeType: blob.type || "video/webm",
  };
  const ok = await tx("readwrite", (s) => s.put(record));
  return ok !== null;
}

export async function getTake(id: string): Promise<Blob | null> {
  const rec = (await tx("readonly", (s) => s.get(id))) as StoredTake | null;
  return rec?.blob ?? null;
}

export async function listTakes(): Promise<TakeMeta[]> {
  const all = (await tx("readonly", (s) => s.getAll())) as StoredTake[] | null;
  if (!all) return [];
  // The blob is deliberately dropped here. Callers want to know what exists,
  // and holding ten videos in memory to answer that would be absurd.
  return all.map(({ id, savedAt, bytes, mimeType }) => ({
    id,
    savedAt,
    bytes,
    mimeType,
  }));
}

export async function deleteTake(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
  emit();
}

export async function clearTakes(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
  emit();
}

/**
 * Drop orphans and anything past the cap.
 *
 * Called after a keep and on mount of the archive, rather than on a timer:
 * those are the two moments the set can have grown or gone stale.
 */
export async function pruneTakes(liveAttemptIds: Iterable<string>): Promise<void> {
  const stored = await listTakes();
  if (stored.length === 0) return;
  const doomed = takesToEvict(stored, liveAttemptIds);
  for (const id of doomed) await tx("readwrite", (s) => s.delete(id));
  if (doomed.length > 0) emit();
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeTakes(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Announced after a keep so the UI can report it rather than imply it. */
export function notifyTakesChanged() {
  emit();
}
