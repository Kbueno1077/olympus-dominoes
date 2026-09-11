"use client";

import Header from "@/components/Header/Header";
import { playTableActiveRecoil } from "@/recoil/recoilState";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";

const FULL_BLEED_PATHS = new Set([
  "/stats",
  "/compare",
  "/history",
  "/podium",
  "/leaderboard",
  "/tools",
  "/play",
  "/f-lab",
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
 * /play keeps the site header on setup; once a match is dealt, the table owns
 * chrome via the config drawer and the header hides.
 */
export default function AppShell({ children }) {
  const pathname = usePathname();
  const playTableActive = useRecoilValue(playTableActiveRecoil);
  const fullBleed =
    FULL_BLEED_PATHS.has(pathname) ||
    pathname.startsWith("/history/") ||
    pathname.startsWith("/watch/");
  const playPath = pathname === "/play";
  const playInMatch = playPath && playTableActive;

  useEffect(() => {
    if (!playInMatch) return;
    document.documentElement.style.setProperty("--app-header-height", "0px");
    return () => {
      document.documentElement.style.removeProperty("--app-header-height");
    };
  }, [playInMatch]);

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
      {!playInMatch && <Header />}
      <Box
        id="app-shell-scroll"
        component="section"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          pt: playInMatch ? 0 : 8,
          minHeight: 0,
          width: "100%",
          maxWidth: "100%",
          pb: playInMatch
            ? 0
            : fullBleed
              ? { xs: 2, md: 0 }
              : { xs: 10, sm: 8 },
          overflowX: "clip",
          overflowY: playInMatch
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
