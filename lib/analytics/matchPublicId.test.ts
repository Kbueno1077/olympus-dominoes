import { describe, expect, it } from "vitest";
import {
  generateMatchPublicId,
  isValidMatchPublicId,
  MATCH_PUBLIC_ID_LENGTH,
  resolveImportedMatchPublicId,
} from "./matchPublicId";

describe("generateMatchPublicId", () => {
  it("returns a 16-character alphanumeric string", () => {
    const id = generateMatchPublicId();
    expect(id).toHaveLength(MATCH_PUBLIC_ID_LENGTH);
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
    expect(isValidMatchPublicId(id)).toBe(true);
  });
});

describe("resolveImportedMatchPublicId", () => {
  it("keeps a valid id and regenerates collisions", () => {
    const used = new Set<string>();
    const first = resolveImportedMatchPublicId("AbCdEfGhIjKlMnOp", used);
    const second = resolveImportedMatchPublicId("AbCdEfGhIjKlMnOp", used);
    expect(first).toBe("AbCdEfGhIjKlMnOp");
    expect(second).not.toBe(first);
    expect(isValidMatchPublicId(second)).toBe(true);
  });
});
