import { Redis } from "@upstash/redis";
import {
  pickGuestDisplayName,
  sanitizeLiveWatchDisplayName,
} from "./displayName";
import {
  LIVE_WATCH_MAX_SHARES,
  LIVE_WATCH_TTL_MS,
  LIVE_WATCH_VIEWER_MAX,
  LIVE_WATCH_VIEWER_STALE_MS,
  LIVE_WATCH_VIEWER_WARN,
  type LiveWatchPublicViewer,
  type LiveWatchSession,
  type LiveWatchSnapshot,
  type LiveWatchViewer,
} from "./types";

type SessionRecord = Omit<LiveWatchSession, "viewers">;

type MemoryStore = {
  records: Map<string, SessionRecord>;
  viewers: Map<string, Record<string, LiveWatchViewer>>;
};

const INDEX_KEY = "olympus:lw:ids";

function sessionKey(id: string): string {
  return `olympus:lw:s:${id}`;
}

function viewersKey(id: string): string {
  return `olympus:lw:v:${id}`;
}

function ttlSec(expiresAt: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((expiresAt - now) / 1000));
}

function redisCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function allowMemoryFallback(): boolean {
  if (process.env.LIVE_WATCH_STORE === "memory") return true;
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return false;
  return true;
}

let redisClient: Redis | null | undefined;

function redis(): Redis | null {
  if (process.env.LIVE_WATCH_STORE === "memory") return null;
  if (process.env.NODE_ENV === "test") return null;
  if (redisClient !== undefined) return redisClient;
  const creds = redisCredentials();
  if (!creds) {
    if (!allowMemoryFallback()) {
      throw new Error(
        "Live watch requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN"
      );
    }
    redisClient = null;
    return null;
  }
  redisClient = new Redis(creds);
  return redisClient;
}

function memory(): MemoryStore {
  const g = globalThis as typeof globalThis & {
    __olympusLiveWatch?: MemoryStore;
  };
  if (!g.__olympusLiveWatch) {
    g.__olympusLiveWatch = {
      records: new Map(),
      viewers: new Map(),
    };
  }
  return g.__olympusLiveWatch;
}

function randomId(bytes = 9): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, bytes * 2);
}

function activeViewers(
  viewers: LiveWatchViewer[],
  now = Date.now()
): LiveWatchViewer[] {
  const cutoff = now - LIVE_WATCH_VIEWER_STALE_MS;
  return viewers.filter((v) => v.lastSeenAt >= cutoff);
}

function parseViewer(value: unknown): LiveWatchViewer | null {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<LiveWatchViewer>;
  if (typeof v.id !== "string") return null;
  const displayName =
    sanitizeLiveWatchDisplayName(v.displayName) ?? "";
  return {
    id: v.id,
    displayName,
    joinOrder: Number(v.joinOrder) || 0,
    joinedAt: Number(v.joinedAt) || 0,
    lastSeenAt: Number(v.lastSeenAt) || 0,
  };
}

function parseRecord(value: unknown): SessionRecord | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<SessionRecord>;
  if (
    typeof v.id !== "string" ||
    typeof v.secret !== "string" ||
    typeof v.matchId !== "string" ||
    typeof v.createdAt !== "number" ||
    typeof v.updatedAt !== "number" ||
    typeof v.expiresAt !== "number" ||
    !v.snapshot
  ) {
    return null;
  }
  return {
    ...(v as SessionRecord),
    joinSeq: Number(v.joinSeq) || 0,
  };
}

function viewersFromHash(raw: unknown): LiveWatchViewer[] {
  if (!raw || typeof raw !== "object") return [];
  const out: LiveWatchViewer[] = [];
  for (const value of Object.values(raw as Record<string, unknown>)) {
    const viewer = parseViewer(value);
    if (viewer) out.push(viewer);
  }
  return out;
}

async function listIds(): Promise<string[]> {
  const client = redis();
  if (!client) return Array.from(memory().records.keys());
  const ids = await client.smembers(INDEX_KEY);
  return ids.map(String);
}

