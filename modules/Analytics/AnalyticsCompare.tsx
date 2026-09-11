"use client";

import AnalyticsCompareCharts from "@/modules/Analytics/AnalyticsCompareCharts";
import DashboardAside from "@/modules/Analytics/DashboardAside";
import DashboardDateRangeFilter from "@/modules/Analytics/DashboardDateRangeFilter";
import PlayerPickDialog from "@/modules/Analytics/PlayerPickDialog";
import {
  ControlSection,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  loadCompareUiFilters,
  saveCompareUiFilters,
} from "@/lib/analytics/compareFilterState";
import { compareLaunchFromQueryString } from "@/lib/analytics/compareLaunch";
import { useDashboardDateRange } from "@/lib/analytics/dashboardDateFilterState";
import { isDateRangeActive } from "@/lib/analytics/dateRangeFilter";
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
import { listVisiblePlayers } from "@/lib/analytics/playerVisibility";
import {
  ALL_FORMAT_LABELS,
  DEFAULT_FORMAT_LABEL,
  DEFAULT_TILE_SET,
  TILE_SET_OPTIONS,
  isFormatLabel,
  isTileSet,
  type TileSet,
} from "@/lib/analytics/modeFormat";
import { getPlayerStats } from "@/lib/analytics/selectors";
import {
  STYLE_POINT_IDS,
  STYLE_POINT_LABEL_KEY,
  formatStylePoint,
  stylePointsFromData,
} from "@/lib/analytics/stylePoints";
import type { CompareLaunch } from "@/lib/analytics/datasets";
import type { OlympusExportData, PlayerStatsView } from "@/lib/analytics/types";
import ModeFormatFilters from "@/modules/Analytics/ModeFormatFilters";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_COMPARE = 10;
const SIDE_A = "#2F6F9F";
const SIDE_B = "#B8453A";
const SIDE_ANY = "rgba(95, 83, 65, 0.45)";

function launchFromLocation(): CompareLaunch | null {
  if (typeof window === "undefined") return null;
  return compareLaunchFromQueryString(window.location.search);
}

function prefillKey(launch: CompareLaunch | null): string {
  if (!launch?.playerIds.length) return "";
  return `${launch.playerIds.join(",")}::${launch.modeLabel ?? ""}::${launch.tileSet ?? ""}`;
}

type TeamSide = 1 | 2 | null;

const cellValue = formatBreakdownValue;
const cellColor = breakdownValueColor;

function seedMatchupTeams(
  selectedIds: number[],
  current: Record<number, TeamSide>
): Record<number, TeamSide> {
  const next = { ...current };
  for (const id of selectedIds) {
    if (next[id] === undefined) next[id] = null;
  }
  return next;
}

type Props = {
  data: OlympusExportData;
  initialMode?: string | null;
  initialLaunch?: CompareLaunch | null;
};

