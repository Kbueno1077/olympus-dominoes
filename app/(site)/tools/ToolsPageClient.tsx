"use client";

import { refreshDevGateCookie } from "@/lib/devGate/actions";
import MergeDatasets from "@/modules/Analytics/MergeDatasets";
import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";

export default function ToolsPageClient() {
  const [apiGateReady, setApiGateReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void refreshDevGateCookie("merge").finally(() => {
      if (!cancelled) setApiGateReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box sx={dashboardPageSx}>
      {apiGateReady ? <MergeDatasets /> : null}
    </Box>
  );
}