async function getRecord(id: string): Promise<SessionRecord | null> {
  const client = redis();
  if (!client) return memory().records.get(id) ?? null;
  return parseRecord(await client.get(sessionKey(id)));
}

async function putRecord(record: SessionRecord): Promise<void> {
  const client = redis();
  const ttl = ttlSec(record.expiresAt);
  if (!client) {
    memory().records.set(record.id, record);
    return;
  }
  await client.set(sessionKey(record.id), record, { ex: ttl });
  await client.sadd(INDEX_KEY, record.id);
}

async function deleteStored(id: string): Promise<void> {
  const client = redis();
  if (!client) {
    memory().records.delete(id);
    memory().viewers.delete(id);
    return;
  }
  await client.del(sessionKey(id), viewersKey(id));
  await client.srem(INDEX_KEY, id);
}

async function getViewers(id: string): Promise<LiveWatchViewer[]> {
  const client = redis();
  if (!client) {
    const hash = memory().viewers.get(id);
    return hash ? Object.values(hash) : [];
  }
  return viewersFromHash(await client.hgetall(viewersKey(id)));
}

async function putViewer(
  id: string,
  viewer: LiveWatchViewer,
  expiresAt: number
): Promise<void> {
  const client = redis();
  if (!client) {
    const hash = memory().viewers.get(id) ?? {};
    hash[viewer.id] = viewer;
    memory().viewers.set(id, hash);
    return;
  }
  await client.hset(viewersKey(id), { [viewer.id]: viewer });
  await client.expire(viewersKey(id), ttlSec(expiresAt));
}

async function removeViewer(id: string, viewerId: string): Promise<boolean> {
  const client = redis();
  if (!client) {
    const hash = memory().viewers.get(id);
    if (!hash || !(viewerId in hash)) return false;
    delete hash[viewerId];
    return true;
  }
  const removed = await client.hdel(viewersKey(id), viewerId);
  return Number(removed) > 0;
}

async function replaceViewers(
  id: string,
  viewers: LiveWatchViewer[],
  expiresAt: number
): Promise<void> {
  const client = redis();
  if (!client) {
    const hash: Record<string, LiveWatchViewer> = {};
    for (const viewer of viewers) hash[viewer.id] = viewer;
    memory().viewers.set(id, hash);
    return;
  }
  await client.del(viewersKey(id));
  if (viewers.length === 0) return;
  const hash: Record<string, LiveWatchViewer> = {};
  for (const viewer of viewers) hash[viewer.id] = viewer;
  await client.hset(viewersKey(id), hash);
  await client.expire(viewersKey(id), ttlSec(expiresAt));
}

async function loadSession(id: string): Promise<LiveWatchSession | null> {
  const record = await getRecord(id);
  const now = Date.now();
  if (!record) {
    await deleteStored(id);
    return null;
  }
  if (record.expiresAt <= now) {
    await deleteStored(id);
    return null;
  }
  const stored = await getViewers(id);
  const viewers = activeViewers(stored, now);
  if (viewers.length !== stored.length) {
    await replaceViewers(id, viewers, record.expiresAt);
  }
  return { ...record, viewers };
}

export function liveWatchLimits() {
  return {
    maxShares: LIVE_WATCH_MAX_SHARES,
    viewerWarn: LIVE_WATCH_VIEWER_WARN,
    viewerMax: LIVE_WATCH_VIEWER_MAX,
    ttlMs: LIVE_WATCH_TTL_MS,
  };
}

