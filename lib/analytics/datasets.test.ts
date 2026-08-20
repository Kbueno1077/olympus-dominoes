import { describe, expect, it } from "vitest";
import {
  EMPTY_REGISTRY,
  pruneDatasetsWithoutPayload,
  removeDatasetFromRegistryLocal,
  type DatasetRegistry,
} from "./datasets";

const localSlot: DatasetRegistry = {
  activeDatasetId: "default",
  datasets: [
    {
      id: "default",
      displayName: "Local",
      fileName: "",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

describe("pruneDatasetsWithoutPayload", () => {
  it("drops the empty Local slot when nothing is stored", () => {
    expect(
      pruneDatasetsWithoutPayload(localSlot, () => false)
    ).toEqual(EMPTY_REGISTRY);
  });

  it("keeps a set that has a payload", () => {
    const kept = pruneDatasetsWithoutPayload(
      localSlot,
      (id) => id === "default"
    );
    expect(kept.datasets).toHaveLength(1);
    expect(kept.activeDatasetId).toBe("default");
  });
});

describe("removeDatasetFromRegistryLocal", () => {
  it("leaves no placeholder after deleting the last set", () => {
    expect(removeDatasetFromRegistryLocal(localSlot, "default")).toEqual(
      EMPTY_REGISTRY
    );
  });
});
