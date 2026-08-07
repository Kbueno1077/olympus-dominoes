"use client";

import Header from "@/components/Header/Header";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";

const FULL_BLEED_PATHS = new Set([
  "/stats",
  "/compare",
  "/history",
  "/podium",
  "/leaderboard",
]);

/** Prefer dynamic viewport height on mobile browsers (URL chrome). */
const VIEWPORT_HEIGHT = {
  xs: "100dvh",
  md: "100vh",
};

/**
 * Single scroll owner for the site. Document scroll is disabled in globals.css
 * so mobile does not stack html/body scroll under this section (overscroll past
 * content). Full-bleed dashboards still use inner pane scroll on md+.
 */
export default function AppShell({ children }) {
  const pathname = usePathname();
  const fullBleed =
    FULL_BLEED_PATHS.has(pathname) || pathname.startsWith("/history/");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: VIEWPORT_HEIGHT,
        maxHeight: VIEWPORT_HEIGHT,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Header />
      <Box
        id="app-shell-scroll"
        component="section"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          pt: 8,
          minHeight: 0,
          width: "100%",
          maxWidth: "100%",
          // Modest pad — large bottom padding invented empty scroll room.
          pb: fullBleed ? { xs: 2, md: 0 } : { xs: 10, sm: 8 },
          overflowX: "clip",
          // Mobile: section scrolls. Desktop full-bleed: panes scroll inside.
          overflowY: fullBleed ? { xs: "auto", md: "hidden" } : "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
