"use client";

import AnalyticsComparePage from "@/modules/Analytics/AnalyticsComparePage";
import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import { Box } from "@mui/material";

export default function ComparePage() {
  return (
    <Box sx={dashboardPageSx}>
      <AnalyticsComparePage />
    </Box>
  );
}
