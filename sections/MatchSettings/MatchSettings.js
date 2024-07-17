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

import { gamePlayerCount } from "../../utils/matchSettings";

export default function NoteMaker({
    isGameStarted,
    gameMode,
    maxPoints,
    renderGameModes,
    handleModeChange,
    handleMaxPoints,
    handlePlayers,
    player1,
    player2,
    player3,
    player4,
    playersAmount,
    handleSliderChange,
}) {
    const theme = useTheme();
    const matchesUpBreakpoint = useMediaQuery(theme.breakpoints.up("lg"));
    const matchesUpXLBreakpoint = useMediaQuery(theme.breakpoints.up("xl"));
    const matchesDownBreakpoint = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <>
            <Box mb={3}>
                <Card elevation={10} sx={{ padding: "15px" }}>
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
                        sx={{ marginTop: "15px" }}
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
                        sx={{ marginTop: "15px" }}
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
                gap="15px"
                sx={{ width: "100%" }}
            >
                <Card
                    elevation={10}
                    sx={{
                        width: matchesDownBreakpoint ? "100%" : "initial",
                        padding: "15px",
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
                            sx={{ marginTop: "15px" }}
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
                                sx={{ marginTop: "15px", color: "#56616A" }}
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
                                    marginTop: "15px",
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
                        padding: "15px",
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
                                    playersAmount === 3 ? "50px" : "15px"
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
                                    sx={{ marginTop: "15px", color: "#56616A" }}
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
                                    marginTop: "15px",
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
