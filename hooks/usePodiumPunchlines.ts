"use client";

import {
  parsePunchlineMap,
  podiumPunchlineKey,
  resolveAllPunchlineSlots,
  type PodiumPunchlineMap,
} from "@/lib/analytics/podiumPunchlines";
import type { PodiumCategoryId } from "@/lib/analytics/podium";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "olympus.podium.punchlines.v1";

function readStored(): PodiumPunchlineMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return parsePunchlineMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeStored(map: PodiumPunchlineMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}

/** Sticky System AI punchlines: pick on first open, hold 24h, then may rotate. */
export function usePodiumPunchlines(): {
  ready: boolean;
  punchlineKey: (id: PodiumCategoryId) => string;
} {
  const [map, setMap] = useState<PodiumPunchlineMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    const { map: next, changed } = resolveAllPunchlineSlots(
      stored,
      Date.now()
    );
    setMap(next);
    setReady(true);
    if (changed) writeStored(next);
  }, []);

  const punchlineKey = useCallback(
    (id: PodiumCategoryId) => {
      const index = map[id]?.index ?? 0;
      return podiumPunchlineKey(id, index);
    },
    [map]
  );

  return { ready, punchlineKey };
}
