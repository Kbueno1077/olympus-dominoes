"use client";

import AnalyticsComparePage from "@/modules/Analytics/AnalyticsComparePage";
import { Box } from "@mui/material";

export default function ComparePage() {
  return (
    <Box
      sx={{
        width: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <AnalyticsComparePage />
    </Box>
  );
}
