import {
  createLiveWatchSession,
  liveWatchLimits,
  listLiveWatchSessions,
} from "@/lib/liveWatch/store";
import {
  isLiveWatchAdmin,
  isLiveWatchEnabled,
  liveWatchJson,
  liveWatchOptions,
} from "@/lib/liveWatch/http";
import type { LiveWatchSnapshot } from "@/lib/liveWatch/types";

export function OPTIONS() {
  return liveWatchOptions();
}

export async function GET(req: Request) {
  if (!isLiveWatchAdmin(req)) {
    return liveWatchJson({ error: "unauthorized" }, 401);
  }
  const sessions = listLiveWatchSessions().map((s) => ({
    id: s.id,
    matchId: s.matchId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    expiresAt: s.expiresAt,
    viewerCount: s.viewers.length,
    viewers: s.viewers,
    overallLine: s.snapshot.overallLine,
    currentLine: s.snapshot.currentLine,
    modeLabel: s.snapshot.modeLabel,
    isClosed: s.snapshot.isClosed,
  }));
  return liveWatchJson({
    sessions,
    shareCount: sessions.length,
    limits: liveWatchLimits(),
    enabled: isLiveWatchEnabled(),
  });
}

export async function POST(req: Request) {
  if (!isLiveWatchEnabled()) {
    return liveWatchJson(
      { error: "disabled", message: "Live matches are disabled for now." },
      503
    );
  }
  let body: { matchId?: string; snapshot?: LiveWatchSnapshot };
  try {
    body = await req.json();
  } catch {
    return liveWatchJson({ error: "invalid_json" }, 400);
  }
  if (!body.matchId || !body.snapshot) {
    return liveWatchJson({ error: "missing_fields" }, 400);
  }
  const result = createLiveWatchSession({
    matchId: body.matchId,
    snapshot: body.snapshot,
  });
  if (!result.ok) {
    return liveWatchJson(
      { error: "full", limits: liveWatchLimits() },
      503
    );
  }
  const { session } = result;
  return liveWatchJson({
    id: session.id,
    secret: session.secret,
    expiresAt: session.expiresAt,
    viewerCount: 0,
    shareCount: listLiveWatchSessions().length,
    limits: liveWatchLimits(),
  });
}
