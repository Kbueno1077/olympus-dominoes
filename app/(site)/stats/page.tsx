"use client";

import Analytics from "@/modules/Analytics/Analytics";
import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import { Box } from "@mui/material";

export default function StatsPage() {
  return (
    <Box sx={dashboardPageSx}>
      <Analytics />
    </Box>
  );
}
