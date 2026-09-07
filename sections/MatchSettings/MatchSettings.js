"use client";

import {
  Box,
  Button,
  Card,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Fragment } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import {
  formatIcon,
  tileSetFromDominoSetId,
  tileSetIcon,
} from "@/lib/analytics/modeFormat";
import {
  FORMAT_SECTION_ICON,
  MODE_SECTION_ICON,
  ModeFormatMeta,
  ModeFormatIcon,
  ModeFormatToggleLabel,
  PLAYERS_SECTION_ICON,
  TARGET_SECTION_ICON,
  useModeFormatCopy,
} from "@/modules/Analytics/ModeFormatMark";
import { DOMINO_SETS, getDominoSet } from "@/utils/dominoSets";
import { gameModes2, gameModes3, gameModes4 } from "@/utils/matchSettings";
import { buildRandomRoster } from "@/utils/randomNames";
import {
  dominoSetRecoil,
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
 * Compact config line for an in-progress match (lives inside Match Standing).
 *
 * Each fact carries its own trailing separator inside one nowrap span, so if
 * the strip has to wrap on a narrow screen a line never begins with a stray
 * dot.
 */
export function MatchSummary() {
  const { t, teamName } = useTranslation();

  const [playersAmount] = useRecoilState(playersAmountRecoil);
  const [gameMode] = useRecoilState(gameModeRecoil);
  const [dominoSet] = useRecoilState(dominoSetRecoil);
  const [maxPoints] = useRecoilState(maxPointsRecoil);
  const [player1] = useRecoilState(player1Recoil);
  const [player2] = useRecoilState(player2Recoil);
  const [player3] = useRecoilState(player3Recoil);
  const [player4] = useRecoilState(player4Recoil);

  const isFreeForAll = gameMode?.label === "Free For All";
  const slots = [
    { number: 1, value: player1 },
    { number: 2, value: player2 },
    { number: 3, value: player3 },
    { number: 4, value: player4 },
  ];
  const teams = buildTeams(playersAmount, isFreeForAll, slots);

  const facts = [
    { key: "players", text: t("playersCount", { n: playersAmount }) },
    {
      key: "modeFormat",
      node: (
        <ModeFormatMeta
          tileSet={tileSetFromDominoSetId(dominoSet)}
          modeLabel={gameMode?.label ?? null}
        />
      ),
    },
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
                  backgroundColor: (theme) => theme.palette[fact.teamKey].main,
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
              {fact.node ?? fact.text}
            </Box>
            {index < facts.length - 1 && (
              <Box component="span" sx={{ color: "text.disabled" }}>
                {" ·"}
              </Box>
            )}
          </Box>
          {index < facts.length - 1 && " "}
        </Fragment>
      ))}
    </Typography>
  );
}

const setupChoiceGroupSx = {
  display: "flex",
  flexWrap: "nowrap",
  gap: 1,
  width: "100%",
  "& .MuiToggleButton-root": {
    flex: "1 1 0",
    minWidth: 0,
    minHeight: 40,
    gap: 0.75,
    px: 1.25,
    py: 0.875,
    border: "1px solid",
    borderColor: (theme) => alpha(theme.palette.text.secondary, 0.16),
    borderRadius: "10px !important",
    color: "text.secondary",
    backgroundColor: "background.default",
    "&:not(:first-of-type)": {
      borderLeft: "1px solid",
      borderLeftColor: (theme) => alpha(theme.palette.text.secondary, 0.16),
      ml: 0,
    },
    "&:hover": {
      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.07),
    },
    "&.Mui-selected": {
      color: "primary.dark",
      borderColor: "primary.main",
      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
      fontWeight: 700,
      "&:hover": {
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.16),
      },
    },
  },
};

