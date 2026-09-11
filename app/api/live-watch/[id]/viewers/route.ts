import {
  heartbeatLiveWatchViewer,
  joinLiveWatchViewer,
  leaveLiveWatchViewer,
} from "@/lib/liveWatch/store";
import {
  isLiveWatchEnabled,
  liveWatchJson,
  liveWatchOptions,
} from "@/lib/liveWatch/http";

export function OPTIONS() {
  return liveWatchOptions();
}

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  if (!isLiveWatchEnabled()) {
    return liveWatchJson(
      { error: "disabled", message: "Live matches are disabled for now." },
      503
    );
  }

  let body: {
    action?: "join" | "heartbeat" | "leave";
    viewerId?: string;
    displayName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return liveWatchJson({ error: "invalid_json" }, 400);
  }

  const action = body.action ?? "join";

  switch (action) {
    case "join": {
      const result = await joinLiveWatchViewer(params.id, {
        viewerId: body.viewerId,
        displayName: body.displayName,
      });
      if (!result.ok) {
        const status =
          result.error === "full"
            ? 403
            : result.error === "expired"
              ? 410
              : 404;
        return liveWatchJson({ error: result.error }, status);
      }
      return liveWatchJson({
        viewerId: result.viewer.id,
        displayName: result.viewer.displayName,
        joinOrder: result.viewer.joinOrder,
        viewerCount: result.session.viewers.length,
        viewers: result.session.viewers.map((v) => ({
          id: v.id,
          displayName: v.displayName,
          joinOrder: v.joinOrder,
        })),
      });
    }
    case "heartbeat": {
      if (!body.viewerId) {
        return liveWatchJson({ error: "missing_viewer" }, 400);
      }
      const result = await heartbeatLiveWatchViewer(params.id, body.viewerId);
      if (!result.ok) {
        return liveWatchJson({ error: result.error }, 404);
      }
      return liveWatchJson({
        ok: true,
        viewerCount: result.session.viewers.length,
      });
    }
    case "leave": {
      if (!body.viewerId) {
        return liveWatchJson({ error: "missing_viewer" }, 400);
      }
      await leaveLiveWatchViewer(params.id, body.viewerId);
      return liveWatchJson({ ok: true });
    }
    default: {
      const _never: never = action;
      return liveWatchJson({ error: "bad_action", detail: _never }, 400);
    }
  }
}
