"use client";

import PlayGame from "@/modules/Play/PlayGame";
import PlayGate from "@/modules/Play/PlayGate";
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
      <PlayGate>
        <PlayGame />
      </PlayGate>
    </Box>
  );
}
