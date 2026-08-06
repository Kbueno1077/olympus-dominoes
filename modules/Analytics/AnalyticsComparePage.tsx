"use client";

import AnalyticsCompare from "@/modules/Analytics/AnalyticsCompare";
import DatasetsPanel from "@/modules/Analytics/DatasetsPanel";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import type { CompareLaunch } from "@/lib/analytics/datasets";
import { listStatModes } from "@/lib/analytics/selectors";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * Standalone Compare Stats page — picks up a pending H2H launch if one was set.
 */
export default function AnalyticsComparePage() {
  const { t } = useTranslation();
  const { data, loading, peekPendingCompare, clearPendingCompare } =
    useAnalytics();
  const [compareLaunch, setCompareLaunch] = useState<CompareLaunch | null>(
    null
  );
  const [compareKey, setCompareKey] = useState(0);

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
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.75 }}>
              {t("statsCompare")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("compareNeedImport")}
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/stats"
            variant="contained"
            sx={{ alignSelf: "flex-start" }}
          >
            {t("historyGoAnalytics")}
          </Button>
          <DatasetsPanel />
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", width: "100%" }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {t("statsCompare")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("analyticsLoadedMeta", {
              file: data.fileName,
              players: data.players.length,
              matches: data.matches.length,
            })}
          </Typography>
        </Box>

        <DatasetsPanel />

        {modes.length === 0 ? (
          <Card sx={{ p: 3 }}>
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
      </Stack>
    </Box>
  );
}
