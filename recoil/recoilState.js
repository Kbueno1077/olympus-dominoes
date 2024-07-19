import { atom, selector } from "recoil";
import { recoilPersist } from "recoil-persist";
import { gameModes4 } from "../utils/matchSettings";

const { persistAtom } = recoilPersist();

const emptyGame = {
    t1Datas: [],
    t1TotalPoints: 0,
    t2Datas: [],
    t2TotalPoints: 0,
    t3Datas: [],
    t3TotalPoints: 0,
    t4Datas: [],
    t4TotalPoints: 0,
    winner: "none",
};

export const textState = atom({
    key: "textState", // unique ID (with respect to other atoms/selectors)
    default: 12, // default value (aka initial value)
    effects_UNSTABLE: [persistAtom],
});

export const charCountState = selector({
    key: "charCountState",
    get: ({ get }) => {
        const text = get(textState);
        return text.length;
    },
});

//Game Settings
export const playersAmountRecoil = atom({
    key: "playersAmount",
    default: 4,
    effects_UNSTABLE: [persistAtom],
});
export const renderGameModesRecoil = atom({
    key: "renderGameModes",
    default: gameModes4,
    effects_UNSTABLE: [persistAtom],
});
export const gameModeRecoil = atom({
    key: "gameMode",
    default: { label: "2 vs 2" },
    effects_UNSTABLE: [persistAtom],
});
export const maxPointsRecoil = atom({
    key: "maxPoints",
    default: 150,
    effects_UNSTABLE: [persistAtom],
});

//Players
export const player1Recoil = atom({
    key: "player1",
    default: "",
    effects_UNSTABLE: [persistAtom],
});
export const player2Recoil = atom({
    key: "player2",
    default: "",
    effects_UNSTABLE: [persistAtom],
});
export const player3Recoil = atom({
    key: "player3",
    default: "",
    effects_UNSTABLE: [persistAtom],
});
export const player4Recoil = atom({
    key: "player4",
    default: "",
    effects_UNSTABLE: [persistAtom],
});

//Games Values
export const isGameStartedRecoil = atom({
    key: "isGameStarted",
    default: false,
    effects_UNSTABLE: [persistAtom],
});
export const whoWonRecoil = atom({
    key: "whoWon",
    default: "",
    effects_UNSTABLE: [persistAtom],
});
export const completedGamesRecoil = atom({
    key: "completedGames",
    default: [],
    effects_UNSTABLE: [persistAtom],
});
export const currentGameRecoil = atom({
    key: "currentGame",
    default: emptyGame,
    effects_UNSTABLE: [persistAtom],
});
export const matchDescriptionRecoil = atom({
    key: "matchDescription",
    default: "",
    effects_UNSTABLE: [persistAtom],
});

export const gameEditionModeRecoil = atom({
    key: "gameEditionMode",
    default: false,
    effects_UNSTABLE: [persistAtom],
});