export default function AnalyticsCompare({
  data,
  initialMode,
  initialLaunch = null,
}: Props) {
  const { t } = useTranslation();
  const { activeDataset, registry } = useAnalytics();
  const datasetId = activeDataset?.id ?? registry.activeDatasetId;
  const dateFilter = useDashboardDateRange(datasetId);
  const dateRangeActive = isDateRangeActive(dateFilter.range);
  const appliedPrefillKey = useRef("");
  const launchKey = prefillKey(launchFromLocation() ?? initialLaunch);

  const visiblePlayers = useMemo(
    () => listVisiblePlayers(data.players),
    [data.players]
  );
  const playerIds = useMemo(
    () => new Set(visiblePlayers.map((player) => player.id)),
    [visiblePlayers]
  );
  const playerIdKey = useMemo(
    () => visiblePlayers.map((player) => player.id).join(","),
    [visiblePlayers]
  );

  const stored = useMemo(
    () =>
      loadCompareUiFilters(
        datasetId,
        playerIds,
        ALL_FORMAT_LABELS,
        TILE_SET_OPTIONS
      ),
    // Seed once per dataset; sanitize against players separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datasetId]
  );

  const [tileSet, setTileSet] = useState<TileSet>(() => {
    const launch = launchFromLocation() ?? initialLaunch;
    if (isTileSet(launch?.tileSet)) return launch.tileSet;
    if (isTileSet(stored.tileSet)) return stored.tileSet;
    return DEFAULT_TILE_SET;
  });

  const [modeLabel, setModeLabel] = useState<string>(() => {
    const launch = launchFromLocation() ?? initialLaunch;
    if (isFormatLabel(launch?.modeLabel)) return launch.modeLabel;
    if (isFormatLabel(stored.modeLabel)) return stored.modeLabel;
    if (isFormatLabel(initialMode)) return initialMode;
    return DEFAULT_FORMAT_LABEL;
  });
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    const launch = launchFromLocation() ?? initialLaunch;
    return launch?.playerIds?.length
      ? [...launch.playerIds]
      : stored.selectedIds;
  });
  const [teams, setTeams] = useState<Record<number, TeamSide>>(() => {
    const launch = launchFromLocation() ?? initialLaunch;
    return launch?.teams ? { ...launch.teams } : { ...stored.teams };
  });
  const [matchupMode, setMatchupMode] = useState(() => {
    const launch = launchFromLocation() ?? initialLaunch;
    return launch ? Boolean(launch.matchupMode) : stored.matchupMode;
  });
  const [filtersHydratedFor, setFiltersHydratedFor] = useState<string | null>(
    null
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

  const players = visiblePlayers;
  const alignmentReady = matchupAlignmentReady(selectedIds, teams);
  const scanFromMatches = matchupMode || dateRangeActive;

  // URL (H2H) and pending launch win over saved Compare picks. Apply once per pair.
  useEffect(() => {
    const launch = launchFromLocation() ?? initialLaunch;
    const key = prefillKey(launch);
    const stamped = key ? `${datasetId}:${key}` : `${datasetId}:stored`;
    if (appliedPrefillKey.current === stamped) return;
    appliedPrefillKey.current = stamped;

    if (key && launch) {
      setSelectedIds([...launch.playerIds]);
      setTeams(launch.teams ?? {});
      setMatchupMode(Boolean(launch.matchupMode));
      if (isTileSet(launch.tileSet)) setTileSet(launch.tileSet);
      if (isFormatLabel(launch.modeLabel)) setModeLabel(launch.modeLabel);
      setFiltersHydratedFor(datasetId);
      return;
    }

    const loaded = loadCompareUiFilters(
      datasetId,
      playerIds,
      ALL_FORMAT_LABELS,
      TILE_SET_OPTIONS
    );
    setTileSet(isTileSet(loaded.tileSet) ? loaded.tileSet : DEFAULT_TILE_SET);
    setModeLabel(
      isFormatLabel(loaded.modeLabel) ? loaded.modeLabel : DEFAULT_FORMAT_LABEL
    );
    setSelectedIds(loaded.selectedIds);
    setTeams(loaded.teams);
    setMatchupMode(loaded.matchupMode);
    setFiltersHydratedFor(datasetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, launchKey]);

  useEffect(() => {
    if (filtersHydratedFor !== datasetId) return;
    saveCompareUiFilters({
      datasetId,
      modeLabel,
      tileSet,
      selectedIds,
      teams,
      matchupMode,
    });
  }, [
    datasetId,
    modeLabel,
    tileSet,
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
      const next: Record<number, TeamSide> = {};
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
    if (!scanFromMatches) {
      setMatchupByPlayer({});
      setMatchupMeta(null);
      setMatchupLoading(false);
      return;
    }
    if (modeLabel == null || selectedIds.length === 0) {
      setMatchupByPlayer({});
      setMatchupMeta(null);
      setMatchupLoading(false);
      return;
    }
    if (matchupMode && !alignmentReady) {
      setMatchupByPlayer({});
      setMatchupMeta(null);
      setMatchupLoading(false);
      return;
    }

    setMatchupLoading(true);
    // Defer so the loading card paints before a heavy scan.
    const handle = window.setTimeout(() => {
      try {
        const filter = matchupMode
          ? matchupFilterFromTeams(selectedIds, teams)
          : { players: [] };
        const result = computeMatchupStats({
          data,
          filter,
          modeLabel,
          tileSet,
          playerIds: selectedIds,
          dateRange: dateFilter.range,
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
  }, [
    scanFromMatches,
    matchupMode,
    alignmentReady,
    modeLabel,
    tileSet,
    selectedIds,
    teams,
    data,
    dateFilter.range,
  ]);

  const selectedPlayers = useMemo(
    () =>
      selectedIds
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is (typeof players)[number] => p != null),
    [players, selectedIds]
  );

  const styleByPlayerId = useMemo(() => {
    if (selectedIds.length === 0 || !modeLabel) {
      return new Map();
    }
    if (matchupMode && !alignmentReady) {
      return new Map();
    }
    return stylePointsFromData(data, {
      modeLabel,
      tileSet,
      dateRange: dateFilter.range,
      matchup: matchupMode
        ? matchupFilterFromTeams(selectedIds, teams)
        : null,
    });
  }, [
    data,
    selectedIds,
    modeLabel,
    tileSet,
    dateFilter.range,
    matchupMode,
    alignmentReady,
    teams,
  ]);

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
      if (!matchupMode && current.length >= MAX_COMPARE) return current;
      setTeams((prev) => ({
        ...prev,
        [playerId]: null,
      }));
      return [...current, playerId];
    });
  };

  const setPlayerTeam = (playerId: number, team: TeamSide) => {
    setTeams((prev) => ({ ...prev, [playerId]: team }));
  };

  const statsForPlayer = (playerId: number): PlayerStatsView | null => {
    if (scanFromMatches) {
      return matchupByPlayer[playerId] ?? null;
    }
    if (!modeLabel) return null;
    return (
      getPlayerStats(data, playerId).find(
        (s) => s.modeLabel === modeLabel && s.tileSet === tileSet
      ) ??
      null
    );
  };

  const showTable =
    selectedPlayers.length > 0 &&
    (!scanFromMatches ||
      ((matchupMode ? alignmentReady : true) && !matchupLoading));

  return (
    <Box sx={dashboardShellSx}>
      <DashboardAside
        title={t("statsCompare")}
        filtersLabel={t("statsComparePlayers")}
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
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: { xs: "visible", md: "auto" },
            overscrollBehavior: { md: "contain" },
            px: 2,
            pb: 2,
          }}
        >
        <ControlSection label={t("dashboardDateRange")}>
          <DashboardDateRangeFilter
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
            onStartChange={dateFilter.setStartDate}
            onEndChange={dateFilter.setEndDate}
            onClear={dateFilter.clear}
          />
        </ControlSection>

        <ModeFormatFilters
          tileSet={tileSet}
          onTileSet={(next) => {
            if (isTileSet(next)) setTileSet(next);
          }}
          modeLabel={modeLabel}
          onModeLabel={(next) => {
            if (isFormatLabel(next)) setModeLabel(next);
          }}
        />

        <ControlSection
          label={t("statsComparePlayers")}
          hint={matchupMode ? undefined : t("statsCompareHint")}
        >
          {selectedPlayers.length === 0 ? null : matchupMode ? (
            <Stack spacing={1} sx={{ mb: 1.5 }}>
              {selectedPlayers.map((player) => (
                <Box
                  key={player.id}
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: (theme) =>
                      alpha(theme.palette.grey[600], 0.14),
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 0.85 }}
                  >
                    <Typography
                      sx={{ fontWeight: 600, fontSize: 14 }}
                      title={player.name}
                      noWrap
                    >
                      {player.name}
                    </Typography>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => togglePlayer(player.id)}
                      aria-label={t("statsCompareRemove", {
                        name: player.name,
                      })}
                      sx={{
                        minWidth: 0,
                        px: 0.75,
                        color: "text.secondary",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    {(
                      [
                        {
                          value: null as TeamSide,
                          label: t("historyFilterAnySide"),
                          activeBorder: SIDE_ANY,
                          activeBg: "rgba(95, 83, 65, 0.1)",
                          activeColor: "text.primary",
                          ariaKey: "historyFilterAnySide" as const,
                        },
                        {
                          value: 1 as TeamSide,
                          label: t("historyFilterSideA"),
                          activeBorder: SIDE_A,
                          activeBg: alpha(SIDE_A, 0.14),
                          activeColor: SIDE_A,
                          ariaKey: "statsMatchupTeamA" as const,
                        },
                        {
                          value: 2 as TeamSide,
                          label: t("historyFilterSideB"),
                          activeBorder: SIDE_B,
                          activeBg: alpha(SIDE_B, 0.14),
                          activeColor: SIDE_B,
                          ariaKey: "statsMatchupTeamB" as const,
                        },
                      ] as const
                    ).map((option) => {
                      const selected = (teams[player.id] ?? null) === option.value;
                      return (
                        <Button
                          key={String(option.value)}
                          size="small"
                          variant="outlined"
                          aria-label={t(option.ariaKey)}
                          aria-pressed={selected}
                          onClick={() =>
                            setPlayerTeam(player.id, option.value)
                          }
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            px: 0.5,
                            py: 0.35,
                            fontSize: 12,
                            fontWeight: selected ? 700 : 500,
                            borderColor: selected
                              ? option.activeBorder
                              : (theme) =>
                                  alpha(theme.palette.grey[600], 0.22),
                            backgroundColor: selected
                              ? option.activeBg
                              : "transparent",
                            color: selected
                              ? option.activeColor
                              : "text.secondary",
                            "&:hover": {
                              borderColor: option.activeBorder,
                              backgroundColor: option.activeBg,
                            },
                          }}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </Stack>
                </Box>
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

          <Button
            variant="outlined"
            fullWidth
            onClick={() => setPickerOpen(true)}
          >
            {t("statsComparePick")}
          </Button>

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

        <ControlSection
          label={t("statsMatchupToggle")}
          hint={t("statsMatchupHint")}
          trailing={
            <Switch
              checked={matchupMode}
              onChange={(_, checked) => {
                setMatchupMode(checked);
                if (checked) {
                  setTeams((prev) => seedMatchupTeams(selectedIds, prev));
                }
              }}
              color="primary"
            />
          }
        />
        </Stack>
      </DashboardAside>

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
      ) : scanFromMatches && matchupLoading ? (
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
            <Card
              sx={{
                overflow: "auto",
                width: "100%",
                maxWidth: "100%",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Box sx={{ px: 1.5, pt: 1.5, pb: 0.75 }}>
                <Typography
                  variant="overline"
                  component="p"
                  sx={{ color: "text.secondary", mb: 0.35 }}
                >
                  {t("statsStylePointsTitle")}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  {t("statsStylePointsHint")}
                </Typography>
              </Box>
              <Box
                component="table"
                sx={{
                  borderCollapse: "collapse",
                  minWidth: 220 + selectedPlayers.length * 88,
                  width: "100%",
                }}
              >
                <thead>
                  <tr>
                    <Box
                      component="th"
                      sx={{
                        minWidth: 180,
                        px: 1.5,
                        py: 1.25,
                        textAlign: "left",
                        borderBottom: "1px solid",
                        borderTop: "1px solid",
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
                          borderTop: "1px solid",
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
                  {STYLE_POINT_IDS.map((id, index) => (
                    <Box
                      component="tr"
                      key={id}
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
                        title={t(STYLE_POINT_LABEL_KEY[id])}
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
                        {t(STYLE_POINT_LABEL_KEY[id])}
                      </Box>
                      {selectedPlayers.map((player) => (
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
                          }}
                        >
                          {formatStylePoint(
                            id,
                            styleByPlayerId.get(player.id)?.[id] ?? null
                          )}
                        </Box>
                      ))}
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

      <PlayerPickDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        players={players}
        selectedIds={selectedIds}
        onToggle={togglePlayer}
        disableUnselected={!matchupMode && selectedIds.length >= MAX_COMPARE}
      />
    </Box>
  );
}
