import { describe, expect, it } from "vitest";
import { importErrorMessage } from "./importError";
import { SCHEMA_TOO_NEW, SCHEMA_VERSION } from "./schemaVersion";

describe("importErrorMessage", () => {
  it("names this app's schema and the file's schema", () => {
    const t = (key: string, values?: Record<string, unknown>) =>
      key === "analyticsErrorSchemaTooNew"
        ? `supported=${values?.supported} file=${values?.file}`
        : key;
    expect(
      importErrorMessage(t, `${SCHEMA_TOO_NEW}:${SCHEMA_VERSION + 1}`)
    ).toBe(`supported=${SCHEMA_VERSION} file=${SCHEMA_VERSION + 1}`);
  });
});
