"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearCompareLaunch,
  peekCompareLaunch,
  stashCompareLaunch,
} from "./compareLaunch";
import {
  DEFAULT_DATASET_ID,
  loadDatasetData,
  loadDatasetRegistry,
  registerNewDatasetInRegistry,
  removeDatasetFromRegistryLocal,
  renameDatasetInRegistry,
  saveDatasetData,
  saveDatasetRegistry,
  setActiveDatasetInRegistry,
  suggestedDatasetNameFromFile,
  touchDatasetInRegistry,
  type CompareLaunch,
  type DatasetMeta,
  type DatasetRegistry,
} from "./datasets";
import { parseOlympusExport } from "./parseExport";
import { normalizeImportedTileSet } from "./schemaVersion";
import {
  withDbMetaLabel,
  withEnsuredDbMeta,
  withTouchedDbMeta,
} from "./dbMetaState";
import { withEnsuredMatchPublicIds } from "./matchIdentity";
import {
  analyzeMerge,
  materializeMergedExport,
  type MergeResolutions,
  type MergeSource,
} from "./mergeDatasets";
import { withEnsuredPlayerPublicIds } from "./playerIdentity";
import { recalculateAllJosesCoefficients } from "./joseCoefficient";
import { withStatsFilledFromMatches } from "./recomputeFromMatches";
import type { OlympusExportData } from "./types";

