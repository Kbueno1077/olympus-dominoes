"use client";

import Header from "@/components/Header/Header";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";

const FULL_BLEED_PATHS = new Set(["/stats", "/compare", "/history", "/podium"]);

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
        // Mobile: section scrolls as one page. Desktop: panes scroll inside.
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
          // Dashboard pages own their bottom edge; panes scroll inside on md+.
          pb: fullBleed ? 0 : { xs: 14, sm: 10 },
          overflow: fullBleed
            ? { xs: "auto", md: "hidden" }
            : "visible",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
