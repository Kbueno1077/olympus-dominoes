"use client";

import {
  Box,
  Card,
  Chip,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Fragment } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import { gameModes2, gameModes3, gameModes4 } from "@/utils/matchSettings";
import {
  gameModeRecoil,
  isGameStartedRecoil,
  maxPointsRecoil,
  player1Recoil,
  player2Recoil,
  player3Recoil,
  player4Recoil,
  playersAmountRecoil,
  renderGameModesRecoil,
} from "@/recoil/recoilState";
import { useRecoilState } from "recoil";

const PLAYER_COUNTS = [2, 3, 4];
const TARGET_PRESETS = [100, 150, 200];

const MODES_BY_COUNT = {
  2: { modes: gameModes2, defaultIndex: 0 },
  3: { modes: gameModes3, defaultIndex: 0 },
  4: { modes: gameModes4, defaultIndex: 1 },
};

/**
 * Group the four player slots into the teams that will actually be scored.
 * Partners sit on the same note, so the roster must mirror the scorepad.
 */
function buildTeams(playersAmount, isFreeForAll, slots) {
  const [p1, p2, p3, p4] = slots;

  if (isFreeForAll) {
    return slots.slice(0, playersAmount).map((slot, index) => ({
      key: `team${index + 1}`,
      number: index + 1,
      members: [slot],
    }));
  }

  const team1 = playersAmount > 2 ? [p1, p3] : [p1];
  const team2 = playersAmount > 3 ? [p2, p4] : [p2];

  return [
    { key: "team1", number: 1, members: team1 },
    { key: "team2", number: 2, members: team2 },
  ];
}

/**
 * Once play starts the setup is locked, so it collapses to a single strip of
 * facts rather than a form nobody can use.
 *
 * Each fact carries its own trailing separator inside one nowrap span, so if
 * the strip has to wrap on a narrow screen a line never begins with a stray
 * dot.
 */
function MatchSummary({ playersAmount, modeLabel, maxPoints, teams }) {
  const { t, teamName, modeName } = useTranslation();

  const facts = [
    { key: "players", text: t("playersCount", { n: playersAmount }) },
    ...(modeLabel ? [{ key: "mode", text: modeName(modeLabel) }] : []),
    { key: "target", text: t("firstTo", { n: maxPoints }) },
    ...teams.map((team) => ({
      key: team.key,
      teamKey: team.key,
      text:
        team.members
          .map((member) => member.value)
          .filter(Boolean)
          .join(" & ") || teamName(team.number),
    })),
  ];

  return (
    <Card sx={{ px: 2, py: 1.25 }}>
      <Typography variant="body2" component="p" sx={{ color: "text.secondary" }}>
        {facts.map((fact, index) => (
          <Fragment key={fact.key}>
            <Box component="span" sx={{ whiteSpace: "nowrap" }}>
              {fact.teamKey && (
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    mr: 0.75,
                    verticalAlign: "middle",
                    backgroundColor: (t) => t.palette[fact.teamKey].main,
                  }}
                />
              )}
              <Box
                component="span"
                sx={{
                  color: fact.teamKey ? "text.primary" : "text.secondary",
                  fontWeight: fact.teamKey ? 600 : 400,
                }}
              >
                {fact.text}
              </Box>
              {index < facts.length - 1 && (
                <Box component="span" sx={{ color: "text.disabled" }}>
                  {" ·"}
                </Box>
              )}
            </Box>
            {/* Breakable space lives outside the nowrap span, so a wrapped
                line starts with a fact rather than a separator. */}
            {index < facts.length - 1 && " "}
          </Fragment>
        ))}
      </Typography>
    </Card>
  );
}

