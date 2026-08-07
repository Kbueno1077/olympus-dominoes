/** Stable cross-DB player identity (URL-safe alphanumeric, nanoid-style). */
export const PLAYER_PUBLIC_ID_LENGTH = 16;

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/** 16-character URL-safe alphanumeric id. */
export function generatePlayerPublicId(): string {
  const bytes = randomBytes(PLAYER_PUBLIC_ID_LENGTH);
  let id = "";
  for (let i = 0; i < PLAYER_PUBLIC_ID_LENGTH; i++) {
    id += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return id;
}

export function isValidPlayerPublicId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === PLAYER_PUBLIC_ID_LENGTH &&
    /^[A-Za-z0-9]+$/.test(value)
  );
}

/**
 * Prefer a valid public_id from import data; otherwise allocate a new one.
 * Tracks ids already claimed in the current import batch.
 */
export function resolveImportedPublicId(
  raw: string | number | null | undefined,
  used: Set<string>
): string {
  const asString = raw == null ? "" : String(raw);
  let publicId = isValidPlayerPublicId(asString) ? asString : "";
  if (publicId && used.has(publicId)) publicId = "";
  if (!publicId) {
    do {
      publicId = generatePlayerPublicId();
    } while (used.has(publicId));
  }
  used.add(publicId);
  return publicId;
}
