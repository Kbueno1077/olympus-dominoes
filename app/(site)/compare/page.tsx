"use client";

import AnalyticsComparePage from "@/modules/Analytics/AnalyticsComparePage";
import { Box } from "@mui/material";

export default function ComparePage() {
  return (
    <Box
      sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1.5, sm: 3, md: 4, lg: 5 },
      }}
    >
      <AnalyticsComparePage />
    </Box>
  );
}
