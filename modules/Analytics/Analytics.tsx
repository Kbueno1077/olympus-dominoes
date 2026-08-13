"use client";

import StatsDashboardCharts from "@/modules/Analytics/StatsDashboardCharts";
import StatsDataDrawer from "@/modules/Analytics/StatsDataDrawer";
import DashboardAside from "@/modules/Analytics/DashboardAside";
import DashboardEmptyState from "@/modules/Analytics/DashboardEmptyState";
import {
  DashboardPanel,
  JOSES_ACCENT,
  MetricTile,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { buildH2HCompareLaunch } from "@/lib/analytics/compareLaunch";
import { formatJosesCoefficient } from "@/lib/analytics/joseCoefficient";
import {
  BREAKDOWN_STAT_DEFS,
  breakdownValueColor,
  formatBreakdownValue,
} from "@/lib/analytics/statBreakdown";
import { formatSignedDiff } from "@/lib/analytics/signedDiff";
import {
  getPlayerH2H,
  getPlayerStats,
  listLeaderboard,
  listStatModes,
} from "@/lib/analytics/selectors";
import {
  clearStatsLaunch,
  peekStatsLaunch,
} from "@/lib/analytics/statsLaunch";
import { useTranslation } from "@/i18n/useTranslation";
import useToast from "@/hooks/useToast";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SyncIcon from "@mui/icons-material/Sync";
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
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
  const { t, modeName } = useTranslation();
  const displayToast = useToast();
  const router = useRouter();
  const {
    data,
    error,
    loading,
    syncJosesCoefficients,
    setPendingCompare,
    activeDataset,
  } = useAnalytics();
  const [syncingCoef, setSyncingCoef] = useState(false);
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);
  const [modeLabel, setModeLabel] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);

  // Leaderboard (and similar) stash a player before routing here.
  useEffect(() => {
    const launch = peekStatsLaunch();
    if (!launch) return;
    setModeLabel(launch.modeLabel);
    setPlayerId(launch.playerId);
    clearStatsLaunch();
  }, []);

  const modes = useMemo(
    () => (data ? listStatModes(data) : []),
    [data]
  );

  const activeMode = useMemo(() => {
    if (modeLabel && modes.includes(modeLabel)) return modeLabel;
    return modes[0] ?? null;
  }, [modeLabel, modes]);

  const leaderboard = useMemo(
    () => (data && activeMode ? listLeaderboard(data, activeMode) : []),
    [data, activeMode]
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
    if (!data || selectedPlayerId == null || !activeMode) return null;
    return (
      getPlayerStats(data, selectedPlayerId).find(
        (s) => s.modeLabel === activeMode
      ) ?? null
    );
  }, [data, selectedPlayerId, activeMode]);

  const h2h = useMemo(() => {
    if (!data || selectedPlayerId == null || !activeMode) return [];
    return getPlayerH2H(data, selectedPlayerId, activeMode);
  }, [data, selectedPlayerId, activeMode]);

  const handleSyncJoses = () => {
    setSyncingCoef(true);
    try {
      syncJosesCoefficients();
      displayToast(t("toastJosesSynced"), "success");
    } catch (err) {
      console.error("syncJosesCoefficients failed", err);
      displayToast(t("toastJosesSyncFailed"), "error");
    } finally {
      setSyncingCoef(false);
    }
  };

  const openH2HCompare = (opponentId: number) => {
    if (selectedPlayerId == null || !activeMode) return;
    setPendingCompare(
      buildH2HCompareLaunch({
        modeLabel: activeMode,
        playerId: selectedPlayerId,
        opponentId,
      })
    );
    router.push("/compare");
  };

  const selectPlayer = (id: number) => {
    startTransition(() => setPlayerId(id));
  };

  const errorMessage = (() => {
    const code = error;
    if (!code) return null;
    if (code.startsWith("unknown_table:")) return t("analyticsErrorUnknownTable");
    if (code === "empty_export") return t("analyticsErrorEmpty");
    if (code === "unknown_format") return t("analyticsErrorFormat");
    if (code === "sql_unsupported") return t("analyticsErrorSqlUnsupported");
    if (code === "schema_too_new") return t("analyticsErrorSchemaTooNew");
    if (code === "schema_too_old") return t("analyticsErrorSchemaTooOld");
    return t("analyticsErrorGeneric");
  })();

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
        toolbar={
          <>
            <Chip
              size="small"
              icon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
              label={t("statsManageData")}
              onClick={() => setDataDrawerOpen(true)}
              variant="outlined"
              clickable
            />
            <Chip
              size="small"
              icon={<SyncIcon sx={{ fontSize: 16 }} />}
              label={t("syncJosesCoefficientShort")}
              onClick={handleSyncJoses}
              disabled={syncingCoef}
              variant="outlined"
              clickable
            />
          </>
        }
      >
        {modes.length > 0 ? (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Typography
              variant="overline"
              component="p"
              sx={{ color: "text.secondary", mb: 0.75 }}
            >
              {t("format")}
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              fullWidth
              value={activeMode}
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
          </Box>
        ) : null}

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

        {modes.length === 0 ? (
          <Card sx={{ p: 3 }}>
            <Typography sx={{ color: "text.secondary" }}>
              {t("statsNoData")}
            </Typography>
          </Card>
        ) : (
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
                      {modeName(activeMode ?? "")} ·{" "}
                      {t("analyticsLoadedMeta", {
                        name: datasetLabel,
                        players: data.players.length,
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
          </Stack>
        )}
      </Box>

      <StatsDataDrawer
        open={dataDrawerOpen}
        onClose={() => setDataDrawerOpen(false)}
      />
    </Box>
  );
}
