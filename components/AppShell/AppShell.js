"use client";

import Header from "@/components/Header/Header";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";

const FULL_BLEED_PATHS = new Set(["/stats", "/compare", "/history"]);

export default function AppShell({ children }) {
  const pathname = usePathname();
  const fullBleed =
    FULL_BLEED_PATHS.has(pathname) || pathname.startsWith("/history/");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Header />
      <Box
        component="section"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          pt: 8,
          // Dashboard pages own their bottom edge so the sidebar can reach it.
          pb: fullBleed ? 0 : { xs: 14, sm: 10 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
