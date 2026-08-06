"use client";

import Analytics from "@/modules/Analytics/Analytics";
import { Box } from "@mui/material";

export default function StatsPage() {
  return (
    <Box
      sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1.5, sm: 3, md: 4, lg: 5 },
      }}
    >
      <Analytics />
    </Box>
  );
}
