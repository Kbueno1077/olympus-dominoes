"use client";

import {
  MATCH_STORE_KEY,
  RECOIL_PERSIST_KEY,
  defaultMatchState,
  matchStateFromRecoilPersist,
  type GameModeOption,
  type GamePad,
  type PersistedMatchState,
} from "@/lib/matchStoreState";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MatchStore = PersistedMatchState & {
  playTableActive: boolean;
  statsDataDrawerOpen: boolean;
  setPlayersAmount: (playersAmount: number) => void;
  setRenderGamesModes: (renderGameModes: GameModeOption[]) => void;
  setGameMode: (gameMode: GameModeOption) => void;
  setDominoSet: (dominoSet: string) => void;
  setMaxPoints: (maxPoints: number | string) => void;
  setPlayer1: (player1: string) => void;
  setPlayer2: (player2: string) => void;
  setPlayer3: (player3: string) => void;
  setPlayer4: (player4: string) => void;
  setStartGame: (isGameStarted: boolean) => void;
  setWhoWon: (whoWon: string) => void;
  setCompletedGame: (completedGames: GamePad[]) => void;
  setCurrentGame: (currentGame: GamePad) => void;
  setMatchDescription: (matchDescription: string) => void;
  setGameEditionMode: (gameEditionMode: boolean) => void;
  setPlayTableActive: (playTableActive: boolean) => void;
  setStatsDataDrawerOpen: (statsDataDrawerOpen: boolean) => void;
  resetMatch: () => void;
};

function readRecoilPersistRaw(): string | null {
  try {
    const raw = localStorage.getItem(RECOIL_PERSIST_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // Zustand persist writes `{ state, version }`. Recoil wrote a flat object.
    if (
      parsed != null &&
      typeof parsed === "object" &&
      "state" in parsed &&
      "version" in parsed
    ) {
      return null;
    }
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const state = {
      ...defaultMatchState,
      ...matchStateFromRecoilPersist(parsed as Record<string, unknown>),
    };
    return JSON.stringify({ state, version: 0 });
  } catch {
    return null;
  }
}

export const useMatchStore = create<MatchStore>()(
  persist(
    (set) => ({
      ...defaultMatchState,
      playTableActive: false,
      statsDataDrawerOpen: false,
      setPlayersAmount: (playersAmount) => set({ playersAmount }),
      setRenderGamesModes: (renderGameModes) => set({ renderGameModes }),
      setGameMode: (gameMode) => set({ gameMode }),
      setDominoSet: (dominoSet) => set({ dominoSet }),
      setMaxPoints: (maxPoints) => set({ maxPoints }),
      setPlayer1: (player1) => set({ player1 }),
      setPlayer2: (player2) => set({ player2 }),
      setPlayer3: (player3) => set({ player3 }),
      setPlayer4: (player4) => set({ player4 }),
      setStartGame: (isGameStarted) => set({ isGameStarted }),
      setWhoWon: (whoWon) => set({ whoWon }),
      setCompletedGame: (completedGames) => set({ completedGames }),
      setCurrentGame: (currentGame) => set({ currentGame }),
      setMatchDescription: (matchDescription) => set({ matchDescription }),
      setGameEditionMode: (gameEditionMode) => set({ gameEditionMode }),
      setPlayTableActive: (playTableActive) => set({ playTableActive }),
      setStatsDataDrawerOpen: (statsDataDrawerOpen) =>
        set({ statsDataDrawerOpen }),
      resetMatch: () => set({ ...defaultMatchState }),
    }),
    {
      name: MATCH_STORE_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            const existing = localStorage.getItem(name);
            if (existing) {
              localStorage.removeItem(RECOIL_PERSIST_KEY);
              return existing;
            }
            const migrated = readRecoilPersistRaw();
            if (migrated) {
              localStorage.setItem(name, migrated);
              localStorage.removeItem(RECOIL_PERSIST_KEY);
              return migrated;
            }
            return null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, value);
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      })),
      partialize: (state) => ({
        playersAmount: state.playersAmount,
        renderGameModes: state.renderGameModes,
        gameMode: state.gameMode,
        dominoSet: state.dominoSet,
        maxPoints: state.maxPoints,
        player1: state.player1,
        player2: state.player2,
        player3: state.player3,
        player4: state.player4,
        isGameStarted: state.isGameStarted,
        whoWon: state.whoWon,
        completedGames: state.completedGames,
        currentGame: state.currentGame,
        matchDescription: state.matchDescription,
        gameEditionMode: state.gameEditionMode,
      }),
    }
  )
);
