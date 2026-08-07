"use client";

import Leaderboard from "@/modules/Analytics/Leaderboard";
import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import { Box } from "@mui/material";

export default function LeaderboardPage() {
  return (
    <Box sx={dashboardPageSx}>
      <Leaderboard />
    </Box>
  );
}
