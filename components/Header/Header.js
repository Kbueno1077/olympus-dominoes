"use client";

import DominoTile from "@/components/DominoTile";
import LanguageSwitch from "@/components/Header/LanguageSwitch";
import NavMenu from "@/components/Header/NavMenu";
import { useTranslation } from "@/i18n/useTranslation";
import {
  AppBar,
  Box,
  Container,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DEFAULT_HEADER_PX = 64;
const PLAY_SLIM_PX = 44;
const PLAY_LANDSCAPE_PX = 28;

/**
 * Site chrome. On /play when either viewport edge is at mobile size or less
 * (portrait width or landscape height), use a slim always-open bar with nav
 * + language so the table keeps room. Landscape phones go even tighter.
 *
 * MUI Toolbar injects min-height: 64px from sm+ via media query — override
 * with `@media all` or landscape /play stays stuck at 64px on wide phones.
 */
export default function Header() {
  const theme = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const mobileEdge = theme.breakpoints.values.sm;
  const narrowWidth = useMediaQuery(theme.breakpoints.down("sm"));
  const shortHeight = useMediaQuery(`(max-height:${mobileEdge}px)`);
  // Wide + short ≈ phone landscape (don't rely on orientation alone).
  const landscapePhone = useMediaQuery(
    `(max-height: 500px) and (min-width: ${mobileEdge}px)`
  );
  const compactViewport = narrowWidth || shortHeight || landscapePhone;
  const playSlim = pathname === "/play" && compactViewport;
  const playLandscape = pathname === "/play" && landscapePhone;
  const [isScrolled, setIsScrolled] = useState(false);

  const headerPx = playLandscape
    ? PLAY_LANDSCAPE_PX
    : playSlim
      ? PLAY_SLIM_PX
      : DEFAULT_HEADER_PX;

  useEffect(() => {
    // Document scroll is locked; AppShell section owns scroll on mobile.
    const shell = document.getElementById("app-shell-scroll");
    const onScroll = () => {
      const shellTop = shell?.scrollTop ?? 0;
      setIsScrolled(window.scrollY > 8 || shellTop > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    shell?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      shell?.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-header-height",
      `${headerPx}px`
    );
    return () => {
      document.documentElement.style.removeProperty("--app-header-height");
    };
  }, [headerPx]);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="inherit"
      sx={{
        // Frosted bone chrome — shared with Stats/Compare sidebars.
        backgroundColor: alpha(theme.palette.grey[100], 0.75),
        backgroundImage: "none",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "text.primary",
        borderBottom: `1px solid ${alpha(
          theme.palette.grey[600],
          isScrolled || playSlim ? 0.2 : 0
        )}`,
        boxShadow: isScrolled ? theme.customShadows.z8 : "none",
        transition: "border-color 200ms ease, box-shadow 200ms ease",
      }}
    >
      <Container
        maxWidth={false}
        sx={{ px: { xs: playLandscape ? 0.75 : playSlim ? 1 : 1.5, sm: playLandscape ? 1 : 2, md: 2.5 } }}
      >
        <Toolbar
          variant={playSlim ? "dense" : "regular"}
          disableGutters
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: { xs: 0.5, sm: playLandscape ? 0.5 : 1.5 },
            // Beat theme mixin media queries (sm+ minHeight 64).
            "@media all": {
              minHeight: headerPx,
              height: headerPx,
            },
            minHeight: headerPx,
            height: headerPx,
            maxHeight: headerPx,
            flexWrap: "nowrap",
            transition: "min-height 160ms ease, height 160ms ease",
          }}
        >
          <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Stack
                component={Link}
                href="/"
                direction="row"
                alignItems="center"
                spacing={{ xs: 1, sm: 1.5 }}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  minWidth: 0,
                  maxWidth: "100%",
                }}
              >
                <Box
                  sx={{
                    display: playSlim ? "none" : { xs: "none", sm: "block" },
                    flexShrink: 0,
                  }}
                >
                  <DominoTile
                    top={9}
                    bottom={9}
                    size={17}
                    orientation="horizontal"
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  {!playLandscape && (
                    <Typography
                      component="p"
                      noWrap
                      sx={{
                        fontFamily: (muiTheme) =>
                          muiTheme.typography.h2.fontFamily,
                        fontWeight: 700,
                        fontSize: playSlim ? 15 : { xs: 16, sm: 22 },
                        lineHeight: 1.1,
                        letterSpacing: "-0.01em",
                        color: "primary.dark",
                      }}
                    >
                      {playSlim ? "Olympus" : "Olympus Dominoes"}
                    </Typography>
                  )}
                  {!playSlim && (
                    <Typography
                      variant="overline"
                      noWrap
                      sx={{
                        display: { xs: "none", sm: "block" },
                        color: "text.disabled",
                        fontSize: 9,
                        lineHeight: 1.35,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {t("tagline")}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </motion.div>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 0.35, sm: 1 }}
            sx={{
              flexShrink: 0,
              flexWrap: "nowrap",
            }}
          >
            <NavMenu dense={playSlim} />
            <LanguageSwitch dense={playSlim} />
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
