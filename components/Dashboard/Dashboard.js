"use client";

import DominoTile from "@/components/DominoTile";
import { useTranslation } from "@/i18n/useTranslation";
import { useHasMounted } from "@/hooks/useHasMounted";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { PlayArrow } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Collapse,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRecoilValue } from "recoil";

// The opening hand: a spread of tiles that doubles as the hero art.
const HERO_TILES = [
  { top: 9, bottom: 9, rotate: -9 },
  { top: 6, bottom: 3, rotate: -3 },
  { top: 5, bottom: 5, rotate: 3 },
  { top: 2, bottom: 7, rotate: 9 },
];

const FEATURE_KEYS = ["featurePlayers", "featureModes", "featureLocal"];

const HOW_STEPS = [
  { title: "howStep1Title", body: "howStep1Body" },
  { title: "howStep2Title", body: "howStep2Body" },
  { title: "howStep3Title", body: "howStep3Body" },
];

const SPLIT_SIDES = [
  { title: "homeAppTitle", body: "homeAppBody" },
  { title: "homeWebTitle", body: "homeWebBody" },
];

function FeatureRow({ t }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 1, sm: 2.5 }}
      alignItems={{ xs: "center", sm: "flex-start" }}
      justifyContent={{ xs: "center", md: "flex-start" }}
      flexWrap="wrap"
      useFlexGap
    >
      {FEATURE_KEYS.map((key) => (
        <Stack key={key} direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "primary.main",
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(key)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function HowItWorks({ t }) {
  return (
    <Box>
      <Typography
        variant="overline"
        component="p"
        sx={{ color: "text.secondary", mb: 2 }}
      >
        {t("howItWorksTitle")}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {HOW_STEPS.map((step, index) => (
          <Box key={step.title}>
            <Typography
              sx={{
                fontFamily: (theme) => theme.typography.h2.fontFamily,
                fontWeight: 700,
                fontSize: 28,
                lineHeight: 1,
                color: (theme) => alpha(theme.palette.primary.main, 0.28),
                mb: 0.75,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: "text.primary", fontWeight: 600, mb: 0.5 }}
            >
              {t(step.title)}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t(step.body)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function HistoryNotice({ t, onOpenAnalytics }) {
  return (
    <Card
      sx={{
        p: { xs: 2.5, sm: 3 },
        backgroundColor: "background.neutral",
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ color: "text.primary", fontWeight: 600, mb: 0.5 }}
          >
            {t("webHistoryTitle")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("webHistoryBody")}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "row", sm: "column" }}
          spacing={1}
          alignItems={{ xs: "center", sm: "flex-end" }}
          sx={{ flexShrink: 0 }}
        >
          <Typography
            variant="overline"
            sx={{
              color: "text.disabled",
              fontSize: 10,
              whiteSpace: "nowrap",
            }}
          >
            {t("webHistoryNote")}
          </Typography>
          <Button variant="outlined" size="small" onClick={onOpenAnalytics}>
            {t("webHistoryCta")}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

/** Quiet disclosure — same tone as How it works, not a feature-matrix card. */
function AppVsWebDetails({ t }) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        endIcon={
          <ExpandMore
            sx={{
              fontSize: 18,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 160ms ease",
            }}
          />
        }
        sx={{
          px: 0,
          py: 0.5,
          minWidth: 0,
          color: "text.secondary",
          textTransform: "none",
          fontWeight: 500,
          "&:hover": {
            backgroundColor: "transparent",
            color: "text.primary",
          },
        }}
      >
        <Typography
          variant="overline"
          component="span"
          sx={{ letterSpacing: "0.08em", color: "inherit" }}
        >
          {t("homeSplitToggleTitle")}
        </Typography>
      </Button>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          {SPLIT_SIDES.map((side) => (
            <Box key={side.title}>
              <Typography
                variant="subtitle1"
                sx={{ color: "text.primary", fontWeight: 600, mb: 0.5 }}
              >
                {t(side.title)}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t(side.body)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function Dashboard({ onStartNewGame, onOpenAnalytics }) {
  const { t } = useTranslation();
  const hasMounted = useHasMounted();
  const isGameStarted = useRecoilValue(isGameStartedRecoil);
  // Persist only after mount so SSR HTML matches the first client paint.
  const matchInProgress = hasMounted && isGameStarted;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 7 } }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Stack spacing={{ xs: 4, md: 5 }}>
          <Box
            sx={{
              display: "grid",
              gap: { xs: 4, md: 5 },
              alignItems: "center",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
            }}
          >
            <Stack
              spacing={3}
              alignItems={{ xs: "center", md: "flex-start" }}
              textAlign={{ xs: "center", md: "left" }}
            >
              <Stack
                direction="row"
                spacing={-0.5}
                justifyContent={{ xs: "center", md: "flex-start" }}
                sx={{ pt: 1 }}
              >
                {HERO_TILES.map((tile, i) => (
                  <motion.div
                    key={`${tile.top}-${tile.bottom}`}
                    initial={{ opacity: 0, y: 18, rotate: 0 }}
                    animate={{ opacity: 1, y: 0, rotate: tile.rotate }}
                    transition={{
                      duration: 0.45,
                      delay: 0.08 * i,
                      ease: "easeOut",
                    }}
                  >
                    <DominoTile top={tile.top} bottom={tile.bottom} size={38} />
                  </motion.div>
                ))}
              </Stack>

              <Stack
                spacing={1.5}
                alignItems={{ xs: "center", md: "flex-start" }}
              >
                <Typography variant="h2" sx={{ color: "text.primary" }}>
                  {t("heroTitle")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", maxWidth: 480 }}
                >
                  {t("heroSubtitle")}
                </Typography>
              </Stack>

              <FeatureRow t={t} />
            </Stack>

            <Card
              sx={{
                width: "100%",
                p: { xs: 3, sm: 4 },
                backgroundColor: "background.paper",
                borderColor: (theme) =>
                  alpha(
                    theme.palette[matchInProgress ? "secondary" : "primary"]
                      .main,
                    0.24
                  ),
              }}
            >
              <Stack spacing={2.5} alignItems="center">
                <Typography variant="h5" sx={{ color: "text.primary" }}>
                  {t(matchInProgress ? "continueReadyTitle" : "readyTitle")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    maxWidth: 340,
                    textAlign: "center",
                  }}
                >
                  {t(matchInProgress ? "continueReadyBody" : "readyBody")}
                </Typography>
                <Button
                  onClick={onStartNewGame}
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<PlayArrow />}
                  sx={{ maxWidth: 280, fontSize: 15 }}
                >
                  {t(matchInProgress ? "continueMatch" : "startMatch")}
                </Button>
              </Stack>
            </Card>
          </Box>

          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: 44,
              height: "2px",
              borderRadius: 1,
              mx: "auto",
              backgroundColor: (theme) =>
                alpha(theme.palette.secondary.main, 0.5),
            }}
          />

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <HowItWorks t={t} />
          </Box>

          <HistoryNotice t={t} onOpenAnalytics={onOpenAnalytics} />

          <AppVsWebDetails t={t} />

          <Stack spacing={1.5} alignItems="center" sx={{ pt: 1 }}>
            <Box
              sx={{
                width: 44,
                height: "2px",
                borderRadius: 1,
                backgroundColor: (theme) =>
                  alpha(theme.palette.secondary.main, 0.5),
                display: { md: "none" },
              }}
            />
            <Typography
              variant="overline"
              sx={{ color: "text.disabled", fontSize: 10 }}
            >
              {t("madeForTheTable")}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography
                component={Link}
                href="/privacy"
                variant="caption"
                sx={{
                  color: "text.disabled",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  "&:hover": { color: "text.secondary" },
                }}
              >
                {t("privacyLink")}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                sx={{ color: "text.disabled" }}
              >
                ·
              </Typography>
              <Typography
                component={Link}
                href="/changelog"
                variant="caption"
                sx={{
                  color: "text.disabled",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  "&:hover": { color: "text.secondary" },
                }}
              >
                {t("changelogLink")}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </motion.div>
    </Container>
  );
}
