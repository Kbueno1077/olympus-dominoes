"use client";

import DashboardAside from "@/modules/Analytics/DashboardAside";
import DashboardEmptyState from "@/modules/Analytics/DashboardEmptyState";
import {
  JOSES_ACCENT,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { importErrorMessage } from "@/lib/analytics/importError";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { formatJosesCoefficient } from "@/lib/analytics/joseCoefficient";
import {
  DEFAULT_FORMAT_LABEL,
  DEFAULT_TILE_SET,
  isFormatLabel,
  isTileSet,
  type TileSet,
} from "@/lib/analytics/modeFormat";
import { listLeaderboard } from "@/lib/analytics/selectors";
import ModeFormatFilters from "@/modules/Analytics/ModeFormatFilters";
import { stashStatsLaunch } from "@/lib/analytics/statsLaunch";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

/**
 * Full-page ranking by Jose's Coefficient. Row click opens Stats for that player.
 */
export default function Leaderboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, error, loading, activeDataset } = useAnalytics();
  const [modeLabel, setModeLabel] = useState<string>(DEFAULT_FORMAT_LABEL);
  const [tileSet, setTileSet] = useState<TileSet>(DEFAULT_TILE_SET);

  const activeMode = isFormatLabel(modeLabel)
    ? modeLabel
    : DEFAULT_FORMAT_LABEL;

  const leaderboard = useMemo(
    () => (data ? listLeaderboard(data, activeMode, tileSet) : []),
    [data, activeMode, tileSet]
  );

  const errorMessage = error ? importErrorMessage(t, error) : null;

  const openPlayerStats = (playerId: number) => {
    if (!activeMode) return;
    stashStatsLaunch({ modeLabel: activeMode, playerId, tileSet });
    router.push("/stats");
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <DashboardEmptyState page="leaderboard" errorMessage={errorMessage} />
    );
  }

  const datasetLabel = activeDataset?.displayName || data.fileName;

  return (
    <Box sx={dashboardShellSx}>
        <DashboardAside
          title={t("leaderboardTitle")}
          subtitle={t("leaderboardSubtitle")}
          filtersLabel={t("modeFormatTitle")}
        >
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
        </DashboardAside>

        <Box component="main" sx={dashboardMainSx}>
          {errorMessage ? (
            <Typography variant="body2" sx={{ color: "error.main", mb: 2 }}>
              {errorMessage}
            </Typography>
          ) : null}

          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 1.5 }}
          >
            {t("dashboardViewingDataset", { name: datasetLabel })}
            {" · "}
            {t("leaderboardOpenStatsHint")}
          </Typography>

          {leaderboard.length === 0 ? (
            <Typography sx={{ color: "text.secondary" }}>
              {t("statsNoData")}
            </Typography>
          ) : (
            <Stack
              sx={{
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.grey[600], 0.16),
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: (theme) =>
                  alpha(theme.palette.common.white, 0.35),
              }}
            >
              {leaderboard.map((row, index) => (
                <Box
                  key={row.playerId}
                  component="button"
                  type="button"
                  onClick={() => openPlayerStats(row.playerId)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    width: "100%",
                    textAlign: "left",
                    border: 0,
                    borderBottom:
                      index < leaderboard.length - 1 ? "1px solid" : 0,
                    borderColor: (theme) =>
                      alpha(theme.palette.grey[600], 0.12),
                    backgroundColor: "transparent",
                    borderRadius: 0,
                    px: { xs: 1.5, sm: 2 },
                    py: 1.35,
                    cursor: "pointer",
                    color: "inherit",
                    font: "inherit",
                    "&:hover": {
                      backgroundColor: (theme) =>
                        alpha(theme.palette.grey[700], 0.05),
                    },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: -2,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      width: 28,
                      flexShrink: 0,
                      color: "text.secondary",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {index + 1}
                  </Typography>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      sx={{ minWidth: 0 }}
                    >
                      <Typography
                        sx={{ fontWeight: row.isMyself ? 700 : 600 }}
                        noWrap
                      >
                        {row.playerName}
                      </Typography>
                      {row.isMyself ? (
                        <Chip
                          size="small"
                          label={t("youBadge")}
                          sx={{
                            height: 20,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        />
                      ) : null}
                    </Stack>
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
                      fontWeight: 700,
                      color: JOSES_ACCENT,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {formatJosesCoefficient(row.josesCoefficient)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
  );
}
