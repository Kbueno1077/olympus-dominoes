import { describe, expect, it } from "vitest";
import {
  generatePlayerPublicId,
  isValidPlayerPublicId,
  PLAYER_PUBLIC_ID_LENGTH,
  resolveImportedPublicId,
} from "./playerPublicId";

describe("generatePlayerPublicId", () => {
  it("returns a 16-character alphanumeric string", () => {
    const id = generatePlayerPublicId();
    expect(id).toHaveLength(PLAYER_PUBLIC_ID_LENGTH);
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
    expect(isValidPlayerPublicId(id)).toBe(true);
  });

  it("produces distinct values across calls", () => {
    const ids = new Set(
      Array.from({ length: 40 }, () => generatePlayerPublicId())
    );
    expect(ids.size).toBeGreaterThan(35);
  });
});

describe("isValidPlayerPublicId", () => {
  it("rejects wrong length or charset", () => {
    expect(isValidPlayerPublicId("abc")).toBe(false);
    expect(isValidPlayerPublicId("abcd-efgh-ijkl-mn")).toBe(false);
    expect(isValidPlayerPublicId(null)).toBe(false);
    expect(isValidPlayerPublicId("abcdefghijklmnop")).toBe(true);
  });
});

describe("resolveImportedPublicId", () => {
  it("prefers a valid public_id from the CSV over generating a new one", () => {
    const used = new Set<string>();
    const kept = resolveImportedPublicId("AbCdEfGhIjKlMnOp", used);
    expect(kept).toBe("AbCdEfGhIjKlMnOp");
    expect(used.has("AbCdEfGhIjKlMnOp")).toBe(true);
  });

  it("generates when missing or invalid (legacy export without column)", () => {
    const used = new Set<string>();
    const generated = resolveImportedPublicId(null, used);
    expect(isValidPlayerPublicId(generated)).toBe(true);
  });

  it("regenerates when the same public_id appears twice in one file", () => {
    const used = new Set<string>();
    const first = resolveImportedPublicId("AbCdEfGhIjKlMnOp", used);
    const second = resolveImportedPublicId("AbCdEfGhIjKlMnOp", used);
    expect(first).toBe("AbCdEfGhIjKlMnOp");
    expect(second).not.toBe(first);
    expect(isValidPlayerPublicId(second)).toBe(true);
  });
});
