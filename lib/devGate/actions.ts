"use server";

import { revalidatePath } from "next/cache";
import { assertGateId, GATE_PATH } from "./config";
import { isGateOpen, passwordMatches, setGateCookie } from "./server";

export async function unlockDevGate(
  gateId: string,
  password: string
): Promise<{ ok: boolean }> {
  let gate;
  try {
    gate = assertGateId(gateId);
  } catch {
    return { ok: false };
  }
  if (!passwordMatches(gate, password)) {
    return { ok: false };
  }
  setGateCookie(gate);
  revalidatePath(GATE_PATH[gate]);
  return { ok: true };
}

/** Rewrite the gate cookie (path `/`) after Tools is already unlocked. */
export async function refreshDevGateCookie(
  gateId: string
): Promise<{ ok: boolean }> {
  let gate;
  try {
    gate = assertGateId(gateId);
  } catch {
    return { ok: false };
  }
  if (!isGateOpen(gate)) return { ok: false };
  setGateCookie(gate);
  return { ok: true };
}
