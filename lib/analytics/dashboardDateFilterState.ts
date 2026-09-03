"use client";

import { useEffect, useMemo, useState } from "react";
import {
  emptyDateRange,
  parseYmd,
  type DateRange,
} from "./dateRangeFilter";

export const DASHBOARD_DATE_FILTER_KEY = "olympus-web-dashboard-dates-v1";

export type DashboardDateFilter = DateRange & {
  datasetId: string;
};

/** In-memory cache so Stats / Compare / History share the range in this tab. */
let memory: DashboardDateFilter | null = null;

export function defaultDashboardDateFilter(
  datasetId: string
): DashboardDateFilter {
  return { datasetId, ...emptyDateRange() };
}

function sanitizeRange(raw: Partial<DateRange> | null | undefined): DateRange {
  return {
    startDate: parseYmd(raw?.startDate),
    endDate: parseYmd(raw?.endDate),
  };
}

function readStored(datasetId: string): DashboardDateFilter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_DATE_FILTER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DashboardDateFilter>;
    if (parsed.datasetId !== datasetId) return null;
    return { datasetId, ...sanitizeRange(parsed) };
  } catch {
    return null;
  }
}

export function loadDashboardDateFilter(
  datasetId: string
): DashboardDateFilter {
  const fromMemory =
    memory && memory.datasetId === datasetId ? memory : null;
  if (fromMemory) return { ...fromMemory, ...sanitizeRange(fromMemory) };

  const stored = readStored(datasetId);
  if (!stored) return defaultDashboardDateFilter(datasetId);
  memory = stored;
  return stored;
}

export function saveDashboardDateFilter(next: DashboardDateFilter) {
  const sanitized: DashboardDateFilter = {
    datasetId: next.datasetId,
    ...sanitizeRange(next),
  };
  memory = sanitized;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DASHBOARD_DATE_FILTER_KEY,
      JSON.stringify(sanitized)
    );
  } catch {
    // Quota / private mode.
  }
}

export function useDashboardDateRange(datasetId: string) {
  const [startDate, setStartDate] = useState<string | null>(
    () => loadDashboardDateFilter(datasetId).startDate
  );
  const [endDate, setEndDate] = useState<string | null>(
    () => loadDashboardDateFilter(datasetId).endDate
  );
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadDashboardDateFilter(datasetId);
    setStartDate(loaded.startDate);
    setEndDate(loaded.endDate);
    setHydratedFor(datasetId);
  }, [datasetId]);

  useEffect(() => {
    if (hydratedFor !== datasetId) return;
    saveDashboardDateFilter({ datasetId, startDate, endDate });
  }, [datasetId, startDate, endDate, hydratedFor]);

  const range = useMemo<DateRange>(
    () => ({ startDate, endDate }),
    [startDate, endDate]
  );

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    range,
    clear: () => {
      setStartDate(null);
      setEndDate(null);
    },
  };
}
