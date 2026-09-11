export const GATE_IDS = ["merge", "f-lab"] as const;

export type GateId = (typeof GATE_IDS)[number];

/** Server-only env vars. Set these on Vercel for production. Not needed locally. */
export const GATE_ENV: Record<GateId, string> = {
  merge: "MERGE_PASSWORD",
  "f-lab": "F_LAB_PASSWORD",
};

export const GATE_COOKIE: Record<GateId, string> = {
  merge: "olympus_merge_gate",
  "f-lab": "olympus_f_lab_gate",
};

export const GATE_PATH: Record<GateId, string> = {
  merge: "/tools",
  "f-lab": "/f-lab",
};

/**
 * Cookie Path (not the page URL). Tools calls `/api/live-watch`, so the
 * gate cookie must be sent on `/` or the live-watch monitor 401s.
 */
export const GATE_COOKIE_PATH: Record<GateId, string> = {
  merge: "/",
  "f-lab": "/f-lab",
};

export const GATE_NAV_KEY: Record<GateId, "mergeNav" | "fLabNav"> = {
  merge: "mergeNav",
  "f-lab": "fLabNav",
};

export function assertGateId(value: string): GateId {
  if (value === "merge" || value === "f-lab") return value;
  throw new Error(`Unknown gate ${value}`);
}
