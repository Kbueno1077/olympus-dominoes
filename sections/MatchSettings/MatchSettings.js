import {
  Autocomplete,
  Box,
  Card,
  Slider,
  TextField,
  Typography,
  useMediaQuery,
  Stack,
  Chip,
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
  const [playersAmount, setPlayersAmount] = useRecoilState(playersAmountRecoil);
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
        <Card
          elevation={8}
          sx={{
            p: 4,
            background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
            borderRadius: 3,
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  color: "text.primary",
                  mb: 1,
                }}
              >
                Match Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set up your dominoes game parameters
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: "text.primary",
                  mb: 2,
                }}
              >
                Players: {playersAmount}
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  aria-label="Player count"
                  disabled={isGameStarted}
                  defaultValue={4}
                  value={playersAmount}
                  onChange={handleSliderChange}
                  max={4}
                  min={2}
                  step={1}
                  valueLabelDisplay="auto"
                  marks={gamePlayerCount}
                  sx={{
                    "& .MuiSlider-track": {
                      background:
                        "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
                    },
                    "& .MuiSlider-thumb": {
                      background:
                        "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    },
                    "& .MuiSlider-mark": {
                      backgroundColor: "#6366F1",
                    },
                  }}
                />
              </Box>
            </Box>

            <Autocomplete
              id="game-mode-select"
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
                  label="Game Mode"
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password",
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              )}
            />

            <TextField
              id="max-points"
              label="Max Points"
              fullWidth
              disabled={isGameStarted}
              value={maxPoints}
              onChange={(e) => {
                if (Number(e.target.value > 0) && !e.target.value.includes("."))
                  handleMaxPoints(e.target.value);
              }}
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{ pattern: "[0-9]*" }}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Stack>
        </Card>
      </Box>

      {/**PLAYER SETUP */}
      <Box
        display="flex"
        flexWrap={matchesDownBreakpoint ? "wrap " : ""}
        gap="20px"
        sx={{ width: "100%" }}
      >
        <Card
          elevation={8}
          sx={{
            width: matchesDownBreakpoint ? "100%" : "initial",
            p: 3,
            background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            border: "1px solid rgba(59, 130, 246, 0.1)",
            borderRadius: 3,
            flex: 1,
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label="Team 1"
                color="team1"
                size="small"
                sx={{ fontWeight: "bold" }}
              />
            </Box>

            <TextField
              id="Player1TextField"
              label="Player 1"
              disabled={isGameStarted}
              value={player1}
              onChange={(event) => {
                handlePlayers("1", event.target.value);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {playersAmount > 2 && (
              <Box>
                <Chip
                  label={
                    gameMode?.label === "Free For All" ? "Team 3" : "Team 1"
                  }
                  color={gameMode?.label === "Free For All" ? "team3" : "team1"}
                  size="small"
                  sx={{ mb: 1, fontWeight: "bold" }}
                />
                <TextField
                  id="Player3TextField"
                  label={`Player ${
                    playersAmount === 3 ? playersAmount : playersAmount - 1
                  }`}
                  fullWidth
                  disabled={isGameStarted}
                  value={player3}
                  onChange={(event) => {
                    handlePlayers("3", event.target.value);
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            )}
          </Stack>
        </Card>

        <Card
          elevation={8}
          sx={{
            width: matchesDownBreakpoint ? "100%" : "initial",
            p: 3,
            background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            border: "1px solid rgba(245, 158, 11, 0.1)",
            borderRadius: 3,
            flex: 1,
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label="Team 2"
                color="team2"
                size="small"
                sx={{ fontWeight: "bold" }}
              />
            </Box>

            <TextField
              id="Player2TextField"
              label={`Player ${playersAmount >= 3 ? "2" : playersAmount}`}
              fullWidth
              disabled={isGameStarted}
              value={player2}
              onChange={(event) => {
                handlePlayers("2", event.target.value);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {playersAmount > 3 && (
              <Box>
                <Chip
                  label={
                    gameMode?.label === "Free For All" ? "Team 4" : "Team 2"
                  }
                  color={gameMode?.label === "Free For All" ? "team4" : "team2"}
                  size="small"
                  sx={{ mb: 1, fontWeight: "bold" }}
                />
                <TextField
                  id="Player4TextField"
                  label="Player 4"
                  fullWidth
                  disabled={isGameStarted}
                  value={player4}
                  onChange={(event) => {
                    handlePlayers("4", event.target.value);
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            )}
          </Stack>
        </Card>
      </Box>
    </>
  );
}
