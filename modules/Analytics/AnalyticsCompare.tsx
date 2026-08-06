"use client";

import AnalyticsCompareCharts from "@/modules/Analytics/AnalyticsCompareCharts";
import {
  ControlSection,
} from "@/modules/Analytics/dashboardChrome";
import { formatJosesCoefficient } from "@/lib/analytics/joseCoefficient";
import {
  matchupAlignmentReady,
  matchupFilterFromTeams,
} from "@/lib/analytics/matchup";
import { computeMatchupStats } from "@/lib/analytics/matchupStats";
import { getPlayerStats } from "@/lib/analytics/selectors";
import {
  formatSignedDiff,
  perHandAverage,
  signedDiffColor,
} from "@/lib/analytics/signedDiff";
import type { CompareLaunch } from "@/lib/analytics/datasets";
import type { OlympusExportData, PlayerStatsView } from "@/lib/analytics/types";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_COMPARE = 10;
const SIDE_A = "#2F6F9F";
const SIDE_B = "#B8453A";

type TeamSide = 1 | 2;

type CompareStatKey =
  | "josesCoefficient"
  | "gamesPlayed"
  | "gamesWon"
  | "gamesLost"
  | "gameDifference"
  | "pointsFor"
  | "pointsAgainst"
  | "pointsDifference"
  | "handsPlayed"
  | "handsWon"
  | "handsLost"
  | "handsDifference"
  | "pointsPerHandFor"
  | "pointsPerHandAgainst"
  | "pointsPerHandDifference"
  | "pollosFor"
  | "pollosAgainst"
  | "pollosDifference"
  | "zapatosFor"
  | "zapatosAgainst"
  | "zapatosDifference";

function formatPerHand(points: number, hands: number): string {
  if (hands <= 0) return "—";
  const avg = points / hands;
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
}

