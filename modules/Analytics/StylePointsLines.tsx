"use client";

import {
  STYLE_POINT_IDS,
  formatStylePoint,
  type StylePointId,
  type StylePoints,
} from "@/lib/analytics/stylePoints";
import { useTranslation } from "@/i18n/useTranslation";
import { Stack, Typography } from "@mui/material";

const LABEL_KEY: Record<StylePointId, string> = {
  maxDataFor: "statsStyleMaxDataFor",
  minDataFor: "statsStyleMinDataFor",
  maxDataAgainst: "statsStyleMaxDataAgainst",
  minDataAgainst: "statsStyleMinDataAgainst",
  maxDatasToWin: "statsStyleMaxDatasToWin",
  minDatasToWin: "statsStyleMinDatasToWin",
  maxDatasToLose: "statsStyleMaxDatasToLose",
  minDatasToLose: "statsStyleMinDatasToLose",
};

export function StylePointsLines({
  points,
}: {
  points: StylePoints | null | undefined;
}) {
  const { t } = useTranslation();

  if (!points) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {t("statsNoData")}
      </Typography>
    );
  }

  return (
    <Stack>
      {STYLE_POINT_IDS.map((id) => (
        <Stack
          key={id}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ py: 0.4 }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(LABEL_KEY[id])}
          </Typography>
          <Typography
            sx={{
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatStylePoint(id, points[id])}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
