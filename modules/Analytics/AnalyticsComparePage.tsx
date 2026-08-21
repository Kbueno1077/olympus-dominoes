"use client";

import AnalyticsCompare from "@/modules/Analytics/AnalyticsCompare";
import DashboardEmptyState from "@/modules/Analytics/DashboardEmptyState";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  compareLaunchFromQueryString,
  peekCompareLaunch,
} from "@/lib/analytics/compareLaunch";
import type { CompareLaunch } from "@/lib/analytics/datasets";
import { listStatModes } from "@/lib/analytics/selectors";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Card, CircularProgress, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/**
 * Standalone Compare Stats page — prefills from the URL (H2H) or a pending launch.
 */
export default function AnalyticsComparePage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const { data, loading, peekPendingCompare, clearPendingCompare } =
    useAnalytics();

  const urlLaunch = useMemo(() => {
    return (
      compareLaunchFromQueryString(searchKey) ??
      (typeof window === "undefined"
        ? null
        : compareLaunchFromQueryString(window.location.search))
    );
  }, [searchKey]);
  const [stickyLaunch, setStickyLaunch] = useState<CompareLaunch | null>(
    () => peekCompareLaunch()
  );

  useEffect(() => {
    if (urlLaunch) {
      clearPendingCompare();
      return;
    }
    const launch = peekPendingCompare();
    if (!launch) return;
    setStickyLaunch(launch);
    const handle = window.setTimeout(() => clearPendingCompare(), 0);
    return () => window.clearTimeout(handle);
  }, [urlLaunch, peekPendingCompare, clearPendingCompare]);

  const compareLaunch = urlLaunch ?? stickyLaunch;
  const compareKey = compareLaunch?.playerIds.length
    ? compareLaunch.playerIds.join(",")
    : "stored";

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
