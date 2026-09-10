import { describe, expect, it } from "vitest";
import {
  DB_IDENTIFIER_LENGTH,
  generateDbIdentifier,
  isValidDbIdentifier,
  isValidDbMetaOrigin,
  resolveImportedDbIdentifier,
} from "./dbMeta";

describe("generateDbIdentifier", () => {
  it("returns a 16-character alphanumeric string", () => {
    const id = generateDbIdentifier();
    expect(id).toHaveLength(DB_IDENTIFIER_LENGTH);
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
    expect(isValidDbIdentifier(id)).toBe(true);
  });

  it("produces distinct values across calls", () => {
    const ids = new Set(
      Array.from({ length: 40 }, () => generateDbIdentifier())
    );
    expect(ids.size).toBeGreaterThan(35);
  });
});

describe("isValidDbMetaOrigin", () => {
  it("accepts local | imported | web only", () => {
    expect(isValidDbMetaOrigin("local")).toBe(true);
    expect(isValidDbMetaOrigin("imported")).toBe(true);
    expect(isValidDbMetaOrigin("web")).toBe(true);
    expect(isValidDbMetaOrigin("cloud")).toBe(false);
    expect(isValidDbMetaOrigin(null)).toBe(false);
  });
});

describe("resolveImportedDbIdentifier", () => {
  it("keeps a valid id from CSV", () => {
    expect(resolveImportedDbIdentifier("AbCdEfGhIjKlMnOp")).toBe(
      "AbCdEfGhIjKlMnOp"
    );
  });

  it("generates when missing or invalid", () => {
    const generated = resolveImportedDbIdentifier(null);
    expect(isValidDbIdentifier(generated)).toBe(true);
    expect(isValidDbIdentifier(resolveImportedDbIdentifier("short"))).toBe(
      true
    );
  });
});
