"use client";

import AnalyticsCompare from "@/modules/Analytics/AnalyticsCompare";
import DashboardEmptyState from "@/modules/Analytics/DashboardEmptyState";
import StatsDataDrawer from "@/modules/Analytics/StatsDataDrawer";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import type { CompareLaunch } from "@/lib/analytics/datasets";
import { listStatModes } from "@/lib/analytics/selectors";
import { useTranslation } from "@/i18n/useTranslation";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * Standalone Compare Stats page — picks up a pending H2H launch if one was set.
 */
export default function AnalyticsComparePage() {
  const { t } = useTranslation();
  const {
    data,
    loading,
    peekPendingCompare,
    clearPendingCompare,
    activeDataset,
  } = useAnalytics();
  const [compareLaunch, setCompareLaunch] = useState<CompareLaunch | null>(
    null
  );
  const [compareKey, setCompareKey] = useState(0);
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);

  useEffect(() => {
    const launch = peekPendingCompare();
    if (!launch) return;
    setCompareLaunch(launch);
    setCompareKey((k) => k + 1);
    clearPendingCompare();
  }, [peekPendingCompare, clearPendingCompare]);

  const modes = useMemo(() => (data ? listStatModes(data) : []), [data]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <DashboardEmptyState page="compare" />;
  }

  const datasetLabel = activeDataset?.displayName || data.fileName;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
        overflow: { md: "hidden" },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          flexShrink: 0,
          px: { xs: 1.5, sm: 2.5 },
          pt: { xs: 2.5, md: 3 },
          pb: 1.75,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.75),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ mb: 0.25 }}>
            {t("statsCompare")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary" }}
            noWrap
            title={datasetLabel}
          >
            {t("analyticsLoadedMeta", {
              name: datasetLabel,
              players: data.players.length,
              matches: data.matches.length,
            })}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            icon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
            label={t("statsManageData")}
            onClick={() => setDataDrawerOpen(true)}
            variant="outlined"
            clickable
          />
          <Button component={Link} href="/stats" size="small" variant="outlined">
            {t("statsBack")}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {modes.length === 0 ? (
          <Card sx={{ m: 2, p: 3 }}>
            <Typography sx={{ color: "text.secondary" }}>
              {t("statsNoData")}
            </Typography>
          </Card>
        ) : (
          <AnalyticsCompare
            key={compareKey}
            data={data}
            modes={modes}
            initialMode={compareLaunch?.modeLabel ?? modes[0] ?? null}
            initialLaunch={compareLaunch}
          />
        )}
      </Box>

      <StatsDataDrawer
        open={dataDrawerOpen}
        onClose={() => setDataDrawerOpen(false)}
      />
    </Box>
  );
}
