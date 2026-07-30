"use client";

import DominoTile from "@/components/DominoTile";
import { useTranslation } from "@/i18n/useTranslation";
import { EmojiEvents, Group, PhoneIphone, PlayArrow } from "@mui/icons-material";
import { Box, Button, Card, Container, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";

// The opening hand: a spread of tiles that doubles as the hero art.
const HERO_TILES = [
  { top: 9, bottom: 9, rotate: -9 },
  { top: 6, bottom: 3, rotate: -3 },
  { top: 5, bottom: 5, rotate: 3 },
  { top: 2, bottom: 7, rotate: 9 },
];

const FEATURES = [
  { icon: Group, key: "featurePlayers" },
  { icon: EmojiEvents, key: "featureModes" },
  { icon: PhoneIphone, key: "featureLocal" },
];

function FeatureRow({ t }) {
  return (
    <Stack
      direction="row"
      spacing={{ xs: 2, sm: 3.5 }}
      flexWrap="wrap"
      justifyContent="center"
      rowGap={1.5}
    >
      {FEATURES.map(({ icon: Icon, key }) => (
        <Stack key={key} direction="row" spacing={0.75} alignItems="center">
          <Icon sx={{ fontSize: 17, color: "primary.main" }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(key)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export default function Dashboard({ onStartNewGame }) {
  const { t } = useTranslation();

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 7 } }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Stack
            direction="row"
            spacing={-0.5}
            justifyContent="center"
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

          <Stack spacing={1.5} alignItems="center">
            <Typography variant="h2" sx={{ color: "text.primary" }}>
              {t("heroTitle")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "text.secondary", maxWidth: 420 }}
            >
              {t("heroSubtitle")}
            </Typography>
          </Stack>

          <FeatureRow t={t} />

          <Card
            sx={{
              width: "100%",
              p: { xs: 3, sm: 4 },
              backgroundColor: "background.paper",
              borderColor: (t) => alpha(t.palette.primary.main, 0.24),
            }}
          >
            <Stack spacing={2.5} alignItems="center">
              <Typography variant="h5" sx={{ color: "text.primary" }}>
                {t("readyTitle")}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", maxWidth: 340 }}
              >
                {t("readyBody")}
              </Typography>
              <Button
                onClick={onStartNewGame}
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PlayArrow />}
                sx={{ maxWidth: 280, fontSize: 15 }}
              >
                {t("startMatch")}
              </Button>
            </Stack>
          </Card>

          <Box
            sx={{
              width: 44,
              height: "2px",
              borderRadius: 1,
              backgroundColor: (t) => alpha(t.palette.secondary.main, 0.5),
            }}
          />
          <Typography
            variant="overline"
            sx={{ color: "text.disabled", fontSize: 10 }}
          >
            {t("madeForTheTable")}
          </Typography>
        </Stack>
      </motion.div>
    </Container>
  );
}
