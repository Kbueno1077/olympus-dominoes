"use client";

import MergeDatasets from "@/modules/Analytics/MergeDatasets";
import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import { Box } from "@mui/material";

export default function MergePageClient() {
  return (
    <Box sx={dashboardPageSx}>
      <MergeDatasets />
    </Box>
  );
}
