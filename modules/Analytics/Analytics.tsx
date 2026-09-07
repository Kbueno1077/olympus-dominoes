"use client";

import StatsDashboardCharts from "@/modules/Analytics/StatsDashboardCharts";
import DashboardAside from "@/modules/Analytics/DashboardAside";
import DashboardDateRangeFilter from "@/modules/Analytics/DashboardDateRangeFilter";
import DashboardEmptyState from "@/modules/Analytics/DashboardEmptyState";
import {
  DashboardPanel,
  JOSES_ACCENT,
  MetricTile,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { useDashboardDateRange } from "@/lib/analytics/dashboardDateFilterState";
import { isDateRangeActive } from "@/lib/analytics/dateRangeFilter";
import { importErrorMessage } from "@/lib/analytics/importError";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  buildH2HCompareLaunch,
  compareLaunchToSearchParams,
} from "@/lib/analytics/compareLaunch";
import { formatJosesCoefficient } from "@/lib/analytics/joseCoefficient";
import {
  BREAKDOWN_STAT_DEFS,
  breakdownValueColor,
  formatBreakdownValue,
} from "@/lib/analytics/statBreakdown";
import { formatSignedDiff } from "@/lib/analytics/signedDiff";
import { stylePointsFromData } from "@/lib/analytics/stylePoints";
import { StylePointsLines } from "@/modules/Analytics/StylePointsLines";
import { listVisiblePlayers } from "@/lib/analytics/playerVisibility";
import { recomputeAggregatesFromMatches } from "@/lib/analytics/recomputeFromMatches";
import {
  DEFAULT_FORMAT_LABEL,
  DEFAULT_TILE_SET,
  isFormatLabel,
  isTileSet,
  type TileSet,
} from "@/lib/analytics/modeFormat";
import {
  getPlayerH2H,
  getPlayerStats,
  listLeaderboard,
} from "@/lib/analytics/selectors";
import ModeFormatFilters from "@/modules/Analytics/ModeFormatFilters";
import { ModeFormatMeta } from "@/modules/Analytics/ModeFormatMark";
import {
  clearStatsLaunch,
  peekStatsLaunch,
} from "@/lib/analytics/statsLaunch";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ComponentType,
} from "react";

const LazyCharts = dynamic(
  () => import("@/modules/Analytics/StatsDashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
        <CircularProgress size={28} />
      </Box>
    ),
  }
) as ComponentType<ComponentProps<typeof StatsDashboardCharts>>;

