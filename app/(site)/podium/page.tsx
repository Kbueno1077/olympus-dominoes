"use client";

import Podium from "@/modules/Analytics/Podium";
import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import { Box } from "@mui/material";

export default function PodiumPage() {
  return (
    <Box sx={dashboardPageSx}>
      <Podium />
    </Box>
  );
}
