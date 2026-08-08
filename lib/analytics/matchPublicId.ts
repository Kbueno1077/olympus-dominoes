/**
 * Stable cross-DB match identity (same alphabet/length as player public_id).
 */

import {
  generatePlayerPublicId,
  isValidPlayerPublicId,
  PLAYER_PUBLIC_ID_LENGTH,
  resolveImportedPublicId,
} from "./playerPublicId";

export const MATCH_PUBLIC_ID_LENGTH = PLAYER_PUBLIC_ID_LENGTH;

export function generateMatchPublicId(): string {
  return generatePlayerPublicId();
}

export function isValidMatchPublicId(value: unknown): value is string {
  return isValidPlayerPublicId(value);
}

export function resolveImportedMatchPublicId(
  raw: string | number | null | undefined,
  used: Set<string>
): string {
  return resolveImportedPublicId(raw, used);
}
