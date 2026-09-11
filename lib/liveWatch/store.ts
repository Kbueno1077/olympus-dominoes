import {
  LIVE_WATCH_MAX_SHARES,
  LIVE_WATCH_TTL_MS,
  LIVE_WATCH_VIEWER_MAX,
  LIVE_WATCH_VIEWER_STALE_MS,
  LIVE_WATCH_VIEWER_WARN,
  type LiveWatchSession,
  type LiveWatchSnapshot,
  type LiveWatchViewer,
} from "./types";

type GlobalStore = {
  sessions: Map<string, LiveWatchSession>;
};

function store(): GlobalStore {
  const g = globalThis as typeof globalThis & {
    __olympusLiveWatch?: GlobalStore;
  };
  if (!g.__olympusLiveWatch) {
    g.__olympusLiveWatch = { sessions: new Map() };
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

function pruneViewers(session: LiveWatchSession, now = Date.now()): void {
  const cutoff = now - LIVE_WATCH_VIEWER_STALE_MS;
  session.viewers = session.viewers.filter((v) => v.lastSeenAt >= cutoff);
}

function pruneExpired(now = Date.now()): void {
  const sessions = store().sessions;
  for (const [id, session] of Array.from(sessions.entries())) {
    if (session.expiresAt <= now) {
      sessions.delete(id);
      continue;
    }
    pruneViewers(session, now);
  }
}

export function liveWatchLimits() {
  return {
    maxShares: LIVE_WATCH_MAX_SHARES,
    viewerWarn: LIVE_WATCH_VIEWER_WARN,
    viewerMax: LIVE_WATCH_VIEWER_MAX,
    ttlMs: LIVE_WATCH_TTL_MS,
  };
}

export function listLiveWatchSessions(): LiveWatchSession[] {
  pruneExpired();
  return Array.from(store().sessions.values()).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}

export function getLiveWatchSession(id: string): LiveWatchSession | null {
  pruneExpired();
  return store().sessions.get(id) ?? null;
}

export function createLiveWatchSession(input: {
  matchId: string;
  snapshot: LiveWatchSnapshot;
}):
  | { ok: true; session: LiveWatchSession }
  | { ok: false; error: "full" } {
  pruneExpired();
  const sessions = store().sessions;
  if (sessions.size >= LIVE_WATCH_MAX_SHARES) {
    return { ok: false, error: "full" };
  }
  const now = Date.now();
  const session: LiveWatchSession = {
    id: randomId(8),
    secret: randomId(12),
    matchId: input.matchId,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + LIVE_WATCH_TTL_MS,
    snapshot: { ...input.snapshot, updatedAt: now },
    viewers: [],
  };
  sessions.set(session.id, session);
  return { ok: true, session };
}

export function updateLiveWatchSession(
  id: string,
  secret: string,
  snapshot: LiveWatchSnapshot
):
  | { ok: true; session: LiveWatchSession; viewerWarn: boolean }
  | { ok: false; error: "not_found" | "unauthorized" | "expired" } {
  pruneExpired();
  const session = store().sessions.get(id);
  if (!session) return { ok: false, error: "not_found" };
  if (session.secret !== secret) return { ok: false, error: "unauthorized" };
  const now = Date.now();
  if (session.expiresAt <= now) {
    store().sessions.delete(id);
    return { ok: false, error: "expired" };
  }
  pruneViewers(session, now);
  session.snapshot = { ...snapshot, updatedAt: now };
  session.updatedAt = now;
  // Refresh TTL on activity so a long night stays live while scoring.
  session.expiresAt = now + LIVE_WATCH_TTL_MS;
  return {
    ok: true,
    session,
    viewerWarn: session.viewers.length >= LIVE_WATCH_VIEWER_WARN,
  };
}

export function deleteLiveWatchSession(
  id: string,
  secret?: string,
  opts?: { admin?: boolean }
): boolean {
  pruneExpired();
  const session = store().sessions.get(id);
  if (!session) return false;
  if (!opts?.admin && secret != null && session.secret !== secret) {
    return false;
  }
  return store().sessions.delete(id);
}

export function clearLiveWatchViewers(id: string): LiveWatchSession | null {
  pruneExpired();
  const session = store().sessions.get(id);
  if (!session) return null;
  session.viewers = [];
  session.updatedAt = Date.now();
  return session;
}

export function joinLiveWatchViewer(
  id: string,
  viewerId?: string
):
  | { ok: true; viewer: LiveWatchViewer; session: LiveWatchSession }
  | { ok: false; error: "not_found" | "full" | "expired" } {
  pruneExpired();
  const session = store().sessions.get(id);
  if (!session) return { ok: false, error: "not_found" };
  const now = Date.now();
  if (session.expiresAt <= now) {
    store().sessions.delete(id);
    return { ok: false, error: "expired" };
  }
  pruneViewers(session, now);

  if (viewerId) {
    const existing = session.viewers.find((v) => v.id === viewerId);
    if (existing) {
      existing.lastSeenAt = now;
      return { ok: true, viewer: existing, session };
    }
  }

  if (session.viewers.length >= LIVE_WATCH_VIEWER_MAX) {
    return { ok: false, error: "full" };
  }

  const viewer: LiveWatchViewer = {
    id: viewerId && viewerId.length > 8 ? viewerId : randomId(8),
    joinedAt: now,
    lastSeenAt: now,
  };
  session.viewers.push(viewer);
  session.updatedAt = now;
  return { ok: true, viewer, session };
}

export function heartbeatLiveWatchViewer(
  id: string,
  viewerId: string
):
  | { ok: true; session: LiveWatchSession }
  | { ok: false; error: "not_found" | "viewer" } {
  pruneExpired();
  const session = store().sessions.get(id);
  if (!session) return { ok: false, error: "not_found" };
  pruneViewers(session);
  const viewer = session.viewers.find((v) => v.id === viewerId);
  if (!viewer) return { ok: false, error: "viewer" };
  viewer.lastSeenAt = Date.now();
  return { ok: true, session };
}

export function leaveLiveWatchViewer(id: string, viewerId: string): boolean {
  pruneExpired();
  const session = store().sessions.get(id);
  if (!session) return false;
  const before = session.viewers.length;
  session.viewers = session.viewers.filter((v) => v.id !== viewerId);
  if (session.viewers.length !== before) {
    session.updatedAt = Date.now();
    return true;
  }
  return false;
}

/** Admin: kick one viewer by id. */
export function kickLiveWatchViewer(id: string, viewerId: string): boolean {
  return leaveLiveWatchViewer(id, viewerId);
}

export function publicSessionPayload(session: LiveWatchSession) {
  pruneViewers(session);
  return {
    id: session.id,
    status: "live" as const,
    matchId: session.matchId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
    viewerCount: session.viewers.length,
    snapshot: session.snapshot,
    limits: liveWatchLimits(),
  };
}
