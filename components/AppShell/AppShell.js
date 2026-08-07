"use client";

import Header from "@/components/Header/Header";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";

const FULL_BLEED_PATHS = new Set(["/stats", "/compare", "/history", "/podium"]);

/** Long single-column pages that scroll inside the shell (under the fixed header). */
const SECTION_SCROLL_PATHS = new Set(["/privacy"]);

/** Prefer dynamic viewport height on mobile browsers (URL chrome). */
const VIEWPORT_HEIGHT = {
  xs: "100dvh",
  md: "100vh",
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const fullBleed =
    FULL_BLEED_PATHS.has(pathname) || pathname.startsWith("/history/");
  // Fixed-height shell + section overflow — avoids nested scroll traps from
  // overflow-x:hidden forcing overflow-y:auto while the shell still grows.
  const sectionScroll =
    fullBleed || SECTION_SCROLL_PATHS.has(pathname);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: sectionScroll ? VIEWPORT_HEIGHT : "100vh",
        height: sectionScroll ? VIEWPORT_HEIGHT : "auto",
        width: "100%",
        maxWidth: "100%",
        // Mobile dashboards / prose: section scrolls. Desktop panes scroll inside.
        overflow: sectionScroll ? "hidden" : "visible",
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
          // Prefer clip over hidden on document-scroll pages so overflow-y can
          // stay visible (hidden+visible pairs to auto and traps touch scroll).
          overflowX: sectionScroll ? "hidden" : "clip",
          overflowY: sectionScroll
            ? fullBleed
              ? { xs: "auto", md: "hidden" }
              : "auto"
            : "visible",
          WebkitOverflowScrolling: "touch",
          ...(sectionScroll ? { overscrollBehavior: "contain" } : null),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
