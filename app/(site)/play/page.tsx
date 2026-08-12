"use client";

import PlayGame from "@/modules/Play/PlayGame";
import { Box } from "@mui/material";

export default function PlayPage() {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PlayGame />
    </Box>
  );
}
