"use server";

import { revalidatePath } from "next/cache";
import { assertGateId, GATE_PATH } from "./config";
import { passwordMatches, setGateCookie } from "./server";

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
