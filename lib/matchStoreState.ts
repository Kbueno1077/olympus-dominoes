import { DEFAULT_DOMINO_SET_ID, getDominoSet } from "@/utils/dominoSets";
import { emptyGame, gameModes4 } from "@/utils/matchSettings";

export const RECOIL_PERSIST_KEY = "recoil-persist";
export const MATCH_STORE_KEY = "olympus-match";

export type GameModeOption = { label: string };
export type GamePad = typeof emptyGame;

export type PersistedMatchState = {
  playersAmount: number;
  renderGameModes: GameModeOption[];
  gameMode: GameModeOption;
  dominoSet: string;
  maxPoints: number | string;
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  isGameStarted: boolean;
  whoWon: string;
  completedGames: GamePad[];
  currentGame: GamePad;
  matchDescription: string;
  gameEditionMode: boolean;
};

const DEFAULT_SET = getDominoSet(DEFAULT_DOMINO_SET_ID);

export const defaultMatchState: PersistedMatchState = {
  playersAmount: 4,
  renderGameModes: gameModes4,
  gameMode: { label: "2 vs 2" },
  dominoSet: DEFAULT_DOMINO_SET_ID,
  maxPoints: DEFAULT_SET?.defaultMaxPoints ?? 150,
  player1: "",
  player2: "",
  player3: "",
  player4: "",
  isGameStarted: false,
  whoWon: "",
  completedGames: [],
  currentGame: emptyGame,
  matchDescription: "",
  gameEditionMode: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/** Map a recoil-persist snapshot onto the zustand match slice. */
export function matchStateFromRecoilPersist(
  snapshot: Record<string, unknown>
): Partial<PersistedMatchState> {
  const next: Partial<PersistedMatchState> = {};
  if (typeof snapshot.playersAmount === "number") {
    next.playersAmount = snapshot.playersAmount;
  }
  if (Array.isArray(snapshot.renderGameModes)) {
    next.renderGameModes = snapshot.renderGameModes as GameModeOption[];
  }
  if (isRecord(snapshot.gameMode) && typeof snapshot.gameMode.label === "string") {
    next.gameMode = { label: snapshot.gameMode.label };
  }
  if (typeof snapshot.dominoSet === "string") {
    next.dominoSet = snapshot.dominoSet;
  }
  if (
    typeof snapshot.maxPoints === "number" ||
    typeof snapshot.maxPoints === "string"
  ) {
    next.maxPoints = snapshot.maxPoints;
  }
  if (typeof snapshot.player1 === "string") next.player1 = snapshot.player1;
  if (typeof snapshot.player2 === "string") next.player2 = snapshot.player2;
  if (typeof snapshot.player3 === "string") next.player3 = snapshot.player3;
  if (typeof snapshot.player4 === "string") next.player4 = snapshot.player4;
  if (typeof snapshot.isGameStarted === "boolean") {
    next.isGameStarted = snapshot.isGameStarted;
  }
  if (typeof snapshot.whoWon === "string") next.whoWon = snapshot.whoWon;
  if (Array.isArray(snapshot.completedGames)) {
    next.completedGames = snapshot.completedGames as GamePad[];
  }
  if (isRecord(snapshot.currentGame)) {
    next.currentGame = snapshot.currentGame as GamePad;
  }
  if (typeof snapshot.matchDescription === "string") {
    next.matchDescription = snapshot.matchDescription;
  }
  if (typeof snapshot.gameEditionMode === "boolean") {
    next.gameEditionMode = snapshot.gameEditionMode;
  }
  return next;
}
