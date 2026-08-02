"use client";

import DominoTile from "@/components/DominoTile";
import LanguageSwitch from "@/components/Header/LanguageSwitch";
import { useTranslation } from "@/i18n/useTranslation";
import { ArrowBack } from "@mui/icons-material";
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
 * @param {{ onBack?: () => void, actions?: import("react").ReactNode }} [props]
 */
export default function Header({ onBack, actions }) {
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
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              minWidth: 0,
            }}
          >
            {onBack && (
              <Button
                startIcon={<ArrowBack />}
                onClick={onBack}
                color="inherit"
                size="small"
                sx={{
                  color: "text.secondary",
                  ml: { xs: -0.5, sm: -1 },
                  px: { xs: 1, sm: 1.5 },
                }}
              >
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  {t("dashboard")}
                </Box>
              </Button>
            )}
          </Box>

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
            {actions}
            <LanguageSwitch />
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
