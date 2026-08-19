"use client";

import type { OpenTablePlayerLine } from "@/lib/analytics/openTableBoard";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function OpenTableBoard({
  lines,
}: {
  lines: OpenTablePlayerLine[];
}) {
  const { t } = useTranslation();
  const leaderWins = Math.max(0, ...lines.map((row) => row.gamesWon));
  const polloMark = String(t("pollo")).charAt(0);
  const zapatoMark = String(t("zapato")).charAt(0);

  if (lines.length === 0) return null;

  return (
    <Box sx={{ mt: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          pb: 0.5,
          px: 1,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            flex: 1,
            minWidth: 0,
            color: "text.disabled",
            textAlign: "left",
            pr: 1,
            lineHeight: 1.2,
          }}
        />
        <HeaderCell width={36}>{t("statsAbbrGamesWon")}</HeaderCell>
        <HeaderCell width={52}>{t("statsAbbrWinLoss")}</HeaderCell>
        <HeaderCell width={28}>{polloMark}</HeaderCell>
        <HeaderCell width={28}>{zapatoMark}</HeaderCell>
      </Box>

      {lines.map((row) => {
        const isLeading = row.gamesWon > 0 && row.gamesWon === leaderWins;
        return (
          <Box
            key={row.nameKey}
            sx={{
              display: "flex",
              alignItems: "center",
              py: 0.85,
              px: 1,
              borderRadius: 1,
              bgcolor: isLeading
                ? (theme) => alpha(theme.palette.primary.main, 0.08)
                : "transparent",
            }}
          >
            <Typography
              sx={{
                flex: 1,
                minWidth: 0,
                pr: 1,
                fontSize: 14,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.name}
            </Typography>
            <StatCell width={36}>{row.gamesWon}</StatCell>
            <StatCell width={52}>
              {t("statsRecord", {
                wins: row.gamesWon,
                losses: row.gamesLost,
              })}
            </StatCell>
            <StatCell width={28}>{row.pollosFor}</StatCell>
            <StatCell width={28}>{row.zapatosFor}</StatCell>
          </Box>
        );
      })}
    </Box>
  );
}

function HeaderCell({
  width,
  children,
}: {
  width: number;
  children: string;
}) {
  return (
    <Typography
      variant="overline"
      sx={{
        width,
        flexShrink: 0,
        color: "text.disabled",
        textAlign: "right",
        lineHeight: 1.2,
      }}
    >
      {children}
    </Typography>
  );
}

function StatCell({
  width,
  children,
}: {
  width: number;
  children: number | string;
}) {
  return (
    <Typography
      sx={{
        width,
        flexShrink: 0,
        fontSize: 13,
        lineHeight: 1.35,
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </Typography>
  );
}