type AnalyticsContextValue = {
  data: OlympusExportData | null;
  registry: DatasetRegistry;
  activeDataset: DatasetMeta | null;
  error: string | null;
  loading: boolean;
  /** Replace data in the active data set. */
  importFile: (file: File) => Promise<void>;
  importText: (contents: string, fileName: string) => void;
  /** Import file as a brand-new named data set and switch to it. */
  importAsNew: (file: File, displayName?: string) => Promise<void>;
  /**
   * Merge 2+ saved datasets into a brand-new dataset (never overwrites sources).
   * Switches active to the merged set.
   */
  createMergedDataset: (
    displayName: string,
    datasetIds: string[],
    resolutions: MergeResolutions,
    options?: { excludeMatchKeys?: Iterable<string> }
  ) => DatasetMeta;
  switchDataset: (id: string) => void;
  renameDataset: (id: string, displayName: string) => void;
  deleteDataset: (id: string) => void;
  /** Mark one roster player as "You" (clears any previous mark). */
  setMyselfPlayer: (playerId: number) => void;
  /** Remove the "You" badge from every player in the active data set. */
  clearMyselfPlayer: () => void;
  /** Recompute Jose's Coefficient for every player from saved aggregates. */
  syncJosesCoefficients: () => void;
  setPendingCompare: (launch: CompareLaunch | null) => void;
  peekPendingCompare: () => CompareLaunch | null;
  clearPendingCompare: () => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

function withEnsuredTileSets(data: OlympusExportData): OlympusExportData {
  const patchRows = (
    rows: Record<string, unknown>[] | undefined
  ): Record<string, unknown>[] | undefined =>
    rows?.map((row) => ({
      ...row,
      tile_set: normalizeImportedTileSet(row.tile_set),
    }));

  return {
    ...data,
    player_stats: data.player_stats.map((row) => ({
      ...row,
      tile_set: normalizeImportedTileSet(row.tile_set),
    })),
    player_h2h: data.player_h2h.map((row) => ({
      ...row,
      tile_set: normalizeImportedTileSet(row.tile_set),
    })),
    matches: data.matches.map((row) => ({
      ...row,
      tile_set: normalizeImportedTileSet(row.tile_set),
    })),
    tables: {
      ...data.tables,
      matches: patchRows(data.tables.matches),
      player_stats: patchRows(data.tables.player_stats),
      player_h2h: patchRows(data.tables.player_h2h),
    },
  };
}

/** Load + backfill public_id / db_meta / empty stats for legacy blobs. */
function hydrateDatasetData(
  id: string,
  data: OlympusExportData | null,
  label?: string
): OlympusExportData | null {
  if (!data) return null;
  const withPlayers = withEnsuredPlayerPublicIds(data);
  const withMatches = withEnsuredMatchPublicIds(withPlayers);
  const withTiles = withEnsuredTileSets(withMatches);
  const withStats = withStatsFilledFromMatches(withTiles);
  const ensured = withEnsuredDbMeta(withStats, {
    origin: "web",
    label: label ?? withStats.db_meta?.label,
  });
  if (ensured !== data) {
    saveDatasetData(id, ensured);
  }
  return ensured;
}

function prepareImportedData(
  parsed: OlympusExportData,
  label?: string
): OlympusExportData {
  const withPlayers = withEnsuredPlayerPublicIds(parsed);
  const withMatches = withEnsuredMatchPublicIds(withPlayers);
  const withTiles = withEnsuredTileSets(withMatches);
  const withStats = withStatsFilledFromMatches(withTiles);
  const withMeta = withEnsuredDbMeta(withStats, {
    origin: "imported",
    label: label || withStats.db_meta?.label || "",
  });
  // Import is a meaningful write — refresh updated_at / app versions.
  return recalculateAllJosesCoefficients(
    withTouchedDbMeta(withMeta, {
      label: label || withMeta.db_meta?.label || "",
    })
  );
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<DatasetRegistry>({
    activeDatasetId: DEFAULT_DATASET_ID,
    datasets: [],
  });
  const [data, setData] = useState<OlympusExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const next = loadDatasetRegistry();
    setRegistry(next);
    const active = next.datasets.find((d) => d.id === next.activeDatasetId);
    setData(
      hydrateDatasetData(
        next.activeDatasetId,
        loadDatasetData(next.activeDatasetId),
        active?.displayName
      )
    );
    setLoading(false);
  }, []);

  const setPendingCompare = useCallback((launch: CompareLaunch | null) => {
    stashCompareLaunch(launch);
  }, []);

  const peekPendingCompare = useCallback(() => peekCompareLaunch(), []);

  const clearPendingCompare = useCallback(() => {
    clearCompareLaunch();
  }, []);

  const persistRegistry = useCallback((next: DatasetRegistry) => {
    setRegistry(next);
    saveDatasetRegistry(next);
  }, []);

  const applyParsedToActive = useCallback(
    (parsed: OlympusExportData, current: DatasetRegistry) => {
      const active = current.datasets.find(
        (d) => d.id === current.activeDatasetId
      );
      const prepared = prepareImportedData(parsed, active?.displayName);
      const touched = touchDatasetInRegistry(
        current,
        current.activeDatasetId,
        prepared.fileName
      );
      saveDatasetData(current.activeDatasetId, prepared);
      persistRegistry(touched);
      setData(prepared);
      setError(null);
    },
    [persistRegistry]
  );

  const importText = useCallback(
    (contents: string, fileName: string) => {
      try {
        const parsed = parseOlympusExport(contents, fileName);
        applyParsedToActive(parsed, registry);
      } catch (err) {
        const code = err instanceof Error ? err.message : "parse_failed";
        setError(code);
        throw err;
      }
    },
    [applyParsedToActive, registry]
  );

  const importFile = useCallback(
    async (file: File) => {
      const contents = await file.text();
      importText(contents, file.name);
    },
    [importText]
  );

  const importAsNew = useCallback(
    async (file: File, displayName?: string) => {
      const contents = await file.text();
      const name =
        displayName?.trim() ||
        suggestedDatasetNameFromFile(file.name) ||
        "Imported";
      const prepared = prepareImportedData(
        parseOlympusExport(contents, file.name),
        name
      );
      const { registry: next, dataset } = registerNewDatasetInRegistry(
        registry,
        name,
        file.name
      );
      saveDatasetData(dataset.id, prepared);
      persistRegistry(next);
      setData(prepared);
      setError(null);
    },
    [persistRegistry, registry]
  );

  const createMergedDataset = useCallback(
    (
      displayName: string,
      datasetIds: string[],
      resolutions: MergeResolutions,
      options?: { excludeMatchKeys?: Iterable<string> }
    ): DatasetMeta => {
      const name = displayName.trim();
      if (!name) throw new Error("empty_name");
      if (datasetIds.length < 2) throw new Error("merge_need_two");

      const sources: MergeSource[] = [];
      for (const id of datasetIds) {
        const meta = registry.datasets.find((d) => d.id === id);
        const raw = loadDatasetData(id);
        if (!meta || !raw) throw new Error("merge_missing_source");
        const hydrated =
          hydrateDatasetData(id, raw, meta.displayName) ?? raw;
        sources.push({
          datasetId: id,
          displayName: meta.displayName,
          data: hydrated,
        });
      }

      const plan = analyzeMerge(sources);
      const merged = materializeMergedExport(sources, plan, resolutions, {
        displayName: name,
        fileName: `merged-${name}.csv`,
        excludeMatchKeys: options?.excludeMatchKeys,
      });

      const { registry: next, dataset } = registerNewDatasetInRegistry(
        registry,
        name,
        merged.fileName
      );
      saveDatasetData(dataset.id, merged);
      persistRegistry(next);
      setData(merged);
      setError(null);
      return dataset;
    },
    [persistRegistry, registry]
  );

  const switchDataset = useCallback(
    (id: string) => {
      const next = setActiveDatasetInRegistry(registry, id);
      const meta = next.datasets.find((d) => d.id === id);
      persistRegistry(next);
      setData(
        hydrateDatasetData(id, loadDatasetData(id), meta?.displayName)
      );
      setError(null);
    },
    [persistRegistry, registry]
  );

  const renameDataset = useCallback(
    (id: string, displayName: string) => {
      const next = renameDatasetInRegistry(registry, id, displayName);
      persistRegistry(next);
      // Active dataset rename is a meaningful write — sync db_meta.label.
      if (id === registry.activeDatasetId && data) {
        const labeled = withDbMetaLabel(data, displayName.trim());
        saveDatasetData(id, labeled);
        setData(labeled);
      } else if (id !== registry.activeDatasetId) {
        const stored = loadDatasetData(id);
        if (stored) {
          saveDatasetData(id, withDbMetaLabel(stored, displayName.trim()));
        }
      }
      setError(null);
    },
    [data, persistRegistry, registry]
  );

  const deleteDataset = useCallback(
    (id: string) => {
      const wasLast = registry.datasets.length <= 1;
      const next = removeDatasetFromRegistryLocal(registry, id);
      saveDatasetData(id, null);
      // Fresh empty Local slot after deleting the only set — no leftover payload.
      if (wasLast) {
        saveDatasetData(next.activeDatasetId, null);
      }
      persistRegistry(next);
      const active = next.datasets.find((d) => d.id === next.activeDatasetId);
      setData(
        wasLast
          ? null
          : hydrateDatasetData(
              next.activeDatasetId,
              loadDatasetData(next.activeDatasetId),
              active?.displayName
            )
      );
      setError(null);
    },
    [persistRegistry, registry]
  );

  const persistActiveData = useCallback(
    (next: OlympusExportData) => {
      const touchedMeta = withTouchedDbMeta(next, {
        label: next.db_meta?.label,
      });
      const touched = touchDatasetInRegistry(
        registry,
        registry.activeDatasetId,
        touchedMeta.fileName
      );
      saveDatasetData(registry.activeDatasetId, touchedMeta);
      persistRegistry(touched);
      setData(touchedMeta);
      setError(null);
    },
    [persistRegistry, registry]
  );

  const setMyselfPlayer = useCallback(
    (playerId: number) => {
      if (!data) throw new Error("no_data");
      persistActiveData({
        ...data,
        players: data.players.map((player) => ({
          ...player,
          is_myself: player.id === playerId ? 1 : 0,
        })),
      });
    },
    [data, persistActiveData]
  );

  const clearMyselfPlayer = useCallback(() => {
    if (!data) throw new Error("no_data");
    persistActiveData({
      ...data,
      players: data.players.map((player) => ({
        ...player,
        is_myself: 0,
      })),
    });
  }, [data, persistActiveData]);

  const syncJosesCoefficients = useCallback(() => {
    if (!data) {
      throw new Error("no_data");
    }
    persistActiveData(recalculateAllJosesCoefficients(data));
  }, [data, persistActiveData]);

  const activeDataset =
    registry.datasets.find((d) => d.id === registry.activeDatasetId) ?? null;

  const value = useMemo(
    () => ({
      data,
      registry,
      activeDataset,
      error,
      loading,
      importFile,
      importText,
      importAsNew,
      createMergedDataset,
      switchDataset,
      renameDataset,
      deleteDataset,
      setMyselfPlayer,
      clearMyselfPlayer,
      syncJosesCoefficients,
      setPendingCompare,
      peekPendingCompare,
      clearPendingCompare,
    }),
    [
      data,
      registry,
      activeDataset,
      error,
      loading,
      importFile,
      importText,
      importAsNew,
      createMergedDataset,
      switchDataset,
      renameDataset,
      deleteDataset,
      setMyselfPlayer,
      clearMyselfPlayer,
      syncJosesCoefficients,
      setPendingCompare,
      peekPendingCompare,
      clearPendingCompare,
    ]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return ctx;
}