function FieldGroup({ label, icon, children, sx }) {
  return (
    <Box sx={{ minWidth: 0, ...sx }}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
        {icon ? (
          <Box sx={{ color: "primary.main", display: "inline-flex" }}>
            <ModeFormatIcon icon={icon} />
          </Box>
        ) : null}
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "primary.dark", lineHeight: 1.2 }}
        >
          {label}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function PlayerNameField({ member, teamKey }) {
  const { t } = useTranslation();
  const isSelf = member.number === 1;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "3px",
          backgroundColor: (theme) => alpha(theme.palette[teamKey].main, 0.16),
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: (theme) => theme.palette[teamKey].main,
          }}
        />
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: 13,
            lineHeight: 1,
            color: (theme) => theme.palette[teamKey].main,
          }}
        >
          {member.number}
        </Typography>
      </Box>

      <TextField
        id={member.id}
        placeholder={isSelf ? t("selfPlaceholder") : t("namePlaceholder")}
        fullWidth
        size="small"
        value={member.value}
        onChange={(event) => member.onChange(event.target.value)}
        inputProps={{
          maxLength: 24,
          "aria-label": isSelf
            ? t("selfPlaceholder")
            : t("player", { n: member.number }),
        }}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": { minHeight: 40 },
        }}
        InputProps={{
          endAdornment: member.value ? (
            <InputAdornment position="end">
              <IconButton
                aria-label={t("clearName")}
                edge="end"
                size="small"
                onClick={() => member.onChange("")}
                sx={{
                  width: 28,
                  height: 28,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.text.secondary, 0.12),
                  "&:hover": {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.text.secondary, 0.2),
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontSize: 18,
                    lineHeight: 1,
                    color: "text.secondary",
                    mt: "-1px",
                  }}
                >
                  ×
                </Box>
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
      {isSelf ? (
        <Typography
          component="span"
          sx={{
            fontWeight: 500,
            fontSize: 10,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: (theme) => theme.palette[teamKey].main,
            lineHeight: 1.2,
            flexShrink: 0,
          }}
        >
          {t("youBadge")}
        </Typography>
      ) : null}
    </Stack>
  );
}

function TeamBlock({ team }) {
  return (
    <Stack
      spacing={1}
      sx={{
        minWidth: 0,
        borderRadius: "12px",
        p: 1.25,
        backgroundColor: (theme) => alpha(theme.palette[team.key].main, 0.1),
      }}
    >
      {team.members.map((member) => (
        <PlayerNameField
          key={member.id}
          member={member}
          teamKey={team.key}
        />
      ))}
    </Stack>
  );
}