function FieldGroup({ label, children }) {
  return (
    <Box>
      <Typography
        variant="overline"
        component="p"
        sx={{ color: "text.secondary", mb: 1 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function TeamRoster({ team, disabled }) {
  const { t, teamName } = useTranslation();

  return (
    <Card
      sx={{
        flex: 1,
        minWidth: 0,
        p: 2.5,
        // The chip already names the team, so the card only warms its own
        // hairline toward that hue rather than wearing a coloured spine.
        borderColor: (theme) => alpha(theme.palette[team.key].main, 0.32),
      }}
    >
      <Stack spacing={2}>
        <Chip
          label={teamName(team.number)}
          size="small"
          sx={{
            alignSelf: "flex-start",
            color: (theme) => theme.palette[team.key].dark,
            backgroundColor: (theme) =>
              alpha(theme.palette[team.key].main, 0.12),
          }}
        />

        {team.members.map((member) => (
          <TextField
            key={member.id}
            id={member.id}
            label={t("player", { n: member.number })}
            placeholder={t("namePlaceholder")}
            fullWidth
            size="small"
            disabled={disabled}
            value={member.value}
            onChange={(event) => member.onChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        ))}
      </Stack>
    </Card>
  );
}

export default function MatchSettings() {
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("sm"));
  const { t, modeName } = useTranslation();

  const [playersAmount, setPlayersAmount] = useRecoilState(playersAmountRecoil);
  const [renderGameModes, setRenderGamesModes] = useRecoilState(
    renderGameModesRecoil
  );
  const [gameMode, setGameMode] = useRecoilState(gameModeRecoil);
  const [maxPoints, setMaxPoints] = useRecoilState(maxPointsRecoil);

  const [player1, setPlayer1] = useRecoilState(player1Recoil);
  const [player2, setPlayer2] = useRecoilState(player2Recoil);
  const [player3, setPlayer3] = useRecoilState(player3Recoil);
  const [player4, setPlayer4] = useRecoilState(player4Recoil);

  const [isGameStarted] = useRecoilState(isGameStartedRecoil);

  const isFreeForAll = gameMode?.label === "Free For All";

  const slots = [
    {
      id: "Player1TextField",
      number: 1,
      value: player1,
      onChange: setPlayer1,
    },
    {
      id: "Player2TextField",
      number: 2,
      value: player2,
      onChange: setPlayer2,
    },
    {
      id: "Player3TextField",
      number: 3,
      value: player3,
      onChange: setPlayer3,
    },
    {
      id: "Player4TextField",
      number: 4,
      value: player4,
      onChange: setPlayer4,
    },
  ];

  const teams = buildTeams(playersAmount, isFreeForAll, slots);

  const handlePlayerCountChange = (_event, nextCount) => {
    if (nextCount === null) return;

    const { modes, defaultIndex } = MODES_BY_COUNT[nextCount];
    setRenderGamesModes(modes);
    setGameMode(modes[defaultIndex]);
    setPlayersAmount(nextCount);
  };

  const handleModeChange = (_event, nextLabel) => {
    if (nextLabel === null) return;
    const nextMode = renderGameModes.find((mode) => mode.label === nextLabel);
    if (nextMode) setGameMode(nextMode);
  };

  const handleMaxPointsInput = (raw) => {
    // Digits only: an empty or decimal target would break the win comparisons.
    if (!/^\d+$/.test(raw)) return;
    setMaxPoints(raw);
  };

  if (isGameStarted) {
    return (
      <MatchSummary
        playersAmount={playersAmount}
        modeLabel={gameMode?.label}
        maxPoints={maxPoints}
        teams={teams}
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" sx={{ color: "text.primary" }}>
              {t("setupTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("setupSubtitle")}
            </Typography>
          </Box>

          <FieldGroup label={t("playersAtTable")}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              disabled={isGameStarted}
              value={playersAmount}
              onChange={handlePlayerCountChange}
              aria-label={t("playersAtTable")}
            >
              {PLAYER_COUNTS.map((count) => (
                <ToggleButton
                  key={count}
                  value={count}
                  aria-label={t("playerCountAria", { n: count })}
                >
                  {count}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </FieldGroup>

          <FieldGroup label={t("format")}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              disabled={isGameStarted}
              value={gameMode?.label ?? null}
              onChange={handleModeChange}
              aria-label={t("format")}
            >
              {renderGameModes.map((mode) => (
                <ToggleButton key={mode.label} value={mode.label}>
                  {modeName(mode.label)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </FieldGroup>

          <FieldGroup label={t("pointsToWin")}>
            <Stack
              direction={isNarrow ? "column" : "row"}
              spacing={1.5}
              alignItems={isNarrow ? "stretch" : "center"}
            >
              <TextField
                id="max-points"
                label={t("target")}
                size="small"
                disabled={isGameStarted}
                value={maxPoints}
                onChange={(event) => handleMaxPointsInput(event.target.value)}
                type="number"
                InputLabelProps={{ shrink: true }}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 1 }}
                sx={{ width: isNarrow ? "100%" : 130 }}
              />

              <Stack direction="row" spacing={1}>
                {TARGET_PRESETS.map((preset) => (
                  <Chip
                    key={preset}
                    label={preset}
                    size="small"
                    clickable={!isGameStarted}
                    disabled={isGameStarted}
                    variant={
                      Number(maxPoints) === preset ? "filled" : "outlined"
                    }
                    color={Number(maxPoints) === preset ? "primary" : "default"}
                    onClick={() => setMaxPoints(String(preset))}
                  />
                ))}
              </Stack>
            </Stack>
          </FieldGroup>
        </Stack>
      </Card>

      {/* PLAYER ROSTERS */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
        }}
      >
        {teams.map((team) => (
          <TeamRoster key={team.key} team={team} disabled={isGameStarted} />
        ))}
      </Box>

      {isFreeForAll && playersAmount > 2 && (
        <Typography variant="caption" sx={{ color: "text.secondary", px: 0.5 }}>
          {t("freeForAllNote")}
        </Typography>
      )}
    </Stack>
  );
}
