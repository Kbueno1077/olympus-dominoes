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
import { withEnsuredPlayerPublicIds } from "./playerIdentity";
import { recalculateAllJosesCoefficients } from "./joseCoefficient";
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

/** Load + backfill public_id for legacy blobs missing the field. */
function hydrateDatasetData(
  id: string,
  data: OlympusExportData | null
): OlympusExportData | null {
  if (!data) return null;
  const ensured = withEnsuredPlayerPublicIds(data);
  if (ensured !== data) {
    saveDatasetData(id, ensured);
  }
  return ensured;
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
    setData(hydrateDatasetData(next.activeDatasetId, loadDatasetData(next.activeDatasetId)));
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
      // Exports often omit joses_coefficient — persist the current formula.
      // public_id is resolved during parse; ensure again for legacy safety.
      const withIds = withEnsuredPlayerPublicIds(parsed);
      const withJose = recalculateAllJosesCoefficients(withIds);
      const touched = touchDatasetInRegistry(
        current,
        current.activeDatasetId,
        withJose.fileName
      );
      saveDatasetData(current.activeDatasetId, withJose);
      persistRegistry(touched);
      setData(withJose);
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
      const parsed = recalculateAllJosesCoefficients(
        withEnsuredPlayerPublicIds(parseOlympusExport(contents, file.name))
      );
      const name =
        displayName?.trim() ||
        suggestedDatasetNameFromFile(file.name) ||
        "Imported";
      const { registry: next, dataset } = registerNewDatasetInRegistry(
        registry,
        name,
        file.name
      );
      saveDatasetData(dataset.id, parsed);
      persistRegistry(next);
      setData(parsed);
      setError(null);
    },
    [persistRegistry, registry]
  );

  const switchDataset = useCallback(
    (id: string) => {
      const next = setActiveDatasetInRegistry(registry, id);
      persistRegistry(next);
      setData(hydrateDatasetData(id, loadDatasetData(id)));
      setError(null);
    },
    [persistRegistry, registry]
  );

  const renameDataset = useCallback(
    (id: string, displayName: string) => {
      const next = renameDatasetInRegistry(registry, id, displayName);
      persistRegistry(next);
    },
    [persistRegistry, registry]
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
      setData(
        wasLast
          ? null
          : hydrateDatasetData(
              next.activeDatasetId,
              loadDatasetData(next.activeDatasetId)
            )
      );
      setError(null);
    },
    [persistRegistry, registry]
  );

  const persistActiveData = useCallback(
    (next: OlympusExportData) => {
      const touched = touchDatasetInRegistry(
        registry,
        registry.activeDatasetId,
        next.fileName
      );
      saveDatasetData(registry.activeDatasetId, next);
      persistRegistry(touched);
      setData(next);
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
