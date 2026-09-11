"use client";

import {
  STYLE_POINT_IDS,
  STYLE_POINT_LABEL_KEY,
  formatStylePoint,
  type StylePoints,
} from "@/lib/analytics/stylePoints";
import { useTranslation } from "@/i18n/useTranslation";
import { Stack, Typography } from "@mui/material";

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
            {t(STYLE_POINT_LABEL_KEY[id])}
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
