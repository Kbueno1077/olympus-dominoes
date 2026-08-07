"use client";

import AnalyticsCompare from "@/modules/Analytics/AnalyticsCompare";
import DashboardEmptyState from "@/modules/Analytics/DashboardEmptyState";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import type { CompareLaunch } from "@/lib/analytics/datasets";
import { listStatModes } from "@/lib/analytics/selectors";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Card, CircularProgress, Typography } from "@mui/material";
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
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <DashboardEmptyState page="compare" />;
  }

  if (modes.length === 0) {
    return (
      <Card sx={{ m: 2, p: 3 }}>
        <Typography sx={{ color: "text.secondary" }}>
          {t("statsNoData")}
        </Typography>
      </Card>
    );
  }

  return (
    <AnalyticsCompare
      key={compareKey}
      data={data}
      modes={modes}
      initialMode={compareLaunch?.modeLabel ?? modes[0] ?? null}
      initialLaunch={compareLaunch}
    />
  );
}