export async function listLiveWatchSessions(): Promise<LiveWatchSession[]> {
  const ids = await listIds();
  const sessions = (
    await Promise.all(ids.map((id) => loadSession(id)))
  ).filter((session): session is LiveWatchSession => session != null);
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getLiveWatchSession(
  id: string
): Promise<LiveWatchSession | null> {
  return loadSession(id);
}

export async function createLiveWatchSession(input: {
  matchId: string;
  snapshot: LiveWatchSnapshot;
}):
  Promise<
    { ok: true; session: LiveWatchSession } | { ok: false; error: "full" }
  > {
  const existing = await listLiveWatchSessions();
  if (existing.length >= LIVE_WATCH_MAX_SHARES) {
    return { ok: false, error: "full" };
  }
  const now = Date.now();
  const record: SessionRecord = {
    id: randomId(8),
    secret: randomId(12),
    matchId: input.matchId,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + LIVE_WATCH_TTL_MS,
    joinSeq: 0,
    snapshot: { ...input.snapshot, updatedAt: now },
  };
  await putRecord(record);
  return { ok: true, session: { ...record, viewers: [] } };
}

export async function updateLiveWatchSession(
  id: string,
  secret: string,
  snapshot: LiveWatchSnapshot
): Promise<
  | { ok: true; session: LiveWatchSession; viewerWarn: boolean }
  | { ok: false; error: "not_found" | "unauthorized" | "expired" }
> {
  const record = await getRecord(id);
  if (!record) {
    await deleteStored(id);
    return { ok: false, error: "not_found" };
  }
  if (record.secret !== secret) return { ok: false, error: "unauthorized" };
  const now = Date.now();
  if (record.expiresAt <= now) {
    await deleteStored(id);
    return { ok: false, error: "expired" };
  }
  const viewers = activeViewers(await getViewers(id), now);
  const next: SessionRecord = {
    ...record,
    snapshot: { ...snapshot, updatedAt: now },
    updatedAt: now,
    expiresAt: now + LIVE_WATCH_TTL_MS,
  };
  await putRecord(next);
  await replaceViewers(id, viewers, next.expiresAt);
  return {
    ok: true,
    session: { ...next, viewers },
    viewerWarn: viewers.length >= LIVE_WATCH_VIEWER_WARN,
  };
}

export async function deleteLiveWatchSession(
  id: string,
  secret?: string,
  opts?: { admin?: boolean }
): Promise<boolean> {
  const record = await getRecord(id);
  if (!record) {
    await deleteStored(id);
    return false;
  }
  if (!opts?.admin && secret != null && record.secret !== secret) {
    return false;
  }
  await deleteStored(id);
  return true;
}

export async function clearLiveWatchViewers(
  id: string
): Promise<LiveWatchSession | null> {
  const session = await loadSession(id);
  if (!session) return null;
  const now = Date.now();
  const next: SessionRecord = {
    id: session.id,
    secret: session.secret,
    matchId: session.matchId,
    createdAt: session.createdAt,
    updatedAt: now,
    expiresAt: session.expiresAt,
    snapshot: session.snapshot,
    joinSeq: session.joinSeq,
  };
  await putRecord(next);
  await replaceViewers(id, [], session.expiresAt);
  return { ...next, viewers: [] };
}

function takenDisplayNames(
  viewers: LiveWatchViewer[],
  exceptId?: string
): string[] {
  return viewers
    .filter((v) => v.id !== exceptId && v.displayName)
    .map((v) => v.displayName);
}

function nextJoinOrder(
  record: SessionRecord,
  viewers: LiveWatchViewer[]
): number {
  const maxAssigned = Math.max(
    record.joinSeq || 0,
    0,
    ...viewers.map((v) => v.joinOrder || 0)
  );
  return maxAssigned + 1;
}

function withDisplayName(
  viewer: LiveWatchViewer,
  requested: string | null,
  others: LiveWatchViewer[]
): LiveWatchViewer {
  if (requested) return { ...viewer, displayName: requested };
  if (viewer.displayName) return viewer;
  return {
    ...viewer,
    displayName: pickGuestDisplayName(
      takenDisplayNames(others, viewer.id),
      viewer.joinOrder || 1
    ),
  };
}

export async function joinLiveWatchViewer(
  id: string,
  input?: { viewerId?: string; displayName?: unknown }
): Promise<
  | { ok: true; viewer: LiveWatchViewer; session: LiveWatchSession }
  | { ok: false; error: "not_found" | "full" | "expired" }
> {
  const record = await getRecord(id);
  const now = Date.now();
  if (!record) {
    await deleteStored(id);
    return { ok: false, error: "not_found" };
  }
  if (record.expiresAt <= now) {
    await deleteStored(id);
    return { ok: false, error: "expired" };
  }
  const viewers = activeViewers(await getViewers(id), now);
  const requested = sanitizeLiveWatchDisplayName(input?.displayName);
  const viewerId = input?.viewerId;

  if (viewerId) {
    const existing = viewers.find((v) => v.id === viewerId);
    if (existing) {
      let viewer: LiveWatchViewer = { ...existing, lastSeenAt: now };
      let next = record;
      if (!viewer.joinOrder) {
        viewer = { ...viewer, joinOrder: nextJoinOrder(record, viewers) };
        next = { ...record, joinSeq: viewer.joinOrder, updatedAt: now };
        await putRecord(next);
      }
      viewer = withDisplayName(viewer, requested, viewers);
      const idx = viewers.findIndex((v) => v.id === viewer.id);
      viewers[idx] = viewer;
      await putViewer(id, viewer, next.expiresAt);
      return { ok: true, viewer, session: { ...next, viewers } };
    }
  }
  if (viewers.length >= LIVE_WATCH_VIEWER_MAX) {
    await replaceViewers(id, viewers, record.expiresAt);
    return { ok: false, error: "full" };
  }
  const joinOrder = nextJoinOrder(record, viewers);
  const viewer: LiveWatchViewer = {
    id: viewerId && viewerId.length > 8 ? viewerId : randomId(8),
    displayName:
      requested ?? pickGuestDisplayName(takenDisplayNames(viewers), joinOrder),
    joinOrder,
    joinedAt: now,
    lastSeenAt: now,
  };
  viewers.push(viewer);
  const next: SessionRecord = {
    ...record,
    updatedAt: now,
    joinSeq: joinOrder,
  };
  await putRecord(next);
  await putViewer(id, viewer, record.expiresAt);
  return { ok: true, viewer, session: { ...next, viewers } };
}

export async function heartbeatLiveWatchViewer(
  id: string,
  viewerId: string
): Promise<
  { ok: true; session: LiveWatchSession } | { ok: false; error: "not_found" | "viewer" }
> {
  const record = await getRecord(id);
  if (!record) {
    await deleteStored(id);
    return { ok: false, error: "not_found" };
  }
  const now = Date.now();
  const viewers = activeViewers(await getViewers(id), now);
  const viewer = viewers.find((v) => v.id === viewerId);
  if (!viewer) return { ok: false, error: "viewer" };
  viewer.lastSeenAt = now;
  await putViewer(id, viewer, record.expiresAt);
  return { ok: true, session: { ...record, viewers } };
}

export async function leaveLiveWatchViewer(
  id: string,
  viewerId: string
): Promise<boolean> {
  const record = await getRecord(id);
  if (!record) return false;
  const removed = await removeViewer(id, viewerId);
  if (removed) {
    await putRecord({ ...record, updatedAt: Date.now() });
  }
  return removed;
}

/** Admin: kick one viewer by id. */
export async function kickLiveWatchViewer(
  id: string,
  viewerId: string
): Promise<boolean> {
  return leaveLiveWatchViewer(id, viewerId);
}

function publicViewers(viewers: LiveWatchViewer[]): LiveWatchPublicViewer[] {
  return activeViewers(viewers)
    .slice()
    .sort(
      (a, b) =>
        (a.joinOrder || 0) - (b.joinOrder || 0) || a.joinedAt - b.joinedAt
    )
    .map((v) => ({
      id: v.id,
      displayName:
        v.displayName || (v.joinOrder ? `Guest ${v.joinOrder}` : "Guest"),
      joinOrder: v.joinOrder || 0,
    }));
}

export function publicSessionPayload(
  session: LiveWatchSession,
  extras?: { viewerId?: string }
) {
  const viewers = publicViewers(session.viewers);
  return {
    id: session.id,
    status: "live" as const,
    matchId: session.matchId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
    viewerCount: viewers.length,
    viewers,
    snapshot: session.snapshot,
    limits: liveWatchLimits(),
    ...(extras?.viewerId ? { viewerId: extras.viewerId } : {}),
  };
}

/** Test helper: drop in-memory sessions. No-op for Redis. */
export function resetLiveWatchStoreForTests(): void {
  memory().records.clear();
  memory().viewers.clear();
}
