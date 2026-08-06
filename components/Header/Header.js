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
 *   tone?: "default" | "mesa",
 * }} [props]
 */
export default function Header({ navItems = [], tone = "default" }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const mesa = tone === "mesa";
  const ivory = "#F3E8D4";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const brand = (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      {!mesa ? (
        <DominoTile top={9} bottom={9} size={17} orientation="horizontal" />
      ) : null}
      <Box>
        <Typography
          component="p"
          sx={{
            fontFamily: (muiTheme) => muiTheme.typography.h2.fontFamily,
            fontWeight: 700,
            fontSize: mesa ? { xs: 17, sm: 18 } : { xs: 19, sm: 22 },
            lineHeight: 1.1,
            letterSpacing: mesa ? "0.04em" : "-0.01em",
            color: mesa ? ivory : "primary.dark",
          }}
        >
          {mesa ? "Olympus" : "Olympus Dominoes"}
        </Typography>
        {!mesa ? (
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
        ) : null}
      </Box>
    </Stack>
  );

  const navButtons = navItems.map((item, index) => (
    <Stack key={item.id} direction="row" alignItems="center" spacing={0.5}>
      {mesa && index > 0 ? (
        <Typography
          aria-hidden
          sx={{ color: alpha(ivory, 0.35), fontSize: 12, px: 0.25 }}
        >
          ·
        </Typography>
      ) : null}
      <Button
        size="small"
        color="inherit"
        onClick={item.onClick}
        sx={{
          color: mesa
            ? item.active
              ? ivory
              : alpha(ivory, 0.7)
            : item.active
              ? "primary.dark"
              : "text.secondary",
          fontWeight: item.active ? 600 : 500,
          px: { xs: 0.75, sm: mesa ? 1 : 1.5 },
          minWidth: 0,
          backgroundColor: item.active
            ? mesa
              ? "transparent"
              : (muiTheme) => alpha(muiTheme.palette.primary.main, 0.08)
            : "transparent",
          "&:hover": {
            backgroundColor: mesa
              ? alpha(ivory, 0.08)
              : (muiTheme) => alpha(muiTheme.palette.primary.main, 0.1),
          },
        }}
      >
        {item.label}
      </Button>
    </Stack>
  ));

  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="transparent"
      sx={{
        backgroundColor: mesa
          ? isScrolled
            ? alpha("#061510", 0.82)
            : "transparent"
          : alpha(theme.palette.grey[100], isScrolled ? 0.92 : 0.75),
        backgroundImage: "none",
        backdropFilter: mesa
          ? isScrolled
            ? "blur(10px)"
            : "none"
          : "blur(12px)",
        color: mesa ? ivory : "text.primary",
        borderBottom: `1px solid ${
          mesa
            ? alpha(ivory, isScrolled ? 0.12 : 0)
            : alpha(theme.palette.grey[600], isScrolled ? 0.24 : 0)
        }`,
        boxShadow: !mesa && isScrolled ? theme.customShadows.z8 : "none",
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
          {mesa ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {brand}
              </motion.div>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.25}
                sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
              >
                {navButtons}
                <Box sx={{ ml: 1 }}>
                  <LanguageSwitch tone={tone} />
                </Box>
              </Stack>
            </>
          ) : (
            <>
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
                {navButtons}
              </Stack>

              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {brand}
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
                <LanguageSwitch tone={tone} />
              </Stack>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
