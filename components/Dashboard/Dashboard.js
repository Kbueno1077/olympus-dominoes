"use client";

import DominoTile from "@/components/DominoTile";
import { useTranslation } from "@/i18n/useTranslation";
import { useHasMounted } from "@/hooks/useHasMounted";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import { PlayArrow } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import { useRecoilValue } from "recoil";

const brandFont = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** Baize under the lamp — deeper than UI primary so bones pop. */
const FELT = "#143D32";
const FELT_EDGE = "#0A2820";
const IVORY = "#F7F0E3";
const IVORY_MUTED = alpha("#F7F0E3", 0.72);

/**
 * Scattered bones on the table — positions are % of the tile field so the
 * composition holds on phone and desktop without a media card.
 */
const TABLE_TILES = [
  { top: 9, bottom: 9, x: 8, y: 12, rotate: -18, size: 56 },
  { top: 6, bottom: 3, x: 28, y: 6, rotate: 8, size: 52 },
  { top: 5, bottom: 5, x: 48, y: 18, rotate: -6, size: 58 },
  { top: 2, bottom: 7, x: 68, y: 4, rotate: 14, size: 50 },
  { top: 8, bottom: 1, x: 14, y: 48, rotate: 22, size: 48 },
  { top: 4, bottom: 4, x: 38, y: 42, rotate: -12, size: 54 },
  { top: 0, bottom: 6, x: 58, y: 52, rotate: 4, size: 46 },
  { top: 9, bottom: 3, x: 78, y: 38, rotate: -20, size: 52 },
  { top: 7, bottom: 7, x: 72, y: 68, rotate: 10, size: 48 },
  { top: 3, bottom: 8, x: 22, y: 72, rotate: -8, size: 44 },
];

export default function Dashboard({ onStartNewGame, onOpenAnalytics }) {
  const { t } = useTranslation();
  const hasMounted = useHasMounted();
  const isGameStarted = useRecoilValue(isGameStartedRecoil);
  const matchInProgress = hasMounted && isGameStarted;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: "calc(100dvh - 64px)", md: "calc(100dvh - 64px)" },
        overflow: "hidden",
        color: IVORY,
        background: `
          radial-gradient(ellipse 90% 70% at 70% 40%, ${alpha("#1F6B58", 0.55)} 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 15% 80%, ${alpha("#0D382E", 0.9)} 0%, transparent 50%),
          linear-gradient(160deg, ${FELT} 0%, ${FELT_EDGE} 100%)
        `,
        // Soft felt grain
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.35,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.05 0 0 0 0 0.12 0 0 0 0 0.09 0 0 0 0.45 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
          )}")`,
          mixBlendMode: "overlay",
        },
        // Wood rail at the outer edge
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow: `
            inset 0 0 0 10px ${alpha("#3D3427", 0.55)},
            inset 0 0 0 12px ${alpha("#241D14", 0.35)},
            inset 0 0 80px ${alpha("#000", 0.35)}
          `,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 0.95fr) minmax(0, 1.05fr)" },
          gap: { xs: 3, md: 2 },
          alignItems: "center",
          minHeight: "inherit",
          px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
          py: { xs: 4, md: 5 },
          pb: { xs: 8, md: 5 },
        }}
      >
        <Stack
          spacing={3}
          sx={{
            position: "relative",
            zIndex: 2,
            maxWidth: 440,
            pt: { xs: 1, md: 0 },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Typography
              component="h1"
              className={brandFont.className}
              sx={{
                fontSize: { xs: "4.25rem", sm: "5.5rem", md: "6.75rem" },
                lineHeight: 0.9,
                letterSpacing: "0.02em",
                color: IVORY,
                textShadow: `0 2px 24px ${alpha("#000", 0.35)}`,
                mb: 1.5,
              }}
            >
              {t("brandName")}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 16, sm: 17 },
                lineHeight: 1.45,
                color: IVORY_MUTED,
                maxWidth: 320,
                fontWeight: 400,
              }}
            >
              {t("heroSubtitle")}
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Stack spacing={1.25} alignItems="flex-start">
              <Button
                onClick={onStartNewGame}
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                sx={{
                  px: 3,
                  py: 1.35,
                  fontSize: 16,
                  fontWeight: 600,
                  backgroundColor: IVORY,
                  color: FELT_EDGE,
                  boxShadow: `0 8px 28px ${alpha("#000", 0.35)}`,
                  "&:hover": {
                    backgroundColor: "#FDFAF4",
                    boxShadow: `0 10px 32px ${alpha("#000", 0.4)}`,
                  },
                }}
              >
                {t(matchInProgress ? "continueMatch" : "startMatch")}
              </Button>
              {matchInProgress ? (
                <Typography
                  variant="body2"
                  sx={{ color: alpha(IVORY, 0.55), pl: 0.5 }}
                >
                  {t("continueReadyBody")}
                </Typography>
              ) : null}
            </Stack>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <Button
              onClick={onOpenAnalytics}
              variant="text"
              size="small"
              sx={{
                color: alpha(IVORY, 0.55),
                px: 0.5,
                minWidth: 0,
                fontWeight: 500,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                textDecorationColor: alpha(IVORY, 0.25),
                "&:hover": {
                  color: IVORY,
                  backgroundColor: "transparent",
                  textDecorationColor: alpha(IVORY, 0.5),
                },
              }}
            >
              {t("mesaAnalyticsLink")}
            </Button>
          </motion.div>
        </Stack>

        {/* Tile field — dominant visual plane, not a card */}
        <Box
          aria-hidden
          sx={{
            position: "relative",
            width: "100%",
            height: { xs: 280, sm: 340, md: "min(62vh, 520px)" },
            minHeight: { md: 380 },
            mt: { xs: 1, md: 0 },
          }}
        >
          {TABLE_TILES.map((tile, i) => (
            <motion.div
              key={`${tile.top}-${tile.bottom}-${i}`}
              initial={{ opacity: 0, y: 28, rotate: 0, scale: 0.92 }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: tile.rotate,
                scale: 1,
              }}
              transition={{
                duration: 0.55,
                delay: 0.12 + i * 0.045,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                position: "absolute",
                left: `${tile.x}%`,
                top: `${tile.y}%`,
                filter: `drop-shadow(0 10px 18px ${alpha("#000", 0.45)})`,
              }}
            >
              <DominoTile
                top={tile.top}
                bottom={tile.bottom}
                size={tile.size}
              />
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
