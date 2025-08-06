import {
    Autocomplete,
    Box,
    Card,
    Slider,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import {
    gameModes2,
    gameModes3,
    gameModes4,
    gamePlayerCount,
} from "@/utils/matchSettings";
import { useRecoilState } from "recoil";
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

export default function MatchSettings() {
    const theme = useTheme();
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

    return (
        <>
            <Box mb={3}>
                <Card elevation={10} className="p-4 w-full max-w-[520px]">
                    <Typography variant="h6" sx={{ color: "#56616A" }}>
                        Match Mode
                    </Typography>

                    <Box mt={2.5} sx={{ padding: "0 25px 0" }}>
                        <Slider
                            aria-label="Custom marks"
                            disabled={isGameStarted}
                            defaultValue={4}
                            value={playersAmount}
                            onChange={handleSliderChange}
                            max={4}
                            min={2}
                            step={1}
                            valueLabelDisplay="auto"
                            marks={gamePlayerCount}
                        />
                    </Box>

                    <Autocomplete
                        id="country-select-demo"
                        sx={{ marginTop: "16px" }}
                        options={renderGameModes}
                        value={gameMode}
                        disabled={isGameStarted}
                        onChange={(event, newValue) => {
                            handleModeChange(newValue);
                        }}
                        autoHighlight
                        fullWidth
                        getOptionLabel={(option) => option.label}
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                                {...props}
                            >
                                {option.label}
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Choose Mode"
                                inputProps={{
                                    ...params.inputProps,
                                    autoComplete: "new-password", // disable autocomplete and autofill
                                }}
                            />
                        )}
                    />

                    <TextField
                        id="filled-number"
                        label="Max Points"
                        sx={{ marginTop: "16px" }}
                        fullWidth
                        disabled={isGameStarted}
                        value={maxPoints}
                        onChange={(e) => {
                            if (
                                Number(e.target.value > 0) &&
                                !e.target.value.includes(".")
                            )
                                handleMaxPoints(e.target.value);
                        }}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        inputProps={{ pattern: "[0-9]*" }}
                        variant="outlined"
                    />
                </Card>
            </Box>
            {/**CHOOSE MODE END*/}

            {/**CHOOSE PLAYER */}
            <Box
                display="flex"
                flexWrap={matchesDownBreakpoint ? "wrap " : ""}
                gap="16px"
                sx={{ width: "100%" }}
            >
                <Card
                    elevation={10}
                    sx={{
                        width: matchesDownBreakpoint ? "100%" : "initial",
                        padding: "16px",
                    }}
                >
                    <Typography variant="h6" sx={{ color: "#56616A" }}>
                        Team 1
                    </Typography>
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                    >
                        <TextField
                            id="Player1TextField"
                            label="Choose player 1"
                            sx={{ marginTop: "16px" }}
                            disabled={isGameStarted}
                            value={player1}
                            onChange={(event) => {
                                handlePlayers("1", event.target.value);
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            variant="outlined"
                        />

                        {gameMode?.label === "Free For All" && (
                            <Typography
                                variant="h6"
                                sx={{ marginTop: "16px", color: "#56616A" }}
                            >
                                Team 3
                            </Typography>
                        )}
                        {playersAmount > 2 && (
                            <TextField
                                id="Player2TextField"
                                label={`Choose player ${
                                    playersAmount === 3
                                        ? playersAmount
                                        : playersAmount - 1
                                }`}
                                sx={{
                                    width: "100%",
                                    minWidth: "220px",
                                    marginTop: "16px",
                                }}
                                disabled={isGameStarted}
                                value={player3}
                                onChange={(event) => {
                                    handlePlayers("3", event.target.value);
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Card>

                <Card
                    elevation={10}
                    sx={{
                        width: matchesDownBreakpoint ? "100%" : "initial",
                        padding: "16px",
                    }}
                >
                    <Typography variant="h6" sx={{ color: "#56616A" }}>
                        Team 2
                    </Typography>
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                    >
                        <TextField
                            id="Player3TextField"
                            label={`Choose player ${
                                playersAmount >= 3 ? "2" : playersAmount
                            }`}
                            sx={{
                                width: "100%",
                                minWidth: "220px",
                                marginTop: `${
                                    playersAmount === 3 ? "50px" : "16px"
                                } `,
                            }}
                            disabled={isGameStarted}
                            value={player2}
                            onChange={(event) => {
                                handlePlayers("2", event.target.value);
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            variant="outlined"
                        />

                        {gameMode?.label === "Free For All" &&
                            playersAmount === 4 && (
                                <Typography
                                    variant="h6"
                                    sx={{ marginTop: "16px", color: "#56616A" }}
                                >
                                    Team 4
                                </Typography>
                            )}
                        {playersAmount > 3 && (
                            <TextField
                                id="Player4TextField"
                                label="Choose player 4"
                                sx={{
                                    width: "100%",
                                    minWidth: "220px",
                                    marginTop: "16px",
                                }}
                                disabled={isGameStarted}
                                value={player4}
                                onChange={(event) => {
                                    handlePlayers("4", event.target.value);
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Card>
            </Box>
        </>
    );
}
