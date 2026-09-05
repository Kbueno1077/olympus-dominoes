"use client";

import { dashboardPageSx } from "@/modules/Analytics/dashboardChrome";
import JoseLab from "@/modules/JoseLab/JoseLab";
import { Box } from "@mui/material";

export default function FLabPageClient() {
  return (
    <Box sx={dashboardPageSx}>
      <JoseLab />
    </Box>
  );
}
