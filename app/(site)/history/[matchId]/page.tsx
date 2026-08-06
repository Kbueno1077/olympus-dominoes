"use client";

import History from "@/modules/History/History";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";

export default function HistoryMatchPage() {
  const router = useRouter();

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
      <History onOpenAnalytics={() => router.push("/stats")} />
    </Box>
  );
}
