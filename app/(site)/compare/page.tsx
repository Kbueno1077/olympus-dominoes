"use client";

import AnalyticsComparePage from "@/modules/Analytics/AnalyticsComparePage";
import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";

export default function ComparePage() {
  return (
    <Box sx={dashboardPageSx}>
      <Suspense
        fallback={
          <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
            <CircularProgress />
          </Box>
        }
      >
        <AnalyticsComparePage />
      </Suspense>
    </Box>
  );
}
