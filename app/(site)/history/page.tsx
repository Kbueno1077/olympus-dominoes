"use client";

import History from "@/modules/History/History";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1.5, sm: 3, md: 4, lg: 5 },
      }}
    >
      <History onOpenAnalytics={() => router.push("/stats")} />
    </Box>
  );
}
