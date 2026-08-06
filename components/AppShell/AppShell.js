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
        height: fullBleed ? "100vh" : "auto",
        width: "100%",
        overflow: fullBleed ? "hidden" : "visible",
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
          minHeight: 0,
          // Dashboard pages own their bottom edge; panes scroll inside.
          pb: fullBleed ? 0 : { xs: 14, sm: 10 },
          overflow: fullBleed ? "hidden" : "visible",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
