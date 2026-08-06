"use client";

import Analytics from "@/modules/Analytics/Analytics";
import { Box } from "@mui/material";

export default function StatsPage() {
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
      <Analytics />
    </Box>
  );
}
