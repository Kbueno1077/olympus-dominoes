"use client";

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
import ConfirmDeleteGame from "../../components2/Dialogs/ConfirmDialog/ConfirmDeleteGame";
import OptionalDescription from "../../components2/OptionalDescription/OptionalDescription";
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
} from "../../recoil/recoilState";
import MatchSettings from "../../sections/MatchSettings/MatchSettings";
import NoteMaker from "../../sections/NoteMaker/NoteMaker";
import NotesDone from "../../sections/NotesDone/NotesDone";
import TableDraw from "../../sections/TableDraw/TableDraw";
import { gameModes2, gameModes3, gameModes4 } from "../../utils/matchSettings";
import useToast from "/hooks/useToast";

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

        if (teamNumber === 1) {
            if (currentGame.t1TotalPoints + score >= maxPoints) {
                handleWhoWon("Team 1");
            }

            setCurrentGame((prev) => {
                return {
                    ...prev,
                    t1Datas: [...prev.t1Datas, score],
                    t1TotalPoints: prev.t1TotalPoints + score,
                };
            });
        }

        if (teamNumber === 2) {
            if (currentGame.t2TotalPoints + score >= maxPoints) {
                handleWhoWon("Team 2");
            }

            setCurrentGame((prev) => {
                return {
                    ...prev,
                    t2Datas: [...prev.t2Datas, score],
                    t2TotalPoints: prev.t2TotalPoints + score,
                };
            });
        }

        if (teamNumber === 3) {
            if (currentGame.t3TotalPoints + score >= maxPoints) {
                handleWhoWon("Team 3");
            }
            setCurrentGame((prev) => {
                return {
                    ...prev,
                    t3Datas: [...prev.t3Datas, score],
                    t3TotalPoints: prev.t3TotalPoints + score,
                };
            });
        }

        if (teamNumber === 4) {
            if (currentGame.t4TotalPoints + score >= maxPoints) {
                handleWhoWon("Team 4");
            }

            setCurrentGame((prev) => {
                return {
                    ...prev,
                    t4Datas: [...prev.t4Datas, score],
                    t4TotalPoints: prev.t4TotalPoints + score,
                };
            });
        }
    };

    const removeGame = (index) => {
        const removedGame = completedGames.filter((_, i) => i !== index);
        setCompletedGame(removedGame);
    };

    const handleSliderChange = (event) => {
        const newSlideValue = event.target.value;

        if (newSlideValue === 2) {
            setRenderGamesModes(gameModes2);
            setGameMode(gameModes2[0]);
        } else if (newSlideValue === 3) {
            setRenderGamesModes(gameModes3);
            setGameMode(gameModes3[0]);
        } else if (newSlideValue === 4) {
            setRenderGamesModes(gameModes4);
            setGameMode(gameModes4[1]);
        }

        setPlayersAmount(newSlideValue === "" ? "" : newSlideValue);
    };

    const handlePlayers = (playerNumber, newPlayer) => {
        if (playerNumber === "1") setPlayer1(newPlayer);
        if (playerNumber === "2") setPlayer2(newPlayer);
        if (playerNumber === "3") setPlayer3(newPlayer);
        if (playerNumber === "4") setPlayer4(newPlayer);
    };

    const handleMaxPoints = (newMax) => {
        setMaxPoints(newMax);
    };

    const handleModeChange = (newMode) => {
        setGameMode(newMode);
    };

    const finishMatch = () => {
        if (!completedGames.length) {
            displayToast(`Empty match not allowed`, "error");
            return;
        }

        const settings = {
            matchDate: value,
            gameMode,
            maxPoints,
            playersAmount,
            playerslayout,
            matchDescription,
        };

        console.log(settings);
        console.log(teamsLayout);
        console.log(completedGames);
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
                            style={{
                                width: "100%",
                                maxWidth: "520px",
                            }}
                        >
                            {isGameStarted && (
                                <Typography
                                    sx={{
                                        fontWeight: "bold",
                                        fontSize: "30px",
                                        color: "#20B66A",
                                    }}
                                >
                                    Hello, Welcome to Olympus!
                                </Typography>
                            )}

                            {/**NOTES ALREADY DONE */}
                            <NotesDone
                                completedGames={completedGames}
                                removeGame={removeGame}
                                playersAmount={playersAmount}
                                gameMode={gameMode}
                                isEditable
                            />

                            {/**CURRENT GAME */}
                            <NoteMaker
                                isGameStarted={isGameStarted}
                                gameMode={gameMode}
                                playersAmount={playersAmount}
                                completedGames={completedGames}
                                handleWhoWon={handleWhoWon}
                                whoWon={whoWon}
                                maxPoints={maxPoints}
                                currentGame={currentGame}
                                handleUpateScores={handleUpateScores}
                                handleNextGame={handleNextGame}
                            />

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
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: "30px",
                                    color: "#20B66A",
                                }}
                            >
                                Hello, Welcome to Olympus!
                            </Typography>
                        )}

                        {!matchesUpXLBreakpoint && (
                            <Typography
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: "30px",
                                    color: "#20B66A",
                                    marginBottom: "15px",
                                }}
                            >
                                Settings
                            </Typography>
                        )}

                        {/**GAME SETTINGS */}
                        <MatchSettings
                            isGameStarted={isGameStarted}
                            gameMode={gameMode}
                            handlePlayers={handlePlayers}
                            playersAmount={playersAmount}
                            handleSliderChange={handleSliderChange}
                            maxPoints={maxPoints}
                            renderGameModes={renderGameModes}
                            handleMaxPoints={handleMaxPoints}
                            handleModeChange={handleModeChange}
                            player1={player1}
                            player2={player2}
                            player3={player3}
                            player4={player4}
                        />

                        {/*LOCK GAME*/}
                        {!isGameStarted && (
                            <Card
                                elevation={10}
                                sx={{
                                    maxWidth: "950px",
                                    width: "100%",
                                    padding: "15px",
                                    marginTop: "15px",
                                }}
                            >
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
                                elevation={10}
                                sx={{
                                    maxWidth: "950px",
                                    width: "100%",
                                    padding: "15px",
                                    marginTop: "15px",
                                }}
                            >
                                <Box display="flex" justifyContent="flex-end">
                                    <ConfirmDeleteGame
                                        onCofirm={handleCancelGame}
                                    />
                                </Box>
                            </Card>
                        )}

                        {/**TABLE SETUP */}
                        <TableDraw
                            matchesDownBreakpoint={matchesDownBreakpoint}
                            gameMode={gameMode}
                            playersAmount={playersAmount}
                        />

                        <Box mt={3}>
                            <Button
                                onClick={finishMatch}
                                sx={{ height: "60px", fontSize: "18px" }}
                                fullWidth
                                variant="contained"
                                disabled={true}
                            >
                                Finish Match (Coming Soon)
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
}