function StatLine({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ py: 0.45 }}
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 600,
          color: valueColor || "text.primary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default function Analytics() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    data,
    error,
    loading,
    setPendingCompare,
    activeDataset,
    registry,
  } = useAnalytics();
  const datasetId = activeDataset?.id ?? registry.activeDatasetId;
  const dateFilter = useDashboardDateRange(datasetId);
  const [modeLabel, setModeLabel] = useState<string>(DEFAULT_FORMAT_LABEL);
  const [tileSet, setTileSet] = useState<TileSet>(DEFAULT_TILE_SET);
  const [playerId, setPlayerId] = useState<number | null>(null);

  // Leaderboard (and similar) stash a player before routing here.
  useEffect(() => {
    const launch = peekStatsLaunch();
    if (!launch) return;
    if (isFormatLabel(launch.modeLabel)) setModeLabel(launch.modeLabel);
    if (isTileSet(launch.tileSet)) setTileSet(launch.tileSet);
    setPlayerId(launch.playerId);
    clearStatsLaunch();
  }, []);

  const scopedData = useMemo(() => {
    if (!data) return null;
    if (!isDateRangeActive(dateFilter.range)) return data;
    return recomputeAggregatesFromMatches(data, dateFilter.range);
  }, [data, dateFilter.range]);

  const activeMode = isFormatLabel(modeLabel)
    ? modeLabel
    : DEFAULT_FORMAT_LABEL;

  const leaderboard = useMemo(
    () =>
      scopedData ? listLeaderboard(scopedData, activeMode, tileSet) : [],
    [scopedData, activeMode, tileSet]
  );

  const selectedPlayerId = useMemo(() => {
    if (playerId && leaderboard.some((r) => r.playerId === playerId)) {
      return playerId;
    }
    return leaderboard[0]?.playerId ?? null;
  }, [playerId, leaderboard]);

  const selectedPlayer = useMemo(
    () => data?.players.find((p) => p.id === selectedPlayerId) ?? null,
    [data, selectedPlayerId]
  );

  const activeStats = useMemo(() => {
    if (!scopedData || selectedPlayerId == null || !activeMode) return null;
    return (
      getPlayerStats(scopedData, selectedPlayerId).find(
        (s) => s.modeLabel === activeMode && s.tileSet === tileSet
      ) ?? null
    );
  }, [scopedData, selectedPlayerId, activeMode, tileSet]);

  const h2h = useMemo(() => {
    if (!scopedData || selectedPlayerId == null) return [];
    return getPlayerH2H(scopedData, selectedPlayerId, activeMode, tileSet);
  }, [scopedData, selectedPlayerId, activeMode, tileSet]);

  const stylePoints = useMemo(() => {
    if (!data || selectedPlayerId == null) return null;
    return (
      stylePointsFromData(data, {
        modeLabel: activeMode,
        tileSet,
        dateRange: dateFilter.range,
      }).get(selectedPlayerId) ?? null
    );
  }, [data, selectedPlayerId, activeMode, tileSet, dateFilter.range]);

  const openH2HCompare = (opponentId: number) => {
    if (selectedPlayerId == null || !activeMode) return;
    const launch = buildH2HCompareLaunch({
      modeLabel: activeMode,
      playerId: selectedPlayerId,
      opponentId,
      tileSet,
    });
    setPendingCompare(launch);
    router.push(`/compare?${compareLaunchToSearchParams(launch).toString()}`);
  };

  const selectPlayer = (id: number) => {
    startTransition(() => setPlayerId(id));
  };

  const errorMessage = error ? importErrorMessage(t, error) : null;

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <DashboardEmptyState page="stats" errorMessage={errorMessage} />
    );
  }

  const datasetLabel = activeDataset?.displayName || data.fileName;

  return (
    <Box sx={dashboardShellSx}>
      <DashboardAside
        title={t("statsTitle")}
        filtersLabel={t("statsComparePlayers")}
      >
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Typography
            variant="overline"
            component="p"
            sx={{ color: "text.secondary", mb: 0.75 }}
          >
            {t("dashboardDateRange")}
          </Typography>
          <DashboardDateRangeFilter
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
            onStartChange={dateFilter.setStartDate}
            onEndChange={dateFilter.setEndDate}
            onClear={dateFilter.clear}
          />
        </Box>

        <Box sx={{ px: 2, pb: 1.5 }}>
          <ModeFormatFilters
            tileSet={tileSet}
            onTileSet={(next) => {
              if (isTileSet(next)) setTileSet(next);
            }}
            modeLabel={activeMode}
            onModeLabel={(next) => {
              if (isFormatLabel(next)) setModeLabel(next);
            }}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: { xs: "visible", md: "auto" },
            overscrollBehavior: { md: "contain" },
            px: 1,
            pb: 2,
            contentVisibility: "auto",
          }}
        >
          <Typography
            variant="overline"
            component="p"
            sx={{ color: "text.secondary", px: 1, mb: 0.5 }}
          >
            {t("statsLeaderboard")}
          </Typography>
          {leaderboard.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", px: 1, py: 2 }}
            >
              {t("statsNoData")}
            </Typography>
          ) : (
            <Stack>
              {leaderboard.map((row, index) => {
                const selected = row.playerId === selectedPlayerId;
                return (
                  <Box
                    key={row.playerId}
                    component="button"
                    type="button"
                    onClick={() => selectPlayer(row.playerId)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      width: "100%",
                      textAlign: "left",
                      border: 0,
                      borderBottom: "1px solid",
                      borderColor: (theme) =>
                        alpha(theme.palette.grey[600], 0.12),
                      backgroundColor: "transparent",
                      borderRadius: 0,
                      px: 1,
                      py: 1.05,
                      cursor: "pointer",
                      color: "inherit",
                      font: "inherit",
                      opacity: selected ? 1 : 0.72,
                      "&:hover": {
                        opacity: 1,
                        backgroundColor: (theme) =>
                          alpha(theme.palette.grey[700], 0.04),
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        width: 20,
                        color: "text.secondary",
                        fontVariantNumeric: "tabular-nums",
                        fontSize: 13,
                      }}
                    >
                      {index + 1}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: selected ? 600 : 500,
                          color: selected ? "text.primary" : "text.secondary",
                        }}
                        noWrap
                      >
                        {row.playerName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {t("statsRecord", {
                          wins: row.gamesWon,
                          losses: row.gamesLost,
                        })}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: selected ? 700 : 500,
                        color: selected ? JOSES_ACCENT : alpha(JOSES_ACCENT, 0.72),
                        fontVariantNumeric: "tabular-nums",
                        fontSize: 14,
                      }}
                    >
                      {formatJosesCoefficient(row.josesCoefficient)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </DashboardAside>

      {/* Main dashboard */}
      <Box component="main" sx={dashboardMainSx}>
        {errorMessage ? (
          <Typography variant="body2" sx={{ color: "error.main", mb: 2 }}>
            {errorMessage}
          </Typography>
        ) : null}

        <Stack spacing={2.5} sx={{ minWidth: 0, width: "100%", maxWidth: "100%" }}>
            {selectedPlayer && activeStats ? (
              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  sx={{ mb: 1.5 }}
                >
                  <Box>
                    <Typography variant="h5" sx={{ mb: 0.25 }}>
                      {selectedPlayer.name}
                      {selectedPlayer.is_myself ? (
                        <Typography
                          component="span"
                          variant="overline"
                          sx={{ ml: 1, color: "primary.main" }}
                        >
                          {t("youBadge")}
                        </Typography>
                      ) : null}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      <ModeFormatMeta
                        tileSet={tileSet}
                        modeLabel={activeMode}
                      />{" "}
                      ·{" "}
                      {t("analyticsLoadedMeta", {
                        name: datasetLabel,
                        players: listVisiblePlayers(data.players).length,
                        matches: data.matches.length,
                      })}
                    </Typography>
                  </Box>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(3, minmax(0, 1fr))",
                      lg: "repeat(6, minmax(0, 1fr))",
                    },
                    gap: 1,
                  }}
                >
                  <MetricTile
                    label={t("statsJosesCoefficient")}
                    value={formatJosesCoefficient(activeStats.josesCoefficient)}
                    valueColor={JOSES_ACCENT}
                  />
                  <MetricTile
                    label={t("statsStreak")}
                    value={`${activeStats.gamesWon}–${activeStats.gamesLost}`}
                  />
                  <MetricTile
                    label={t("statsAbbrGamesPlayed")}
                    value={activeStats.gamesPlayed}
                  />
                  <MetricTile
                    label={t("statsAbbrGameDifference")}
                    value={formatSignedDiff(
                      activeStats.gamesWon - activeStats.gamesLost
                    )}
                    valueColor={
                      activeStats.gamesWon - activeStats.gamesLost < 0
                        ? "error.main"
                        : "primary.main"
                    }
                  />
                  <MetricTile
                    label={t("statsAbbrHandsTotal")}
                    value={activeStats.handsPlayed}
                  />
                  <MetricTile
                    label={t("statsAbbrHandsDifference")}
                    value={formatSignedDiff(
                      activeStats.handsWon - activeStats.handsLost
                    )}
                    valueColor={
                      activeStats.handsWon - activeStats.handsLost < 0
                        ? "error.main"
                        : "primary.main"
                    }
                  />
                </Box>
              </Box>
            ) : null}

            <LazyCharts
              leaderboard={leaderboard}
              activeStats={activeStats}
              playerName={selectedPlayer?.name ?? null}
              t={t}
            />

            {selectedPlayer && activeStats ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "minmax(0, 1.2fr) minmax(0, 1fr)",
                  },
                }}
              >
                <DashboardPanel title={t("statsDetailTitle")}>
                  {BREAKDOWN_STAT_DEFS.map((def) => {
                    const value = formatBreakdownValue(activeStats, def.key);
                    const valueColor =
                      def.key === "josesCoefficient"
                        ? JOSES_ACCENT
                        : breakdownValueColor(activeStats, def.key);
                    return (
                      <StatLine
                        key={def.key}
                        label={t(def.fullKey)}
                        value={value}
                        valueColor={valueColor}
                      />
                    );
                  })}
                </DashboardPanel>

                <DashboardPanel
                  title={t("statsH2HTitle")}
                  hint={t("statsH2HCompareHint")}
                >
                  {h2h.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {t("statsNoData")}
                    </Typography>
                  ) : (
                    <Stack>
                      {h2h.map((row) => (
                        <Box
                          key={`${row.opponentId}-${row.modeLabel}`}
                          component="button"
                          type="button"
                          onClick={() => openH2HCompare(row.opponentId)}
                          sx={{
                            py: 1,
                            px: 0.5,
                            border: 0,
                            borderTop: "1px solid",
                            borderColor: "divider",
                            background: "transparent",
                            textAlign: "left",
                            cursor: "pointer",
                            color: "inherit",
                            font: "inherit",
                            borderRadius: 1,
                            "&:hover": {
                              backgroundColor: (theme) =>
                                alpha(theme.palette.primary.main, 0.06),
                            },
                          }}
                        >
                          <Typography sx={{ fontWeight: 600 }}>
                            {row.opponentName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {t("statsH2HRecord", {
                              total: row.wins + row.losses,
                              wins: row.wins,
                              losses: row.losses,
                            })}
                            {row.winPct != null
                              ? ` · ${t("statsWinPct", {
                                  pct: Math.round(row.winPct * 100),
                                })}`
                              : ""}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </DashboardPanel>
              </Box>
            ) : null}

            {selectedPlayer && activeStats ? (
              <DashboardPanel title={t("statsStylePointsTitle")}>
                <StylePointsLines points={stylePoints} />
              </DashboardPanel>
            ) : null}
          </Stack>
      </Box>
    </Box>
  );
}
