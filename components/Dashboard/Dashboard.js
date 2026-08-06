"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { useHasMounted } from "@/hooks/useHasMounted";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Cinzel, Source_Sans_3 } from "next/font/google";
import Image from "next/image";
import { useRecoilValue } from "recoil";

const brandFont = Cinzel({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const uiFont = Source_Sans_3({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const IVORY = "#F3E8D4";
const IVORY_MUTED = alpha("#F3E8D4", 0.78);
const BUTTON_GREEN = "#1A5C48";

export default function Dashboard({ onStartNewGame, onOpenAnalytics }) {
  const { t } = useTranslation();
  const hasMounted = useHasMounted();
  const isGameStarted = useRecoilValue(isGameStartedRecoil);
  const matchInProgress = hasMounted && isGameStarted;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "calc(100dvh - 64px)",
        overflow: "hidden",
        color: IVORY,
      }}
    >
      <Image
        src="/mesa-table-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />

      {/* Soft vignette so type on the left stays readable */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(
              105deg,
              ${alpha("#061510", 0.55)} 0%,
              ${alpha("#061510", 0.28)} 32%,
              ${alpha("#061510", 0.08)} 52%,
              transparent 68%
            )
          `,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          minHeight: "inherit",
          px: { xs: 3, sm: 5, md: 8, lg: 10 },
          py: { xs: 5, md: 6 },
          pb: { xs: 10, md: 6 },
        }}
      >
        <Stack
          spacing={2.75}
          sx={{
            maxWidth: { xs: 420, md: 460 },
            width: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Typography
              component="h1"
              className={brandFont.className}
              sx={{
                fontSize: { xs: "3.6rem", sm: "5rem", md: "6.2rem" },
                fontWeight: 700,
                lineHeight: 0.92,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: IVORY,
                textShadow: `0 2px 28px ${alpha("#000", 0.55)}`,
              }}
            >
              {t("brandName")}
            </Typography>

            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ mt: 1.75 }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 18,
                  height: 14,
                  flexShrink: 0,
                  opacity: 0.85,
                  background: `linear-gradient(180deg, ${IVORY} 0%, ${alpha(IVORY, 0.55)} 100%)`,
                  clipPath:
                    "polygon(15% 100%, 0 35%, 20% 0, 35% 35%, 50% 0, 65% 35%, 80% 0, 100% 35%, 85% 100%)",
                }}
              />
              <Typography
                className={uiFont.className}
                sx={{
                  fontSize: { xs: 11, sm: 12 },
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: IVORY_MUTED,
                }}
              >
                {t("heroSubtitle")}
              </Typography>
            </Stack>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Stack spacing={1.5} alignItems="flex-start">
              <Button
                onClick={onStartNewGame}
                variant="contained"
                size="large"
                className={uiFont.className}
                sx={{
                  px: 3.5,
                  py: 1.4,
                  minWidth: 200,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: 1.5,
                  background: `linear-gradient(180deg, #227A60 0%, ${BUTTON_GREEN} 100%)`,
                  color: IVORY,
                  boxShadow: `
                    0 1px 0 ${alpha("#fff", 0.12)} inset,
                    0 10px 28px ${alpha("#000", 0.45)}
                  `,
                  "&:hover": {
                    background: `linear-gradient(180deg, #2A8A6C 0%, #1F6B54 100%)`,
                    boxShadow: `
                      0 1px 0 ${alpha("#fff", 0.14)} inset,
                      0 12px 32px ${alpha("#000", 0.5)}
                    `,
                  },
                }}
              >
                {t(matchInProgress ? "continueMatch" : "startMatch")}
              </Button>

              {matchInProgress ? (
                <Typography
                  sx={{
                    fontFamily: (theme) => theme.typography.h2.fontFamily,
                    fontSize: 16,
                    fontStyle: "italic",
                    color: IVORY_MUTED,
                    pl: 0.25,
                  }}
                >
                  {t("continueReadyBody")}
                </Typography>
              ) : (
                <Button
                  onClick={onOpenAnalytics}
                  variant="text"
                  size="small"
                  sx={{
                    color: IVORY_MUTED,
                    px: 0.25,
                    minWidth: 0,
                    fontFamily: (theme) => theme.typography.h2.fontFamily,
                    fontStyle: "italic",
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    textDecorationColor: alpha(IVORY, 0.28),
                    "&:hover": {
                      color: IVORY,
                      backgroundColor: "transparent",
                      textDecorationColor: alpha(IVORY, 0.55),
                    },
                  }}
                >
                  {t("mesaAnalyticsLink")}
                </Button>
              )}
            </Stack>
          </motion.div>
        </Stack>
      </Box>
    </Box>
  );
}
