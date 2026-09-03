"use client";

import DominoTile from "@/components/DominoTile";
import Iconify from "@/components/Iconify";
import QrCodeDialog from "@/components/QrCodeDialog";
import {
  ANDROID_APP_URL,
  IOS_APP_URL,
  SITE_URL,
} from "@/lib/appLinks";
import { useTranslation } from "@/i18n/useTranslation";
import { useHasMounted } from "@/hooks/useHasMounted";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import ExpandMore from "@mui/icons-material/ExpandMore";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import LanguageOutlined from "@mui/icons-material/LanguageOutlined";
import PhoneIphoneOutlined from "@mui/icons-material/PhoneIphoneOutlined";
import QrCode2Outlined from "@mui/icons-material/QrCode2Outlined";
import SmartToyOutlined from "@mui/icons-material/SmartToyOutlined";
import {
  Box,
  Button,
  Card,
  Collapse,
  Container,
  IconButton,
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
  { title: "howStep4Title", body: "howStep4Body", optional: true },
];

const FOOTER_LINKS = [
  { href: "/privacy", key: "privacyLink" },
  { href: "/changelog", key: "changelogLink" },
  { href: "/how-to-use", key: "howToUseLink" },
];

const SPLIT_SIDES = [
  {
    id: "phone",
    title: "homeAppTitle",
    icon: PhoneIphoneOutlined,
    blurb: "homeAppBulletScore",
    bullets: [
      "homeAppBulletConcurrent",
      "homeAppBulletHistory",
      "homeAppBulletExport",
    ],
  },
  {
    id: "web",
    title: "homeWebTitle",
    icon: LanguageOutlined,
    blurb: "homeWebBulletAnalytics",
    bullets: [
      "homeWebBulletSingleGame",
      "homeWebBulletThrowaway",
      "homeWebBulletSourceOfTruth",
    ],
  },
];

const ANDROID_DISABLED = ANDROID_APP_URL == null;

/** Same side inset as the site header so home sections share one left edge. */
const PAGE_INSET = { xs: 1.5, sm: 2, md: 2.5 };
const PAGE_GAP = { xs: 5, md: 6 };

const SECTION_LABEL_SX = {
  color: "text.secondary",
  mb: 2,
};

function StoreLinkRow({
  t,
  href,
  label,
  icon,
  disabled = false,
  comingSoon = false,
  showSideQr = true,
  onShowQr,
}) {
  const isExternal = Boolean(href) && !disabled;

  return (
    <Stack direction="row" spacing={1} alignItems="stretch" sx={{ width: "100%" }}>
      <Button
        component={isExternal ? "a" : "button"}
        href={isExternal ? href : undefined}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        onClick={isExternal || disabled ? undefined : onShowQr}
        disabled={disabled}
        variant="contained"
        size="large"
        startIcon={icon}
        fullWidth
        sx={{
          justifyContent: "flex-start",
          "& .MuiButton-startIcon": { mr: 1.25 },
        }}
      >
        <Box
          component="span"
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <span>{label}</span>
          {comingSoon ? (
            <Typography
              component="span"
              variant="caption"
              sx={{
                textTransform: "uppercase",
                opacity: 0.85,
              }}
            >
              {t("qrComingSoon")}
            </Typography>
          ) : null}
        </Box>
      </Button>
      {showSideQr ? (
        <IconButton
          onClick={onShowQr}
          disabled={disabled}
          aria-label={t("qrShowAria", { name: label })}
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.common.white, 0.55),
          }}
        >
          <QrCode2Outlined />
        </IconButton>
      ) : null}
    </Stack>
  );
}

function AppDownloadLinks({ t }) {
  const [qr, setQr] = useState(null);

  return (
    <>
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        <StoreLinkRow
          t={t}
          href={IOS_APP_URL}
          label={t("homeAppStore")}
          icon={
            <Iconify
              icon="ion:logo-apple-appstore"
              sx={{ width: 28, height: 28 }}
            />
          }
          onShowQr={() =>
            setQr({ title: t("qrIos"), href: IOS_APP_URL })
          }
        />
        <StoreLinkRow
          t={t}
          href={ANDROID_APP_URL ?? undefined}
          label={t("homePlayStore")}
          disabled={ANDROID_DISABLED}
          comingSoon={ANDROID_DISABLED}
          icon={
            <Iconify
              icon="ion:logo-google-playstore"
              sx={{ width: 26, height: 26 }}
            />
          }
          onShowQr={() =>
            setQr({
              title: t("qrAndroid"),
              href: ANDROID_APP_URL,
              comingSoon: ANDROID_DISABLED,
            })
          }
        />
        <StoreLinkRow
          t={t}
          label={t("qrWebsite")}
          icon={<QrCode2Outlined sx={{ width: 26, height: 26 }} />}
          showSideQr={false}
          onShowQr={() => setQr({ title: t("qrWebsite"), href: SITE_URL })}
        />
      </Stack>

      <QrCodeDialog
        open={qr != null}
        onClose={() => setQr(null)}
        title={qr?.title ?? ""}
        href={qr?.href ?? null}
        comingSoon={Boolean(qr?.comingSoon)}
      />
    </>
  );
}

