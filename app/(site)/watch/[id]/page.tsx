"use client";

import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import LiveWatchClient from "@/modules/LiveWatch/LiveWatchClient";
import { Box } from "@mui/material";

export default function WatchPage() {
  return (
    <Box sx={dashboardPageSx}>
      <LiveWatchClient />
    </Box>
  );
}
