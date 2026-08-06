"use client";

import History from "@/modules/History/History";
import { Box } from "@mui/material";

export default function HistoryPage() {
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
      <History />
    </Box>
  );
}
