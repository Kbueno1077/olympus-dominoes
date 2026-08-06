"use client";

import DominoTile from "@/components/DominoTile";
import LanguageSwitch from "@/components/Header/LanguageSwitch";
import { useTranslation } from "@/i18n/useTranslation";
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * @param {{
 *   navItems?: Array<{ id: string, label: string, active?: boolean, onClick: () => void }>,
 * }} [props]
 */
export default function Header({ navItems = [] }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.grey[100], isScrolled ? 0.92 : 0.75),
        backdropFilter: "blur(12px)",
        color: "text.primary",
        borderBottom: `1px solid ${alpha(
          theme.palette.grey[600],
          isScrolled ? 0.24 : 0
        )}`,
        boxShadow: isScrolled ? theme.customShadows.z8 : "none",
        transition: "background-color 200ms ease, border-color 200ms ease",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            position: "relative",
            justifyContent: "space-between",
            gap: 1,
            minHeight: 64,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 0.25, sm: 0.5 }}
            sx={{
              flex: 1,
              justifyContent: "flex-start",
              minWidth: 0,
              flexWrap: "wrap",
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.id}
                size="small"
                color="inherit"
                onClick={item.onClick}
                sx={{
                  color: item.active ? "primary.dark" : "text.secondary",
                  fontWeight: item.active ? 600 : 500,
                  px: { xs: 1, sm: 1.5 },
                  minWidth: 0,
                  backgroundColor: item.active
                    ? (muiTheme) => alpha(muiTheme.palette.primary.main, 0.08)
                    : "transparent",
                  "&:hover": {
                    backgroundColor: (muiTheme) =>
                      alpha(muiTheme.palette.primary.main, 0.1),
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {/* The double-nine tile: the highest piece in a Cuban set. */}
              <DominoTile top={9} bottom={9} size={17} orientation="horizontal" />

              <Box>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: (theme) => theme.typography.h2.fontFamily,
                    fontWeight: 700,
                    fontSize: { xs: 19, sm: 22 },
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

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              flex: 1,
              justifyContent: "flex-end",
              minWidth: 0,
            }}
          >
            <LanguageSwitch />
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