export default function MatchSettings({ onStart }) {
  const { t } = useTranslation();
  const { formatLabel, tileLabel } = useModeFormatCopy();

  const [playersAmount, setPlayersAmount] = useRecoilState(playersAmountRecoil);
  const [renderGameModes, setRenderGamesModes] = useRecoilState(
    renderGameModesRecoil
  );
  const [gameMode, setGameMode] = useRecoilState(gameModeRecoil);
  const [dominoSet, setDominoSet] = useRecoilState(dominoSetRecoil);
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

  const handleDominoSetChange = (_event, nextSetId) => {
    if (nextSetId === null) return;
    const nextSet = getDominoSet(nextSetId);
    setDominoSet(nextSet.id);
    // Apply the usual target for this set; the user can still override.
    setMaxPoints(String(nextSet.defaultMaxPoints));
  };

  const handleMaxPointsInput = (raw) => {
    // Digits only: an empty or decimal target would break the win comparisons.
    if (!/^\d+$/.test(raw)) return;
    setMaxPoints(raw);
  };

  const handleRandomNames = () => {
    const [next1, next2, next3, next4] = buildRandomRoster(
      playersAmount,
      t("selfName")
    );
    setPlayer1(next1);
    setPlayer2(next2);
    setPlayer3(next3);
    setPlayer4(next4);
  };

  if (isGameStarted) {
    return null;
  }

  // Free-for-all with 3+ solo seats needs more columns than partner play.
  const rosterColumns =
    isFreeForAll && playersAmount > 2
      ? { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: `repeat(${Math.min(playersAmount, 4)}, minmax(0, 1fr))` }
      : { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" };

  return (
    <Stack spacing={1.75}>
      <Card sx={{ p: { xs: 2.25, sm: 2.5 } }}>
        <Stack spacing={2.25}>
          <Box>
            <Typography variant="h3" sx={{ color: "primary.dark" }}>
              {t("setupTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("setupSubtitle")}
            </Typography>
          </Box>

          <Stack spacing={2.25}>
            <FieldGroup
              icon={PLAYERS_SECTION_ICON}
              label={t("playersAtTable")}
            >
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                disabled={isGameStarted}
                value={playersAmount}
                onChange={handlePlayerCountChange}
                aria-label={t("playersAtTable")}
                sx={setupChoiceGroupSx}
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

            <FieldGroup icon={MODE_SECTION_ICON} label={t("mode")}>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                disabled={isGameStarted}
                value={dominoSet}
                onChange={handleDominoSetChange}
                aria-label={t("mode")}
                sx={setupChoiceGroupSx}
              >
                {DOMINO_SETS.map((set) => {
                  const tiles = tileSetFromDominoSetId(set.id);
                  return (
                    <ToggleButton
                      key={set.id}
                      value={set.id}
                      aria-label={tileLabel(tiles)}
                    >
                      <ModeFormatToggleLabel icon={tileSetIcon(tiles)}>
                        {tileLabel(tiles)}
                      </ModeFormatToggleLabel>
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            </FieldGroup>

            <FieldGroup icon={FORMAT_SECTION_ICON} label={t("format")}>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                disabled={isGameStarted}
                value={gameMode?.label ?? null}
                onChange={handleModeChange}
                aria-label={t("format")}
                sx={setupChoiceGroupSx}
              >
                {renderGameModes.map((mode) => (
                  <ToggleButton
                    key={mode.label}
                    value={mode.label}
                    aria-label={formatLabel(mode.label)}
                  >
                    <ModeFormatToggleLabel icon={formatIcon(mode.label)}>
                      {formatLabel(mode.label)}
                    </ModeFormatToggleLabel>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </FieldGroup>

            <FieldGroup icon={TARGET_SECTION_ICON} label={t("pointsToWin")}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="stretch"
                sx={{ minWidth: 0 }}
              >
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  disabled={isGameStarted}
                  value={TARGET_PRESETS.includes(Number(maxPoints)) ? Number(maxPoints) : null}
                  onChange={(_event, nextPoints) => {
                    if (nextPoints !== null) setMaxPoints(String(nextPoints));
                  }}
                  aria-label={t("pointsToWin")}
                  sx={{ ...setupChoiceGroupSx, flex: 3, minWidth: 0 }}
                >
                  {TARGET_PRESETS.map((preset) => (
                    <ToggleButton
                      key={preset}
                      value={preset}
                    >
                      {preset}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <TextField
                  id="max-points"
                  placeholder={t("playFirstToCustom")}
                  size="small"
                  disabled={isGameStarted}
                  value={
                    TARGET_PRESETS.includes(Number(maxPoints)) ? "" : maxPoints
                  }
                  onChange={(event) => handleMaxPointsInput(event.target.value)}
                  type="number"
                  inputProps={{
                    "aria-label": t("target"),
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    min: 1,
                  }}
                  sx={{
                    flex: 1.1,
                    minWidth: 72,
                    "& .MuiOutlinedInput-root": {
                      minHeight: 40,
                      backgroundColor: (theme) =>
                        TARGET_PRESETS.includes(Number(maxPoints))
                          ? theme.palette.background.default
                          : alpha(theme.palette.primary.main, 0.08),
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: (theme) =>
                        TARGET_PRESETS.includes(Number(maxPoints))
                          ? alpha(theme.palette.text.secondary, 0.16)
                          : theme.palette.primary.main,
                    },
                  }}
                />
              </Stack>
            </FieldGroup>
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ p: { xs: 2, sm: 2.25 } }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: "text.primary" }}>
              {t("rosterTitle")}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t("rosterSubtitle")}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleRandomNames}
              sx={{
                flex: 1,
                minHeight: 38,
                px: 1.5,
                fontSize: 13,
              }}
            >
              {t("randomNames")}
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: { xs: 2.25, sm: 2.5 },
              gridTemplateColumns: rosterColumns,
              alignItems: "start",
            }}
          >
            {teams.map((team) => (
              <TeamBlock key={team.key} team={team} />
            ))}
          </Box>

          {onStart ? (
            <Button
              onClick={onStart}
              variant="contained"
              size="large"
              fullWidth
            >
              {t("startPlaying")}
            </Button>
          ) : null}
        </Stack>
      </Card>

      {isFreeForAll && playersAmount > 2 && (
        <Typography variant="caption" sx={{ color: "text.secondary", px: 0.5 }}>
          {t("freeForAllNote")}
        </Typography>
      )}
    </Stack>
  );
}
