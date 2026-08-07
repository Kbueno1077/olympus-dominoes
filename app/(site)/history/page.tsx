"use client";

import History from "@/modules/History/History";
import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import { Box } from "@mui/material";

export default function HistoryPage() {
  return (
    <Box sx={dashboardPageSx}>
      <History />
    </Box>
  );
}
