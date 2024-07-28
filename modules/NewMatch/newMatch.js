"use client";

import ConfirmDeleteGame from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteGame";
import OptionalDescription from "@/components/OptionalDescription/OptionalDescription";
import {
    completedGamesRecoil,
    currentGameRecoil,
    gameModeRecoil,
    isGameStartedRecoil,
    matchDescriptionRecoil,
    maxPointsRecoil,
    player1Recoil,
    player2Recoil,
    player3Recoil,
    player4Recoil,
    playersAmountRecoil,
    renderGameModesRecoil,
    whoWonRecoil,
} from "@/recoil/recoilState";
import FinishMatch from "@/sections/FinishMatch/FinishMatch";
import MatchSettings from "@/sections/MatchSettings/MatchSettings";
import NoteMaker from "@/sections/NoteMaker/NoteMaker";
import NotesDone from "@/sections/NotesDone/NotesDone";
import TableDraw from "@/sections/TableDraw/TableDraw";
import { gameModes4 } from "@/utils/matchSettings";
import {
    Box,
    Button,
    Card,
    Stack,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRecoilState } from "recoil";
import useToast from "/hooks/useToast";
import ConfirmDeleteMatch from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteMatch";

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

export default function NewMatch() {
    //CSS Settings
    const theme = useTheme();
    const displayToast = useToast();
    const matchesUpBreakpoint = useMediaQuery(theme.breakpoints.up("lg"));
    const matchesUpXLBreakpoint = useMediaQuery(theme.breakpoints.up("xl"));
    const matchesDownBreakpoint = useMediaQuery(theme.breakpoints.down("sm"));

    //Game Settings
    const [playersAmount, setPlayersAmount] =
        useRecoilState(playersAmountRecoil);
    const [renderGameModes, setRenderGamesModes] = useRecoilState(
        renderGameModesRecoil
    );
    const [gameMode, setGameMode] = useRecoilState(gameModeRecoil);
    const [maxPoints, setMaxPoints] = useRecoilState(maxPointsRecoil);

    //Players
    const [player1, setPlayer1] = useRecoilState(player1Recoil);
    const [player2, setPlayer2] = useRecoilState(player2Recoil);
    const [player3, setPlayer3] = useRecoilState(player3Recoil);
    const [player4, setPlayer4] = useRecoilState(player4Recoil);

    //Games Values
    const [isGameStarted, setStartGame] = useRecoilState(isGameStartedRecoil);
    const [whoWon, setWhoWon] = useRecoilState(whoWonRecoil);
    const [completedGames, setCompletedGame] =
        useRecoilState(completedGamesRecoil);
    const [currentGame, setCurrentGame] = useRecoilState(currentGameRecoil);
    const [matchDescription, setMatchDescription] = useRecoilState(
        matchDescriptionRecoil
    );

    // GAME HANDLERS
    const handleWhoWon = (winner) => {
        setWhoWon(winner);
    };

    const handleCancelGame = () => {
        setPlayersAmount(4);
        setRenderGamesModes(gameModes4);
        setGameMode({ label: "2 vs 2" });
        setMaxPoints(150);

        setPlayer1("");
        setPlayer2("");
        setPlayer3("");
        setPlayer4("");

        setStartGame(false);
        setWhoWon("");
        setCompletedGame([]);
        setCurrentGame(emptyGame);
        setMatchDescription("");
    };

    const handleStartGame = () => {
        const layout = [player1, player2, player3, player4].filter(
            (item) => item
        );

        if (layout.length < playersAmount) {
            displayToast(
                `Match set for ${playersAmount} players, ${
                    layout.length === 0 ? "none" : `only ${layout.length}`
                } ${layout.length === 1 ? "is" : `are`} present`,
                "error"
            );
            return;
        }

        setStartGame(true);
    };

    const handleNextGame = () => {
        const tempCurrentGame = { ...currentGame };

        if (whoWon === "") {
            displayToast(`Must be at least a winner`, "error");
            return;
        }

        const arrayOfPoints = [
            tempCurrentGame.t1TotalPoints,
            tempCurrentGame.t2TotalPoints,
            tempCurrentGame.t3TotalPoints,
            tempCurrentGame.t4TotalPoints,
        ];

        if (arrayOfPoints.filter((item) => item >= maxPoints).length > 1) {
            displayToast(
                `More than 1 Team has more or equal amount of points than the Max allowed \n
         or the input value has errors`,
                "error"
            );
            return;
        }

        const t1Datas = [...currentGame.t1Datas];
        const t2Datas = [...currentGame.t2Datas];
        const t3Datas = [...currentGame.t3Datas];
        const t4Datas = [...currentGame.t4Datas];

        const newCompletedGames = [...completedGames];

        tempCurrentGame.winner = whoWon;
        if (whoWon === "Team 1") {
            t1Datas.push(maxPoints - tempCurrentGame.t1TotalPoints);
        }
        if (whoWon === "Team 2") {
            t2Datas.push(maxPoints - tempCurrentGame.t2TotalPoints);
        }
        if (whoWon === "Team 3") {
            t3Datas.push(maxPoints - tempCurrentGame.t3TotalPoints);
        }
        if (whoWon === "Team 4") {
            t4Datas.push(maxPoints - tempCurrentGame.t4TotalPoints);
        }

        const convertedGame = {
            ...tempCurrentGame,
            t1Datas,
            t2Datas,
            t3Datas,
            t4Datas,
        };

        newCompletedGames.push(convertedGame);
        setCompletedGame(newCompletedGames);
        setCurrentGame(emptyGame);
        setWhoWon("");
    };

    const handleUpateScores = (scoreText, teamNumber) => {
        const score = Number(scoreText);
        const teamNumberTotalPoints = `t${teamNumber}TotalPoints`;
        const teamNumberHands = `t${teamNumber}Datas`;

        if (currentGame[teamNumberTotalPoints] + score >= maxPoints) {
            handleWhoWon(`Team ${teamNumber}`);
        }

        setCurrentGame((prev) => {
            return {
                ...prev,
                [teamNumberHands]: [...prev[teamNumberHands], score],
                [teamNumberTotalPoints]: prev[teamNumberTotalPoints] + score,
            };
        });
    };

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Box
                    display="flex"
                    flexWrap={!matchesUpXLBreakpoint ? "wrap" : ""}
                    justifyContent="center"
                    gap="30px"
                >
                    {isGameStarted && (
                        <Stack
                            gap="10px"
                            sx={{ maxWidth: "520px", width: "100%" }}
                        >
                            {isGameStarted && (
                                <Typography
                                    color={"primary"}
                                    sx={{
                                        fontWeight: "bold",
                                        fontSize: "30px",
                                    }}
                                >
                                    Hello, Welcome to Olympus!
                                </Typography>
                            )}

                            {/**NOTES ALREADY DONE */}
                            <NotesDone />

                            {/**CURRENT GAME */}
                            <NoteMaker
                                isGameStarted={isGameStarted}
                                gameMode={gameMode}
                                playersAmount={playersAmount}
                                completedGames={completedGames}
                                whoWon={whoWon}
                                maxPoints={maxPoints}
                                handleUpateScores={handleUpateScores}
                            />

                            {isGameStarted && (
                                <Card elevation={10} className="p-4">
                                    <Box
                                        display="flex"
                                        justifyContent="flex-end"
                                    >
                                        <Button onClick={handleNextGame}>
                                            Next Game
                                        </Button>
                                    </Box>
                                </Card>
                            )}

                            {/**DESCRIPTION */}
                            <OptionalDescription
                                setMatchDescription={setMatchDescription}
                                matchDescription={matchDescription}
                            />
                        </Stack>
                    )}

                    <Box sx={{ maxWidth: "520px", width: "100%" }}>
                        {!isGameStarted && !matchesUpXLBreakpoint && (
                            <Typography
                                color={"primary"}
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: "30px",
                                }}
                            >
                                Hello, Welcome to Olympus!
                            </Typography>
                        )}

                        {!matchesUpXLBreakpoint && (
                            <Typography
                                color={"primary"}
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: "30px",
                                    marginBottom: "16px",
                                }}
                            >
                                Settings
                            </Typography>
                        )}

                        {/**GAME SETTINGS */}
                        <MatchSettings />

                        {/*LOCK GAME*/}
                        {!isGameStarted && (
                            <Card className="w-full mt-4 p-4" elevation={10}>
                                {!isGameStarted && (
                                    <Box
                                        display="flex"
                                        justifyContent="flex-end"
                                    >
                                        <Button onClick={handleStartGame}>
                                            Start Game
                                        </Button>
                                    </Box>
                                )}
                            </Card>
                        )}

                        {isGameStarted && (
                            <Card
                                className="w-full max-w-[950px] mt-4 p-4"
                                elevation={10}
                            >
                                <Box display="flex" justifyContent="flex-end">
                                    <ConfirmDeleteMatch
                                        onCofirm={handleCancelGame}
                                    />
                                </Box>
                            </Card>
                        )}

                        {/**TABLE SETUP */}
                        <Box mt={2}>
                            <TableDraw />
                        </Box>

                        <Box mt={2}>
                            <FinishMatch />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
}
