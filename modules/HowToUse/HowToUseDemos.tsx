"use client";

import DominoTile from "@/components/DominoTile";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

export type HowToUseDemoId =
  | "intro"
  | "notepad"
  | "play"
  | "save"
  | "history"
  | "stats"
  | "leaderboard"
  | "compare"
  | "podium"
  | "phone";

function DemoFrame({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        pointerEvents: "none",
        mt: 0.5,
        p: 1.5,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.text.primary, 0.12),
        bgcolor: (theme) => alpha(theme.palette.background.default, 0.65),
      }}
    >
      <Typography
        variant="overline"
        sx={{
          display: "block",
          textAlign: "center",
          color: "text.secondary",
          letterSpacing: "0.08em",
          mb: 1,
        }}
      >
        {caption}
      </Typography>
      {children}
    </Box>
  );
}

function IntroDemo() {
  const { t } = useTranslation();
  const tiles = [
    { top: 9, bottom: 9, rotate: -8 },
    { top: 6, bottom: 3, rotate: -3 },
    { top: 5, bottom: 5, rotate: 3 },
    { top: 2, bottom: 7, rotate: 8 },
  ];
  return (
    <DemoFrame caption={t("howToUseDemoIntroCaption")}>
      <Stack direction="row" justifyContent="center" sx={{ py: 0.5 }}>
        {tiles.map((tile) => (
          <Box
            key={`${tile.top}-${tile.bottom}`}
            sx={{ mx: "-2px", transform: `rotate(${tile.rotate}deg)` }}
          >
            <DominoTile top={tile.top} bottom={tile.bottom} size={30} />
          </Box>
        ))}
      </Stack>
    </DemoFrame>
  );
}

function HandCell({
  points,
  take,
  color,
}: {
  points: number;
  take: number;
  color: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 1,
        py: 0.2,
        borderBottom: "1px dashed",
        borderColor: (theme) => alpha(theme.palette.text.primary, 0.12),
      }}
    >
      <Typography
        sx={{
          fontFamily: "var(--font-hand), cursive",
          fontSize: 18,
          fontWeight: 700,
          color,
        }}
      >
        {points}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        {take}
      </Typography>
    </Box>
  );
}

function NotepadDemo() {
  const { t } = useTranslation();
  return (
    <DemoFrame caption={t("howToUseDemoScorepadCaption")}>
      <Stack direction="row" spacing={1.5}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            {t("team", { n: 1 })}
          </Typography>
          <HandCell points={50} take={1} color="primary.main" />
          <HandCell points={45} take={3} color="primary.main" />
          <HandCell points={55} take={4} color="primary.main" />
          <Typography
            sx={{
              mt: 0.75,
              fontFamily: "var(--font-hand), cursive",
              fontSize: 22,
              fontWeight: 700,
              color: "primary.main",
            }}
          >
            150
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" sx={{ color: "secondary.main" }}>
            {t("team", { n: 2 })}
          </Typography>
          <HandCell points={30} take={2} color="secondary.main" />
          <HandCell points={40} take={5} color="secondary.main" />
          <Typography
            sx={{
              mt: 0.75,
              fontFamily: "var(--font-hand), cursive",
              fontSize: 22,
              fontWeight: 700,
              color: "secondary.main",
            }}
          >
            70
          </Typography>
        </Box>
      </Stack>
    </DemoFrame>
  );
}

function PlayDemo() {
  const { t } = useTranslation();
  const train = [
    { top: 3, bottom: 6, orientation: "horizontal" as const },
    { top: 6, bottom: 6, orientation: "vertical" as const },
    { top: 6, bottom: 1, orientation: "horizontal" as const },
    { top: 1, bottom: 4, orientation: "horizontal" as const },
  ];
  return (
    <DemoFrame caption={t("howToUseDemoBotsCaption")}>
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        justifyContent="center"
        sx={{ py: 0.5 }}
      >
        {train.map((tile, index) => (
          <DominoTile
            key={`${tile.top}-${tile.bottom}-${index}`}
            top={tile.top}
            bottom={tile.bottom}
            size={26}
            orientation={tile.orientation}
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1 }}>
        <Chip size="small" label={t("mode2v2")} color="primary" variant="outlined" />
        <Chip size="small" label="55" color="secondary" variant="outlined" />
      </Stack>
    </DemoFrame>
  );
}

function SaveDemo() {
  const { t } = useTranslation();
  return (
    <DemoFrame caption={t("howToUseDemoSaveCaption")}>
      <Box
        sx={{
          py: 2,
          px: 1.5,
          borderRadius: 1.5,
          border: "1.5px dashed",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.45),
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
          textAlign: "center",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
          {t("howToUseDemoCsvName")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {t("analyticsUploadHint")}
        </Typography>
      </Box>
    </DemoFrame>
  );
}

function HistoryDemo() {
  const { t } = useTranslation();
  return (
    <DemoFrame caption={t("howToUseDemoHistoryCaption")}>
      <Box
        sx={{
          p: 1.25,
          borderRadius: 1.25,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          Fri · 8:42 PM
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.25 }}>
          {t("team", { n: 1 })} 2 – 1 {t("team", { n: 2 })}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          2 vs 2 · 55 · 150
        </Typography>
        <Box sx={{ mt: 0.75 }}>
          <Chip
            size="small"
            label={`🐔 ${t("pollo")}`}
            color="secondary"
            variant="outlined"
          />
        </Box>
      </Box>
    </DemoFrame>
  );
}

function StatsDemo() {
  const { t } = useTranslation();
  return (
    <DemoFrame caption={t("howToUseDemoStatsCaption")}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Ana
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("statsRecord", { wins: 12, losses: 4 })}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontFamily: (theme) => theme.typography.h2.fontFamily,
            fontWeight: 700,
            fontSize: 22,
            color: "primary.main",
          }}
        >
          18.4
        </Typography>
      </Stack>
      <Stack spacing={0.4} sx={{ mt: 1 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("statsAbbrPointsDifference")}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
            +240
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("statsAbbrPollosDifference")}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
            +3
          </Typography>
        </Stack>
      </Stack>
    </DemoFrame>
  );
}

