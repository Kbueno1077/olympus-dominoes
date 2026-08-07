"use client";

import Header from "@/components/Header/Header";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";

const FULL_BLEED_PATHS = new Set(["/stats", "/compare", "/history", "/podium"]);

/** Prefer dynamic viewport height on mobile browsers (URL chrome). */
const VIEWPORT_HEIGHT = {
  xs: "100dvh",
  md: "100vh",
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const fullBleed =
    FULL_BLEED_PATHS.has(pathname) || pathname.startsWith("/history/");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: fullBleed ? VIEWPORT_HEIGHT : "100vh",
        height: fullBleed ? VIEWPORT_HEIGHT : "auto",
        width: "100%",
        maxWidth: "100%",
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
          width: "100%",
          maxWidth: "100%",
          // Extra bottom pad on mobile so the last cards clear the home indicator.
          pb: fullBleed ? { xs: 4, md: 0 } : { xs: 14, sm: 10 },
          overflowX: "hidden",
          overflowY: fullBleed ? { xs: "auto", md: "hidden" } : "visible",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
