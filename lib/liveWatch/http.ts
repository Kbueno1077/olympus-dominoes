import { NextResponse } from "next/server";
import { isGateOpen } from "@/lib/devGate/server";

const ALLOWED_HEADERS =
  "Content-Type, x-live-watch-secret, x-live-watch-admin, Authorization";

export function withLiveWatchCors(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function liveWatchOptions(): NextResponse {
  return withLiveWatchCors(new NextResponse(null, { status: 204 }));
}

export function liveWatchJson(
  body: unknown,
  status = 200
): NextResponse {
  return withLiveWatchCors(NextResponse.json(body, { status }));
}

/** Admin unlock for local dev, Tools cookie, or LIVE_WATCH_ADMIN_PASSWORD / MERGE_PASSWORD. */
export function isLiveWatchAdmin(req: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (isGateOpen("merge")) return true;
  const header =
    req.headers.get("x-live-watch-admin") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected =
    process.env.LIVE_WATCH_ADMIN_PASSWORD ?? process.env.MERGE_PASSWORD;
  if (!expected) return false;
  return header === expected;
}

/**
 * Kill switch for live watch / “Live Activity View”.
 * Set LIVE_WATCH_ENABLED=false (or 0) to disable create + public watch.
 * Unset or any other value → enabled.
 */
export function isLiveWatchEnabled(): boolean {
  const raw = process.env.LIVE_WATCH_ENABLED?.trim().toLowerCase();
  if (raw === undefined || raw === "") return true;
  return raw !== "0" && raw !== "false" && raw !== "off" && raw !== "no";
}
