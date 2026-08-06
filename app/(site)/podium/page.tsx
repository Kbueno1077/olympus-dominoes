"use client";

import Podium from "@/modules/Analytics/Podium";
import { Box } from "@mui/material";

export default function PodiumPage() {
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
      <Podium />
    </Box>
  );
}
