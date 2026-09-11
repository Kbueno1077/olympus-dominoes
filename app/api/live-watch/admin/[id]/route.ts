import {
  clearLiveWatchViewers,
  deleteLiveWatchSession,
  getLiveWatchSession,
  kickLiveWatchViewer,
} from "@/lib/liveWatch/store";
import {
  isLiveWatchAdmin,
  liveWatchJson,
  liveWatchOptions,
} from "@/lib/liveWatch/http";

export function OPTIONS() {
  return liveWatchOptions();
}

type Ctx = { params: { id: string } };

/** Admin: remove a live share (kick the whole “server”). */
export async function DELETE(req: Request, { params }: Ctx) {
  if (!isLiveWatchAdmin(req)) {
    return liveWatchJson({ error: "unauthorized" }, 401);
  }
  const ok = deleteLiveWatchSession(params.id, undefined, { admin: true });
  if (!ok) return liveWatchJson({ error: "not_found" }, 404);
  return liveWatchJson({ ok: true });
}

/**
 * Admin actions:
 * - clear_viewers — kick everyone
 * - kick_viewer — kick one by viewerId
 */
export async function POST(req: Request, { params }: Ctx) {
  if (!isLiveWatchAdmin(req)) {
    return liveWatchJson({ error: "unauthorized" }, 401);
  }
  let body: { action?: "clear_viewers" | "kick_viewer"; viewerId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body ok for clear
  }

  const action = body.action ?? "clear_viewers";

  if (!getLiveWatchSession(params.id)) {
    return liveWatchJson({ error: "not_found" }, 404);
  }

  if (action === "clear_viewers") {
    const session = clearLiveWatchViewers(params.id);
    return liveWatchJson({
      ok: true,
      viewerCount: session?.viewers.length ?? 0,
    });
  }

  if (action === "kick_viewer") {
    if (!body.viewerId) {
      return liveWatchJson({ error: "missing_viewer" }, 400);
    }
    const ok = kickLiveWatchViewer(params.id, body.viewerId);
    if (!ok) return liveWatchJson({ error: "viewer_not_found" }, 404);
    const session = getLiveWatchSession(params.id);
    return liveWatchJson({
      ok: true,
      viewerCount: session?.viewers.length ?? 0,
    });
  }

  return liveWatchJson({ error: "bad_action" }, 400);
}
