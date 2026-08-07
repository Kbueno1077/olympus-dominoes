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
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

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
          isScrolled ? 0.24 : 0
        )}`,
        boxShadow: isScrolled ? theme.customShadows.z8 : "none",
        transition: "border-color 200ms ease, box-shadow 200ms ease",
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Toolbar
          disableGutters
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
            minHeight: 64,
            flexWrap: "nowrap",
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
                <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
                  <DominoTile
                    top={9}
                    bottom={9}
                    size={17}
                    orientation="horizontal"
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component="p"
                    noWrap
                    sx={{
                      fontFamily: (muiTheme) =>
                        muiTheme.typography.h2.fontFamily,
                      fontWeight: 700,
                      fontSize: { xs: 16, sm: 22 },
                      lineHeight: 1.1,
                      letterSpacing: "-0.01em",
                      color: "primary.dark",
                    }}
                  >
                    Olympus Dominoes
                  </Typography>
                  <Typography
                    variant="overline"
                    sx={{
                      display: { xs: "none", sm: "block" },
                      color: "text.disabled",
                      fontSize: 9,
                      lineHeight: 1.4,
                    }}
                  >
                    {t("tagline")}
                  </Typography>
                </Box>
              </Stack>
            </motion.div>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{
              flexShrink: 0,
              flexWrap: "nowrap",
            }}
          >
            <NavMenu />
            <LanguageSwitch />
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
