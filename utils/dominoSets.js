/**
 * Domino set / tile format for live match annotation.
 *
 * Scoring is unchanged either way — the user still enters hand points and
 * picks the target. The set only describes the physical tiles and the usual
 * default target for that format.
 */

export const DOMINO_SET_DOUBLE_NINE = "double_nine";
export const DOMINO_SET_DOUBLE_SIX = "double_six";

export const DOMINO_SETS = [
  {
    id: DOMINO_SET_DOUBLE_NINE,
    // Stored English id — UI translates via i18n keys.
    tilesInSet: 55,
    maxPip: 9,
    tilesPerHand: 10,
    defaultMaxPoints: 150,
  },
  {
    id: DOMINO_SET_DOUBLE_SIX,
    tilesInSet: 28,
    maxPip: 6,
    tilesPerHand: 7,
    defaultMaxPoints: 100,
  },
];

export const DEFAULT_DOMINO_SET_ID = DOMINO_SET_DOUBLE_NINE;

export function getDominoSet(id) {
  return (
    DOMINO_SETS.find((set) => set.id === id) ??
    DOMINO_SETS.find((set) => set.id === DEFAULT_DOMINO_SET_ID)
  );
}
