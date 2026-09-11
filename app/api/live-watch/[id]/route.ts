import {
  getLiveWatchSession,
  joinLiveWatchViewer,
  publicSessionPayload,
  updateLiveWatchSession,
  deleteLiveWatchSession,
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

function updateErrorStatus(
  error: "not_found" | "unauthorized" | "expired"
): number {
  switch (error) {
    case "unauthorized":
      return 401;
    case "expired":
      return 410;
    case "not_found":
      return 404;
    default: {
      const _never: never = error;
      return _never;
    }
  }
}

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
  const session = await getLiveWatchSession(params.id);
  if (!session) {
    return liveWatchJson({ status: "not_found", error: "not_found" }, 404);
  }
  return liveWatchJson(publicSessionPayload(session));
}

function joinErrorStatus(error: "not_found" | "full" | "expired"): number {
  switch (error) {
    case "full":
      return 403;
    case "expired":
      return 410;
    case "not_found":
      return 404;
    default: {
      const _never: never = error;
      return _never;
    }
  }
}

/** One call: join or heartbeat this viewer, return score + watching list. */
export async function POST(req: Request, { params }: Ctx) {
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
  let body: { viewerId?: string; displayName?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const result = await joinLiveWatchViewer(params.id, {
    viewerId: body.viewerId,
    displayName: body.displayName,
  });
  if (!result.ok) {
    return liveWatchJson({ error: result.error }, joinErrorStatus(result.error));
  }
  return liveWatchJson(
    publicSessionPayload(result.session, { viewerId: result.viewer.id })
  );
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
  const result = await updateLiveWatchSession(
    params.id,
    secret,
    body.snapshot
  );
  if (!result.ok) {
    return liveWatchJson({ error: result.error }, updateErrorStatus(result.error));
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
  const deleted = await deleteLiveWatchSession(params.id, secret);
  if (!deleted) {
    return liveWatchJson({ error: "not_found_or_unauthorized" }, 404);
  }
  return liveWatchJson({ ok: true });
}