function LeaderboardDemo() {
  const { t } = useTranslation();
  const rows = [
    { rank: "1", name: "Ana", r: "18.4" },
    { rank: "2", name: "Luis", r: "11.2" },
    { rank: "3", name: "Pedro", r: "4.1" },
  ];
  return (
    <DemoFrame caption={t("howToUseDemoLeaderboardCaption")}>
      <Stack spacing={0.65}>
        {rows.map((row) => (
          <Stack
            key={row.rank}
            direction="row"
            alignItems="center"
            spacing={1.25}
          >
            <Typography
              sx={{
                width: 18,
                fontFamily: (theme) => theme.typography.h2.fontFamily,
                fontWeight: 700,
                color: "text.disabled",
              }}
            >
              {row.rank}
            </Typography>
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
              {row.name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
              {row.r}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </DemoFrame>
  );
}

function CompareDemo() {
  const { t } = useTranslation();
  return (
    <DemoFrame caption={t("howToUseDemoCompareCaption")}>
      <Stack direction="row" spacing={1.5}>
        {[
          { name: "Ana", rec: t("statsRecord", { wins: 12, losses: 4 }), r: "18.4" },
          { name: "Luis", rec: t("statsRecord", { wins: 9, losses: 7 }), r: "11.2" },
        ].map((col) => (
          <Box
            key={col.name}
            sx={{
              flex: 1,
              p: 1,
              borderRadius: 1.25,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {col.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              {col.rec}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main", mt: 0.5 }}>
              {col.r}
            </Typography>
          </Box>
        ))}
      </Stack>
    </DemoFrame>
  );
}

function PodiumDemo() {
  const { t } = useTranslation();
  return (
    <DemoFrame caption={t("howToUseDemoPodiumCaption")}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {t("podiumPollosTitle")}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
        {t("howToUseDemoPodiumSub")}
      </Typography>
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">
            {t("podiumFirst")} · Ana
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            7
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">
            {t("podiumSecond")} · Luis
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            4
          </Typography>
        </Stack>
      </Stack>
    </DemoFrame>
  );
}

function PhoneDemo() {
  const { t } = useTranslation();
  return (
    <DemoFrame caption={t("howToUseDemoPhoneCaption")}>
      <Box
        sx={{
          mx: "auto",
          width: 132,
          borderRadius: "18px",
          border: "2px solid",
          borderColor: (theme) => alpha(theme.palette.text.primary, 0.35),
          bgcolor: "background.paper",
          p: 1,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 5,
            borderRadius: 4,
            bgcolor: (theme) => alpha(theme.palette.text.primary, 0.18),
            mx: "auto",
            mb: 1,
          }}
        />
        <Typography
          variant="caption"
          sx={{ display: "block", fontWeight: 800, textAlign: "center", mb: 0.75 }}
        >
          {t("scoreNotepad")}
        </Typography>
        <Stack direction="row" spacing={0.75}>
          <Box sx={{ flex: 1, height: 36, borderRadius: 0.75, bgcolor: "primary.light", opacity: 0.45 }} />
          <Box sx={{ flex: 1, height: 28, borderRadius: 0.75, bgcolor: "secondary.light", opacity: 0.45 }} />
        </Stack>
      </Box>
    </DemoFrame>
  );
}

export function HowToUseDemo({ id }: { id: HowToUseDemoId }) {
  switch (id) {
    case "intro":
      return <IntroDemo />;
    case "notepad":
      return <NotepadDemo />;
    case "play":
      return <PlayDemo />;
    case "save":
      return <SaveDemo />;
    case "history":
      return <HistoryDemo />;
    case "stats":
      return <StatsDemo />;
    case "leaderboard":
      return <LeaderboardDemo />;
    case "compare":
      return <CompareDemo />;
    case "podium":
      return <PodiumDemo />;
    case "phone":
      return <PhoneDemo />;
    default: {
      const _never: never = id;
      return _never;
    }
  }
}
