"use client";

import AnalyticsCompareCharts from "@/modules/Analytics/AnalyticsCompareCharts";
import StatsDataDrawer from "@/modules/Analytics/StatsDataDrawer";
import {
  ControlSection,
  dashboardAsideSx,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  loadCompareUiFilters,
  saveCompareUiFilters,
} from "@/lib/analytics/compareFilterState";
import {
  BREAKDOWN_STAT_DEFS,
  breakdownValueColor,
  formatBreakdownValue,
} from "@/lib/analytics/statBreakdown";
import {
  matchupAlignmentReady,
  matchupFilterFromTeams,
} from "@/lib/analytics/matchup";
import { computeMatchupStats } from "@/lib/analytics/matchupStats";
import { getPlayerStats } from "@/lib/analytics/selectors";
import type { CompareLaunch } from "@/lib/analytics/datasets";
import type { OlympusExportData, PlayerStatsView } from "@/lib/analytics/types";
import { useTranslation } from "@/i18n/useTranslation";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
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

const cellValue = formatBreakdownValue;
const cellColor = breakdownValueColor;

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
  const { activeDataset, registry } = useAnalytics();
  const datasetId = activeDataset?.id ?? registry.activeDatasetId;
  const launchApplied = useRef(false);

  const playerIds = useMemo(
    () => new Set(data.players.map((player) => player.id)),
    [data.players]
  );
  const playerIdKey = useMemo(
    () => data.players.map((player) => player.id).join(","),
    [data.players]
  );

  const stored = useMemo(
    () => loadCompareUiFilters(datasetId, playerIds, modes),
    // Seed once per dataset; sanitize against players separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datasetId]
  );

  const [modeLabel, setModeLabel] = useState<string | null>(() => {
    if (initialLaunch?.modeLabel && modes.includes(initialLaunch.modeLabel)) {
      return initialLaunch.modeLabel;
    }
    if (stored.modeLabel && modes.includes(stored.modeLabel)) {
      return stored.modeLabel;
    }
    if (initialMode && modes.includes(initialMode)) return initialMode;
    return modes[0] ?? null;
  });
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    initialLaunch?.playerIds?.length
      ? [...initialLaunch.playerIds]
      : stored.selectedIds
  );
  const [teams, setTeams] = useState<Record<number, TeamSide | null>>(() =>
    initialLaunch?.teams ? { ...initialLaunch.teams } : { ...stored.teams }
  );
  const [matchupMode, setMatchupMode] = useState(() =>
    initialLaunch ? Boolean(initialLaunch.matchupMode) : stored.matchupMode
  );
  const [filtersHydratedFor, setFiltersHydratedFor] = useState<string | null>(
    null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);
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

  // Restore when switching data sets (pending H2H launch still wins once).
  useEffect(() => {
    if (initialLaunch && !launchApplied.current) {
      setFiltersHydratedFor(datasetId);
      return;
    }
    const loaded = loadCompareUiFilters(datasetId, playerIds, modes);
    setModeLabel(
      loaded.modeLabel && modes.includes(loaded.modeLabel)
        ? loaded.modeLabel
        : (modes[0] ?? null)
    );
    setSelectedIds(loaded.selectedIds);
    setTeams(loaded.teams);
    setMatchupMode(loaded.matchupMode);
    setFiltersHydratedFor(datasetId);
    // Intentionally only on dataset change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  useEffect(() => {
    if (filtersHydratedFor !== datasetId) return;
    saveCompareUiFilters({
      datasetId,
      modeLabel,
      selectedIds,
      teams,
      matchupMode,
    });
  }, [
    datasetId,
    modeLabel,
    selectedIds,
    teams,
    matchupMode,
    filtersHydratedFor,
  ]);

  // Drop picks that disappeared after import/replace.
  useEffect(() => {
    if (!playerIdKey) return;
    const validIds = new Set(playerIdKey.split(",").map((id) => Number(id)));
    setSelectedIds((current) => {
      const next = current.filter((id) => validIds.has(id));
      return next.length === current.length ? current : next;
    });
    setTeams((current) => {
      let changed = false;
      const next: Record<number, TeamSide | null> = {};
      for (const [key, value] of Object.entries(current)) {
        const id = Number(key);
        if (!validIds.has(id)) {
          changed = true;
          continue;
        }
        next[id] = value;
      }
      return changed ? next : current;
    });
  }, [playerIdKey]);

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
    setFiltersHydratedFor(datasetId);
  }, [initialLaunch, modes, players, datasetId]);

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
      BREAKDOWN_STAT_DEFS.map((def) => ({
        key: def.key,
        abbr: t(def.abbrKey),
        full: t(def.fullKey),
      })),
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
    <Box sx={dashboardShellSx}>
      <Box
        component="aside"
        sx={{
          ...dashboardAsideSx,
          p: 0,
        }}
      >
        <Box sx={{ px: 2, pt: { xs: 2.5, md: 3 }, pb: 1.5 }}>
          <Typography variant="h5" sx={{ mb: 0.25 }}>
            {t("statsCompare")}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              icon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
              label={t("statsManageData")}
              onClick={() => setDataDrawerOpen(true)}
              variant="outlined"
              clickable
            />
          </Stack>
        </Box>

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
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: { xs: "visible", md: "auto" },
            overscrollBehavior: "contain",
            px: 2,
            pb: 2,
          }}
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
          ...dashboardMainSx,
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
              <Card
                sx={{
                  overflow: "auto",
                  width: "100%",
                  maxWidth: "100%",
                  WebkitOverflowScrolling: "touch",
                }}
              >
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

      <StatsDataDrawer
        open={dataDrawerOpen}
        onClose={() => setDataDrawerOpen(false)}
      />
    </Box>
  );
}
