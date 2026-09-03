"use client";

import { APP_UI_SIGNATURE } from "@/lib/analytics/dbMeta";
import { useTranslation } from "@/i18n/useTranslation";
import { HowToUseDemo, type HowToUseDemoId } from "@/modules/HowToUse/HowToUseDemos";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import LeaderboardOutlined from "@mui/icons-material/LeaderboardOutlined";
import PhoneIphoneOutlined from "@mui/icons-material/PhoneIphoneOutlined";
import SmartToyOutlined from "@mui/icons-material/SmartToyOutlined";
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
import Link from "next/link";
import { useState, type ComponentType } from "react";

type Section = {
  id: HowToUseDemoId;
  icon: ComponentType<{ sx?: object }>;
  title: string;
  blurb: string;
  detail: string;
};

const SECTIONS: Section[] = [
  {
    id: "intro",
    icon: InfoOutlined,
    title: "howToUseTitle",
    blurb: "howToUseIntro",
    detail: "howToUseIntroDetail",
  },
  {
    id: "notepad",
    icon: EditNoteOutlined,
    title: "howToUseNotepadTitle",
    blurb: "howToUseNotepadBody",
    detail: "howToUseNotepadDetail",
  },
  {
    id: "play",
    icon: SmartToyOutlined,
    title: "howToUsePlayTitle",
    blurb: "howToUsePlayBody",
    detail: "howToUsePlayDetail",
  },
  {
    id: "save",
    icon: CloudUploadOutlined,
    title: "howToUseSaveTitle",
    blurb: "howToUseSaveBody",
    detail: "howToUseSaveDetail",
  },
  {
    id: "history",
    icon: HistoryOutlined,
    title: "historyNav",
    blurb: "howToUsePageHistory",
    detail: "howToUseHistoryDetail",
  },
  {
    id: "stats",
    icon: BarChartOutlined,
    title: "statsNav",
    blurb: "howToUsePageStats",
    detail: "howToUseStatsDetail",
  },
  {
    id: "leaderboard",
    icon: LeaderboardOutlined,
    title: "leaderboardNav",
    blurb: "howToUsePageLeaderboard",
    detail: "howToUseLeaderboardDetail",
  },
  {
    id: "compare",
    icon: CompareArrowsOutlined,
    title: "compareNav",
    blurb: "howToUsePageCompare",
    detail: "howToUseCompareDetail",
  },
  {
    id: "podium",
    icon: EmojiEventsOutlined,
    title: "podiumNav",
    blurb: "howToUsePagePodium",
    detail: "howToUsePodiumDetail",
  },
  {
    id: "phone",
    icon: PhoneIphoneOutlined,
    title: "howToUsePhoneTitle",
    blurb: "howToUsePhoneBody",
    detail: "howToUsePhoneDetail",
  },
];

export default function HowToUse() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<HowToUseDemoId | null>(null);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6 } }}>
      <Typography
        component={Link}
        href="/"
        variant="body2"
        sx={{
          display: "inline-block",
          mb: 3,
          color: "text.secondary",
          textDecoration: "underline",
          textUnderlineOffset: 2,
          "&:hover": { color: "primary.main" },
        }}
      >
        ← Olympus Dominoes
      </Typography>

      <Stack spacing={1.5}>
        <Box sx={{ pb: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.75 }}>
            {t("howToUseTitle")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {APP_UI_SIGNATURE}
          </Typography>
        </Box>

        {SECTIONS.map((section) => {
          const open = openId === section.id;
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              sx={{
                p: 2,
                borderColor: (theme) =>
                  open
                    ? alpha(theme.palette.primary.main, 0.28)
                    : "divider",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                <Icon sx={{ fontSize: 22, color: "primary.main" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                  {t(section.title)}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                {t(section.blurb)}
              </Typography>
              <Button
                onClick={() => setOpenId(open ? null : section.id)}
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
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", mt: 0.75, mb: 0.5, lineHeight: 1.55 }}
                >
                  {t(section.detail)}
                </Typography>
                <HowToUseDemo id={section.id} />
              </Collapse>
            </Card>
          );
        })}

        <Box
          sx={{
            mt: 1,
            px: 2.25,
            py: 2,
            borderRadius: 2,
            borderLeft: "4px solid",
            borderLeftColor: "secondary.main",
            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
          }}
        >
          <Typography
            variant="overline"
            sx={{
              display: "block",
              color: "secondary.dark",
              letterSpacing: "0.1em",
              fontWeight: 800,
              mb: 0.75,
            }}
          >
            {t("howToUseJoseNoteLabel")}
          </Typography>
          <Typography
            sx={{
              fontFamily: "var(--font-hand), cursive",
              fontSize: 20,
              lineHeight: 1.35,
              color: "secondary.dark",
            }}
          >
            {t("howToUseJoseNote")}
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