function cellValue(stats: PlayerStatsView | null, key: CompareStatKey): string {
  if (!stats) return "—";
  switch (key) {
    case "josesCoefficient":
      return formatJosesCoefficient(stats.josesCoefficient);
    case "pointsPerHandFor":
      return formatPerHand(stats.pointsFor, stats.handsFor);
    case "pointsPerHandAgainst":
      return formatPerHand(stats.pointsAgainst, stats.handsAgainst);
    case "gameDifference":
      return formatSignedDiff(stats.gamesWon - stats.gamesLost);
    case "pointsDifference":
      return formatSignedDiff(stats.pointsFor - stats.pointsAgainst);
    case "handsDifference":
      return formatSignedDiff(stats.handsWon - stats.handsLost);
    case "pointsPerHandDifference": {
      const forAvg = perHandAverage(stats.pointsFor, stats.handsFor);
      const againstAvg = perHandAverage(
        stats.pointsAgainst,
        stats.handsAgainst
      );
      if (forAvg == null || againstAvg == null) return "—";
      return formatSignedDiff(forAvg - againstAvg, 1);
    }
    case "pollosDifference":
      return formatSignedDiff(stats.pollosFor - stats.pollosAgainst);
    case "zapatosDifference":
      return formatSignedDiff(stats.zapatosFor - stats.zapatosAgainst);
    case "gamesPlayed":
      return String(stats.gamesPlayed);
    case "gamesWon":
      return String(stats.gamesWon);
    case "gamesLost":
      return String(stats.gamesLost);
    case "pointsFor":
      return String(stats.pointsFor);
    case "pointsAgainst":
      return String(stats.pointsAgainst);
    case "handsPlayed":
      return String(stats.handsPlayed);
    case "handsWon":
      return String(stats.handsWon);
    case "handsLost":
      return String(stats.handsLost);
    case "pollosFor":
      return String(stats.pollosFor);
    case "pollosAgainst":
      return String(stats.pollosAgainst);
    case "zapatosFor":
      return String(stats.zapatosFor);
    case "zapatosAgainst":
      return String(stats.zapatosAgainst);
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

function cellColor(
  stats: PlayerStatsView | null,
  key: CompareStatKey
): string | undefined {
  if (!stats) return undefined;
  switch (key) {
    case "gameDifference":
      return signedDiffColor(stats.gamesWon - stats.gamesLost);
    case "pointsDifference":
      return signedDiffColor(stats.pointsFor - stats.pointsAgainst);
    case "handsDifference":
      return signedDiffColor(stats.handsWon - stats.handsLost);
    case "pointsPerHandDifference": {
      const forAvg = perHandAverage(stats.pointsFor, stats.handsFor);
      const againstAvg = perHandAverage(
        stats.pointsAgainst,
        stats.handsAgainst
      );
      if (forAvg == null || againstAvg == null) return undefined;
      return signedDiffColor(forAvg - againstAvg);
    }
    case "pollosDifference":
      return signedDiffColor(stats.pollosFor - stats.pollosAgainst);
    case "zapatosDifference":
      return signedDiffColor(stats.zapatosFor - stats.zapatosAgainst);
    default:
      return undefined;
  }
}

function defaultTeamForNew(
  assignments: Record<number, TeamSide | null>
): TeamSide {
  const values = Object.values(assignments);
  const hasA = values.includes(1);
  const hasB = values.includes(2);
  if (!hasA) return 1;
  if (!hasB) return 2;
  return 1;
}

type Props = {
  data: OlympusExportData;
  modes: string[];
  initialMode?: string | null;
  initialLaunch?: CompareLaunch | null;
};

export default function AnalyticsCompare({
  data,
  modes,
  initialMode,
  initialLaunch = null,
}: Props) {
  const { t, modeName } = useTranslation();
  const launchApplied = useRef(false);
  const [modeLabel, setModeLabel] = useState<string | null>(() => {
    if (initialLaunch?.modeLabel && modes.includes(initialLaunch.modeLabel)) {
      return initialLaunch.modeLabel;
    }
    if (initialMode && modes.includes(initialMode)) return initialMode;
    return modes[0] ?? null;
  });
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    initialLaunch?.playerIds?.length ? [...initialLaunch.playerIds] : []
  );
  const [teams, setTeams] = useState<Record<number, TeamSide | null>>(() =>
    initialLaunch?.teams ? { ...initialLaunch.teams } : {}
  );
  const [matchupMode, setMatchupMode] = useState(
    () => Boolean(initialLaunch?.matchupMode)
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [matchupByPlayer, setMatchupByPlayer] = useState<
    Record<number, PlayerStatsView>
  >({});
  const [matchupMeta, setMatchupMeta] = useState<{
    matchCount: number;
    gameCount: number;
  } | null>(null);
  const [matchupLoading, setMatchupLoading] = useState(false);

  const players = data.players;
  const alignmentReady = matchupAlignmentReady(selectedIds, teams);

  useEffect(() => {
    if (launchApplied.current || !initialLaunch) return;
    launchApplied.current = true;
    const ids = initialLaunch.playerIds.filter((id) =>
      players.some((p) => p.id === id)
    );
    setSelectedIds(ids);
    setTeams(initialLaunch.teams ?? {});
    setMatchupMode(Boolean(initialLaunch.matchupMode));
    if (initialLaunch.modeLabel && modes.includes(initialLaunch.modeLabel)) {
      setModeLabel(initialLaunch.modeLabel);
    }
  }, [initialLaunch, modes, players]);

  useEffect(() => {
    if (modeLabel && modes.includes(modeLabel)) return;
    setModeLabel(modes[0] ?? null);
  }, [modes, modeLabel]);

  useEffect(() => {
    if (!matchupMode) {
      setMatchupByPlayer({});
      setMatchupMeta(null);
      setMatchupLoading(false);
      return;
    }
    if (!alignmentReady || modeLabel == null || selectedIds.length === 0) {
      setMatchupByPlayer({});
      setMatchupMeta(null);
      setMatchupLoading(false);
      return;
    }

    setMatchupLoading(true);
    // Defer so the loading card paints before a heavy scan.
    const handle = window.setTimeout(() => {
      try {
        const filter = matchupFilterFromTeams(selectedIds, teams);
        const result = computeMatchupStats({
          data,
          filter,
          modeLabel,
          playerIds: selectedIds,
        });
        setMatchupByPlayer(result.byPlayerId);
        setMatchupMeta({
          matchCount: result.matchCount,
          gameCount: result.gameCount,
        });
      } catch {
        setMatchupByPlayer({});
        setMatchupMeta(null);
      } finally {
        setMatchupLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(handle);
  }, [matchupMode, alignmentReady, modeLabel, selectedIds, teams, data]);

  const selectedPlayers = useMemo(
    () =>
      selectedIds
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is (typeof players)[number] => p != null),
    [players, selectedIds]
  );

  const rows = useMemo(
    () =>
      [
        {
          key: "josesCoefficient" as const,
          abbr: t("statsAbbrJoses"),
          full: t("statsJosesCoefficient"),
        },
        {
          key: "gamesPlayed" as const,
          abbr: t("statsAbbrGamesPlayed"),
          full: t("statsGamesPlayed"),
        },
        {
          key: "gamesWon" as const,
          abbr: t("statsAbbrGamesWon"),
          full: t("statsGamesWon"),
        },
        {
          key: "gamesLost" as const,
          abbr: t("statsAbbrGamesLost"),
          full: t("statsGamesLost"),
        },
        {
          key: "gameDifference" as const,
          abbr: t("statsAbbrGameDifference"),
          full: t("statsGameDifference"),
        },
        {
          key: "pointsFor" as const,
          abbr: t("statsAbbrPointsFor"),
          full: t("statsPointsFor"),
        },
        {
          key: "pointsAgainst" as const,
          abbr: t("statsAbbrPointsAgainst"),
          full: t("statsPointsAgainst"),
        },
        {
          key: "pointsDifference" as const,
          abbr: t("statsAbbrPointsDifference"),
          full: t("statsPointsDifference"),
        },
        {
          key: "handsPlayed" as const,
          abbr: t("statsAbbrHandsTotal"),
          full: t("statsHandsTotal"),
        },
        {
          key: "handsWon" as const,
          abbr: t("statsAbbrHandsWon"),
          full: t("statsHandsWon"),
        },
        {
          key: "handsLost" as const,
          abbr: t("statsAbbrHandsLost"),
          full: t("statsHandsLost"),
        },
        {
          key: "handsDifference" as const,
          abbr: t("statsAbbrHandsDifference"),
          full: t("statsHandsDifference"),
        },
        {
          key: "pointsPerHandFor" as const,
          abbr: t("statsAbbrPointsPerHandFor"),
          full: t("statsPointsPerHandFor"),
        },
        {
          key: "pointsPerHandAgainst" as const,
          abbr: t("statsAbbrPointsPerHandAgainst"),
          full: t("statsPointsPerHandAgainst"),
        },
        {
          key: "pointsPerHandDifference" as const,
          abbr: t("statsAbbrPointsPerHandDifference"),
          full: t("statsPointsPerHandDifference"),
        },
        {
          key: "pollosFor" as const,
          abbr: t("statsAbbrPollosFor"),
          full: t("statsPollosFor"),
        },
        {
          key: "pollosAgainst" as const,
          abbr: t("statsAbbrPollosAgainst"),
          full: t("statsPollosAgainst"),
        },
        {
          key: "pollosDifference" as const,
          abbr: t("statsAbbrPollosDifference"),
          full: t("statsPollosDifference"),
        },
        {
          key: "zapatosFor" as const,
          abbr: t("statsAbbrZapatosFor"),
          full: t("statsZapatosFor"),
        },
        {
          key: "zapatosAgainst" as const,
          abbr: t("statsAbbrZapatosAgainst"),
          full: t("statsZapatosAgainst"),
        },
        {
          key: "zapatosDifference" as const,
          abbr: t("statsAbbrZapatosDifference"),
          full: t("statsZapatosDifference"),
        },
      ] as const,
    [t]
  );

  const togglePlayer = (playerId: number) => {
    setSelectedIds((current) => {
      if (current.includes(playerId)) {
        setTeams((prev) => {
          const next = { ...prev };
          delete next[playerId];
          return next;
        });
        return current.filter((id) => id !== playerId);
      }
      if (current.length >= MAX_COMPARE) return current;
      setTeams((prev) => ({
        ...prev,
        [playerId]: defaultTeamForNew(prev),
      }));
      return [...current, playerId];
    });
  };

  const setPlayerTeam = (playerId: number, team: TeamSide) => {
    setTeams((prev) => ({ ...prev, [playerId]: team }));
  };

  const statsForPlayer = (playerId: number): PlayerStatsView | null => {
    if (matchupMode) {
      return matchupByPlayer[playerId] ?? null;
    }
    if (!modeLabel) return null;
    return (
      getPlayerStats(data, playerId).find((s) => s.modeLabel === modeLabel) ??
      null
    );
  };

  const showTable =
    selectedPlayers.length > 0 &&
    (!matchupMode || (alignmentReady && !matchupLoading));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 0,
        width: "100%",
        flex: 1,
        minHeight: { md: 0 },
        alignItems: "stretch",
      }}
    >
      <Box
        component="aside"
        sx={{
          width: { xs: "100%", md: 300 },
          flexShrink: 0,
          borderRight: {
            xs: "none",
            md: "1px solid #C0C0C0",
          },
          borderBottom: {
            xs: "1px solid #C0C0C0",
            md: "none",
          },
          backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.75),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          p: 2,
          pt: { xs: 2.5, md: 3 },
          alignSelf: "stretch",
        }}
      >
        <Stack
          spacing={0}
          divider={
            <Box
              sx={{
                my: 2,
                borderTop: "1px solid",
                borderColor: (theme) =>
                  alpha(theme.palette.grey[700], 0.12),
              }}
            />
          }
        >
        <ControlSection
          label={t("statsComparePlayers")}
          hint={
            matchupMode ? t("statsMatchupAssignHint") : t("statsCompareHint")
          }
        >
          {selectedPlayers.length === 0 ? null : matchupMode ? (
            <Stack spacing={0.5} sx={{ mb: 1.5 }}>
              {selectedPlayers.map((player) => (
                <Stack
                  key={player.id}
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                  sx={{ minHeight: 36 }}
                >
                  <Typography sx={{ flex: 1, minWidth: 0 }} noWrap>
                    {player.name}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {(
                      [
                        {
                          value: 1 as const,
                          color: SIDE_A,
                          label: t("statsMatchupTeamA"),
                        },
                        {
                          value: 2 as const,
                          color: SIDE_B,
                          label: t("statsMatchupTeamB"),
                        },
                      ] as const
                    ).map((option) => {
                      const selected = teams[player.id] === option.value;
                      return (
                        <Box
                          key={option.value}
                          component="button"
                          type="button"
                          aria-label={option.label}
                          aria-pressed={selected}
                          onClick={() => setPlayerTeam(player.id, option.value)}
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `2px solid ${option.color}`,
                            backgroundColor: selected
                              ? option.color
                              : "transparent",
                            p: 0,
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </Stack>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => togglePlayer(player.id)}
                    aria-label={t("statsCompareRemove", { name: player.name })}
                    sx={{ minWidth: 0, px: 1, color: "text.secondary" }}
                  >
                    ×
                  </Button>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              {selectedPlayers.map((player) => (
                <Chip
                  key={player.id}
                  label={player.name}
                  onDelete={() => togglePlayer(player.id)}
                  sx={{
                    borderColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.35),
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.08),
                  }}
                  variant="outlined"
                />
              ))}
            </Stack>
          )}

          <Button variant="outlined" onClick={() => setPickerOpen(true)}>
            {t("statsComparePick")}
          </Button>

          {matchupMode && selectedPlayers.length < 2 ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 1.25 }}
            >
              {t("statsMatchupNeedPlayers")}
            </Typography>
          ) : null}
          {matchupMode &&
          selectedPlayers.length >= 2 &&
          !alignmentReady ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 1.25 }}
            >
              {t("statsMatchupNeedBothSides")}
            </Typography>
          ) : null}
        </ControlSection>

        {modes.length > 0 ? (
          <ControlSection label={t("format")}>
            <ToggleButtonGroup
              exclusive
              size="small"
              fullWidth
              value={modeLabel}
              onChange={(_, value) => {
                if (value) setModeLabel(value);
              }}
              sx={{ flexWrap: "wrap" }}
            >
              {modes.map((mode) => (
                <ToggleButton key={mode} value={mode} sx={{ flex: 1 }}>
                  {modeName(mode)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </ControlSection>
        ) : null}

        <ControlSection
          label={t("statsMatchupToggle")}
          hint={t("statsMatchupHint")}
          trailing={
            <Switch
              checked={matchupMode}
              onChange={(_, checked) => setMatchupMode(checked)}
              color="primary"
            />
          }
        />
        </Stack>
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 2, sm: 2.5 },
        }}
      >
        <Stack spacing={2.5}>
      {selectedPlayers.length === 0 ? (
        <Card sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("statsCompareEmpty")}
          </Typography>
        </Card>
      ) : matchupMode && matchupLoading ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress size={28} sx={{ mb: 1.5 }} />
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
            {t("statsMatchupLoadingTitle")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("statsMatchupLoadingBody")}
          </Typography>
        </Card>
      ) : showTable ? (
        <>
          {matchupMode && matchupMeta ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("statsMatchupMeta", {
                matches: matchupMeta.matchCount,
                games: matchupMeta.gameCount,
              })}
            </Typography>
          ) : null}
          {matchupMode && matchupMeta?.matchCount === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("statsMatchupNoGames")}
            </Typography>
          ) : (
            <>
              <AnalyticsCompareCharts
                players={selectedPlayers.map((player) => ({
                  id: player.id,
                  name: player.name,
                  stats: statsForPlayer(player.id),
                }))}
                t={t}
              />
              <Card sx={{ overflow: "auto" }}>
              <Box
                component="table"
                sx={{
                  borderCollapse: "collapse",
                  minWidth: 64 + selectedPlayers.length * 88,
                  width: "100%",
                }}
              >
                <thead>
                  <tr>
                    <Box
                      component="th"
                      sx={{
                        width: 64,
                        px: 1.5,
                        py: 1.25,
                        textAlign: "left",
                        borderBottom: "1px solid",
                        borderRight: "1px solid",
                        borderColor: "divider",
                        color: "text.secondary",
                        fontWeight: 500,
                        fontSize: 12,
                      }}
                    >
                      {t("statsCompareStat")}
                    </Box>
                    {selectedPlayers.map((player) => (
                      <Box
                        key={player.id}
                        component="th"
                        sx={{
                          width: 88,
                          px: 1,
                          py: 1.25,
                          textAlign: "center",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {player.name}
                      </Box>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <Box
                      component="tr"
                      key={row.key}
                      sx={{
                        backgroundColor:
                          index % 2 === 1
                            ? (theme) =>
                                alpha(theme.palette.text.secondary, 0.06)
                            : "transparent",
                      }}
                    >
                      <Box
                        component="td"
                        title={row.full}
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          borderRight: "1px solid",
                          borderColor: "divider",
                          color: "text.secondary",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {row.abbr}
                      </Box>
                      {selectedPlayers.map((player) => {
                        const stats = statsForPlayer(player.id);
                        const tone = cellColor(stats, row.key);
                        return (
                          <Box
                            key={player.id}
                            component="td"
                            sx={{
                              px: 1,
                              py: 1.25,
                              textAlign: "center",
                              fontWeight: 600,
                              fontSize: 15,
                              fontVariantNumeric: "tabular-nums",
                              color: tone || "text.primary",
                            }}
                          >
                            {cellValue(stats, row.key)}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </tbody>
              </Box>
            </Card>
            </>
          )}
        </>
      ) : null}
        </Stack>
      </Box>

      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("statsComparePick")}</DialogTitle>
        <DialogContent dividers>
          <Stack>
            {players.map((player) => {
              const checked = selectedIds.includes(player.id);
              const disabled = !checked && selectedIds.length >= MAX_COMPARE;
              return (
                <FormControlLabel
                  key={player.id}
                  control={
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onChange={() => togglePlayer(player.id)}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{player.name}</span>
                      {player.is_myself ? (
                        <Typography
                          variant="overline"
                          sx={{ color: "primary.main", fontSize: 10 }}
                        >
                          {t("youBadge")}
                        </Typography>
                      ) : null}
                    </Stack>
                  }
                />
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickerOpen(false)} variant="contained">
            {t("done")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
