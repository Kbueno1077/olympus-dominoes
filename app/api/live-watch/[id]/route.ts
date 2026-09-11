import {
  deleteLiveWatchSession,
  getLiveWatchSession,
  publicSessionPayload,
  updateLiveWatchSession,
} from "@/lib/liveWatch/store";
import {
  isLiveWatchEnabled,
  liveWatchJson,
  liveWatchOptions,
} from "@/lib/liveWatch/http";
import type { LiveWatchSnapshot } from "@/lib/liveWatch/types";

export function OPTIONS() {
  return liveWatchOptions();
}

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  if (!isLiveWatchEnabled()) {
    return liveWatchJson(
      {
        status: "disabled",
        error: "disabled",
        message: "Live matches are disabled for now.",
      },
      503
    );
  }
  const session = getLiveWatchSession(params.id);
  if (!session) {
    return liveWatchJson({ status: "not_found", error: "not_found" }, 404);
  }
  return liveWatchJson(publicSessionPayload(session));
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!isLiveWatchEnabled()) {
    return liveWatchJson(
      { error: "disabled", message: "Live matches are disabled for now." },
      503
    );
  }
  const secret = req.headers.get("x-live-watch-secret") ?? "";
  let body: { snapshot?: LiveWatchSnapshot };
  try {
    body = await req.json();
  } catch {
    return liveWatchJson({ error: "invalid_json" }, 400);
  }
  if (!body.snapshot) {
    return liveWatchJson({ error: "missing_snapshot" }, 400);
  }
  const result = updateLiveWatchSession(params.id, secret, body.snapshot);
  if (!result.ok) {
    const status =
      result.error === "unauthorized"
        ? 401
        : result.error === "expired"
          ? 410
          : 404;
    return liveWatchJson({ error: result.error }, status);
  }
  return liveWatchJson({
    ok: true,
    viewerCount: result.session.viewers.length,
    viewerWarn: result.viewerWarn,
    expiresAt: result.session.expiresAt,
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const secret = req.headers.get("x-live-watch-secret") ?? "";
  const deleted = deleteLiveWatchSession(params.id, secret);
  if (!deleted) {
    return liveWatchJson({ error: "not_found_or_unauthorized" }, 404);
  }
  return liveWatchJson({ ok: true });
}
