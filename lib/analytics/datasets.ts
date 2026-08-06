import type { OlympusExportData } from "./types";

export const DATASETS_REGISTRY_KEY = "olympus-web-datasets-v1";
export const DATASET_DATA_PREFIX = "olympus-web-dataset-data-";
/** Legacy single-slot key — migrated into the default data set on first load. */
export const LEGACY_EXPORT_KEY = "olympus-web-analytics-export-v1";
export const DEFAULT_DATASET_ID = "default";

export type DatasetMeta = {
  id: string;
  displayName: string;
  fileName: string;
  updatedAt: string;
};

export type DatasetRegistry = {
  activeDatasetId: string;
  datasets: DatasetMeta[];
};

export type CompareLaunch = {
  modeLabel: string | null;
  playerIds: number[];
  teams: Record<number, 1 | 2 | null>;
  matchupMode: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `ds_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugifyName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "dataset";
}

function defaultRegistry(): DatasetRegistry {
  const updatedAt = nowIso();
  return {
    activeDatasetId: DEFAULT_DATASET_ID,
    datasets: [
      {
        id: DEFAULT_DATASET_ID,
        displayName: "Local",
        fileName: "",
        updatedAt,
      },
    ],
  };
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / private mode.
  }
}

function removeKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function dataKeyFor(id: string): string {
  return `${DATASET_DATA_PREFIX}${id}`;
}

export function loadDatasetRegistry(): DatasetRegistry {
  const stored = readJson<DatasetRegistry>(DATASETS_REGISTRY_KEY);
  if (
    stored?.activeDatasetId &&
    Array.isArray(stored.datasets) &&
    stored.datasets.length > 0
  ) {
    return stored;
  }

  const registry = defaultRegistry();
  const legacy = readJson<OlympusExportData>(LEGACY_EXPORT_KEY);
  if (legacy) {
    registry.datasets[0] = {
      ...registry.datasets[0],
      displayName: legacy.fileName
        ? suggestedDatasetNameFromFile(legacy.fileName)
        : "Local",
      fileName: legacy.fileName ?? "",
      updatedAt: legacy.importedAt ?? nowIso(),
    };
    writeJson(dataKeyFor(DEFAULT_DATASET_ID), legacy);
    removeKey(LEGACY_EXPORT_KEY);
  }
  writeJson(DATASETS_REGISTRY_KEY, registry);
  return registry;
}

export function saveDatasetRegistry(registry: DatasetRegistry) {
  writeJson(DATASETS_REGISTRY_KEY, registry);
}

export function loadDatasetData(id: string): OlympusExportData | null {
  return readJson<OlympusExportData>(dataKeyFor(id));
}

export function saveDatasetData(id: string, data: OlympusExportData | null) {
  if (!data) {
    removeKey(dataKeyFor(id));
    return;
  }
  writeJson(dataKeyFor(id), data);
}

export function suggestedDatasetNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.(csv|sql)$/i, "");
  const cleaned = base.replace(/^olympus[-_]?/i, "").trim();
  if (!cleaned) return "Imported";
  return cleaned.slice(0, 48);
}

export function renameDatasetInRegistry(
  registry: DatasetRegistry,
  id: string,
  displayName: string
): DatasetRegistry {
  const name = displayName.trim();
  if (!name) throw new Error("empty_name");
  const datasets = registry.datasets.map((d) =>
    d.id === id ? { ...d, displayName: name, updatedAt: nowIso() } : d
  );
  if (!datasets.some((d) => d.id === id)) throw new Error("not_found");
  return { ...registry, datasets };
}

export function touchDatasetInRegistry(
  registry: DatasetRegistry,
  id: string,
  fileName?: string
): DatasetRegistry {
  const datasets = registry.datasets.map((d) =>
    d.id === id
      ? {
          ...d,
          updatedAt: nowIso(),
          fileName: fileName != null ? fileName : d.fileName,
        }
      : d
  );
  return { ...registry, datasets };
}

export function registerNewDatasetInRegistry(
  registry: DatasetRegistry,
  displayName: string,
  fileName = ""
): { registry: DatasetRegistry; dataset: DatasetMeta } {
  const name = displayName.trim() || "Dataset";
  const id = newId();
  const dataset: DatasetMeta = {
    id,
    displayName: name,
    fileName,
    updatedAt: nowIso(),
  };
  return {
    registry: {
      activeDatasetId: id,
      datasets: [...registry.datasets, dataset],
    },
    dataset,
  };
}

export function setActiveDatasetInRegistry(
  registry: DatasetRegistry,
  id: string
): DatasetRegistry {
  if (!registry.datasets.some((d) => d.id === id)) {
    throw new Error("not_found");
  }
  return { ...registry, activeDatasetId: id };
}

export function removeDatasetFromRegistryLocal(
  registry: DatasetRegistry,
  id: string
): DatasetRegistry {
  if (registry.datasets.length <= 1) {
    throw new Error("last_dataset");
  }
  if (!registry.datasets.some((d) => d.id === id)) {
    throw new Error("not_found");
  }
  const datasets = registry.datasets.filter((d) => d.id !== id);
  let activeDatasetId = registry.activeDatasetId;
  if (activeDatasetId === id) {
    activeDatasetId = datasets[0].id;
  }
  return { activeDatasetId, datasets };
}

export function exportBasenameForDataset(displayName: string): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `olympus-${slugifyName(displayName)}-${yyyy}-${mm}-${dd}`;
}
