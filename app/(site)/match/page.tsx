"use client";

import NewMatch from "@/modules/NewMatch/newMatch";
import { Box } from "@mui/material";

export default function MatchPage() {
  return (
    <Box
      sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1.5, sm: 3, md: 4, lg: 5 },
      }}
    >
      <NewMatch />
    </Box>
  );
}