function FeatureRow({ t }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 1, sm: 2.5 }}
      alignItems={{ xs: "center", md: "flex-start" }}
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
        sx={SECTION_LABEL_SX}
      >
        {t("howItWorksTitle")}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {HOW_STEPS.map((step, index) => (
          <Box key={step.title}>
            {step.optional ? (
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  color: "secondary.main",
                  mb: 0.5,
                }}
              >
                {t("howStep4Badge")}
              </Typography>
            ) : (
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
            )}
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

function AppVsWebDetails({ t }) {
  const [openId, setOpenId] = useState(null);

  return (
    <Box>
      <Typography variant="overline" component="p" sx={SECTION_LABEL_SX}>
        {t("homeSplitToggleTitle")}
      </Typography>
      <Stack spacing={1.5}>
        {SPLIT_SIDES.map((side) => {
          const open = openId === side.id;
          const Icon = side.icon;
          return (
            <Card
              key={side.id}
              sx={{
                p: 2,
                borderColor: (theme) =>
                  open
                    ? alpha(theme.palette.primary.main, 0.28)
                    : "divider",
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 0.75 }}
              >
                <Icon sx={{ fontSize: 22, color: "primary.main" }} />
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, flex: 1 }}
                >
                  {t(side.title)}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 0.5 }}
              >
                {t(side.blurb)}
              </Typography>
              <Button
                onClick={() => setOpenId(open ? null : side.id)}
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
                  minWidth: 0,
                  mt: 0.25,
                  color: "primary.main",
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { backgroundColor: "transparent" },
                }}
              >
                {open ? t("howToUseClose") : t("howToUseSeeHow")}
              </Button>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <Box
                  component="ul"
                  sx={{
                    m: 0,
                    mt: 0.75,
                    pl: 2.25,
                    color: "text.secondary",
                    "& li": { mb: 0.65 },
                    "& li:last-child": { mb: 0 },
                  }}
                >
                  {side.bullets.map((key) => (
                    <Typography
                      key={key}
                      component="li"
                      variant="body2"
                      sx={{ color: "inherit" }}
                    >
                      {t(key)}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}

function GetTheApp({ t }) {
  return (
    <Box>
      <Typography variant="overline" component="p" sx={SECTION_LABEL_SX}>
        {t("homeGetAppTitle")}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          alignItems: "start",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) minmax(0, 420px)",
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", maxWidth: 400 }}
        >
          {t("homeGetAppBody")}
        </Typography>
        <AppDownloadLinks t={t} />
      </Box>
    </Box>
  );
}

export default function Dashboard({
  onPlayWithBots,
  onStartScorepad,
}) {
  const { t } = useTranslation();
  const hasMounted = useHasMounted();
  const isGameStarted = useRecoilValue(isGameStartedRecoil);
  // Persist only after mount so SSR HTML matches the first client paint.
  const matchInProgress = hasMounted && isGameStarted;

  return (
    <Container
      maxWidth="lg"
      disableGutters
      sx={{ px: PAGE_INSET, py: PAGE_GAP }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Stack spacing={PAGE_GAP}>
          <Box
            sx={{
              display: "grid",
              gap: PAGE_GAP,
              alignItems: "center",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
            }}
          >
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                spacing={-0.5}
                justifyContent={{ xs: "center", md: "flex-start" }}
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

              <Stack spacing={1.5}>
                <Typography
                  variant="h2"
                  sx={{
                    color: "text.primary",
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
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
                p: { xs: 2.5, sm: 3 },
                backgroundColor: "background.paper",
                borderColor: "divider",
              }}
            >
              <Stack spacing={2.5}>
                <Stack spacing={1}>
                  <Typography variant="h5" sx={{ color: "text.primary" }}>
                    {t("readyTitle")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary" }}
                  >
                    {t("readyBody")}
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.28),
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.06),
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, color: "text.primary", mb: 0.35 }}
                    >
                      {t("playWithBots")}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        mb: 1.25,
                        lineHeight: 1.4,
                      }}
                    >
                      {t("playWithBotsBody")}
                    </Typography>
                    <Button
                      onClick={onPlayWithBots}
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<SmartToyOutlined />}
                      sx={{ fontSize: 15 }}
                    >
                      {t("playWithBotsCta")}
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: (theme) =>
                        alpha(
                          theme.palette[
                            matchInProgress ? "secondary" : "grey"
                          ][matchInProgress ? "main" : 600],
                          matchInProgress ? 0.35 : 0.2
                        ),
                      backgroundColor: (theme) =>
                        matchInProgress
                          ? alpha(theme.palette.secondary.main, 0.08)
                          : alpha(theme.palette.grey[500], 0.04),
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, color: "text.primary", mb: 0.35 }}
                    >
                      {t("scoreNotepad")}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        mb: 1.25,
                        lineHeight: 1.4,
                      }}
                    >
                      {t(
                        matchInProgress
                          ? "continueReadyBody"
                          : "scoreNotepadBody"
                      )}
                    </Typography>
                    <Button
                      onClick={onStartScorepad}
                      variant={matchInProgress ? "contained" : "outlined"}
                      color={matchInProgress ? "secondary" : "primary"}
                      size="large"
                      fullWidth
                      startIcon={<EditNoteOutlined />}
                      sx={{ fontSize: 15 }}
                    >
                      {t(
                        matchInProgress
                          ? "continueScoreNotepad"
                          : "scoreNotepadCta"
                      )}
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            </Card>
          </Box>

          <HowItWorks t={t} />

          <AppVsWebDetails t={t} />

          <GetTheApp t={t} />

          <Stack spacing={1.5} alignItems="center">
            <Typography
              variant="overline"
              sx={{ color: "text.disabled" }}
            >
              {t("madeForTheTable")}
            </Typography>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
            >
              {FOOTER_LINKS.map(({ href, key }, index) => (
                <Stack
                  key={href}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  {index > 0 && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ color: "text.disabled" }}
                    >
                      ·
                    </Typography>
                  )}
                  <Typography
                    component={Link}
                    href={href}
                    variant="caption"
                    sx={{
                      color: "text.disabled",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                      "&:hover": { color: "text.secondary" },
                    }}
                  >
                    {t(key)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </motion.div>
    </Container>
  );
}
