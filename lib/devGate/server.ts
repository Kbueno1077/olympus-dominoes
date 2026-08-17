import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  GATE_COOKIE,
  GATE_ENV,
  GATE_PATH,
  type GateId,
} from "./config";

export function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function gatePassword(gate: GateId): string | undefined {
  const value = process.env[GATE_ENV[gate]];
  if (value == null || value === "") return undefined;
  return value;
}

export function isGateConfigured(gate: GateId): boolean {
  return gatePassword(gate) != null;
}

function tokenFor(password: string): Buffer {
  return createHash("sha256").update(password, "utf8").digest();
}

function sameToken(left: Buffer, right: Buffer): boolean {
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function passwordMatches(gate: GateId, password: string): boolean {
  const expected = gatePassword(gate);
  if (expected == null) return false;
  return sameToken(tokenFor(password), tokenFor(expected));
}

export function isGateOpen(gate: GateId): boolean {
  if (isLocalDev()) return true;
  const expected = gatePassword(gate);
  if (expected == null) return false;
  const raw = cookies().get(GATE_COOKIE[gate])?.value;
  if (!raw) return false;
  try {
    return sameToken(Buffer.from(raw, "hex"), tokenFor(expected));
  } catch {
    return false;
  }
}

export function setGateCookie(gate: GateId): void {
  const expected = gatePassword(gate);
  if (expected == null) return;
  cookies().set(GATE_COOKIE[gate], tokenFor(expected).toString("hex"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: GATE_PATH[gate],
    maxAge: 60 * 60 * 24 * 30,
  });
}
