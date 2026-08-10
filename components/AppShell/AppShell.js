"use client";

import Header from "@/components/Header/Header";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const FULL_BLEED_PATHS = new Set([
  "/stats",
  "/compare",
  "/history",
  "/podium",
  "/leaderboard",
  "/merge",
  "/play",
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
 *
 * /play hides the site header — table chrome owns nav via the config drawer.
 */
export default function AppShell({ children }) {
  const pathname = usePathname();
  const fullBleed =
    FULL_BLEED_PATHS.has(pathname) || pathname.startsWith("/history/");
  const playTable = pathname === "/play";

  useEffect(() => {
    if (!playTable) return;
    document.documentElement.style.setProperty("--app-header-height", "0px");
    return () => {
      document.documentElement.style.removeProperty("--app-header-height");
    };
  }, [playTable]);

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
      {!playTable && <Header />}
      <Box
        id="app-shell-scroll"
        component="section"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          pt: playTable ? 0 : 8,
          minHeight: 0,
          width: "100%",
          maxWidth: "100%",
          pb: playTable
            ? 0
            : fullBleed
              ? { xs: 2, md: 0 }
              : { xs: 10, sm: 8 },
          overflowX: "clip",
          overflowY: playTable
            ? "hidden"
            : fullBleed
              ? { xs: "auto", md: "hidden" }
              : "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
