"use client";

import {
  hasFullPadPayload,
  matchDetailFromLiveSnapshot,
} from "@/lib/liveWatch/fromSnapshot";
import type { LiveWatchSnapshot } from "@/lib/liveWatch/types";
import { sessionStatsFromDetail } from "@/lib/analytics/sessionStats";
import { stylePointsFromDetail } from "@/lib/analytics/stylePoints";
import HistorySessionStats from "@/modules/History/HistorySessionStats";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Typography } from "@mui/material";
import { useMemo } from "react";

/**
 * Same right-rail chrome as /history/[id] — stats + style points recomputed
 * in the browser on every snapshot update.
 */
export default function LiveWatchStatsPanel({
  snapshot,
}: {
  snapshot: LiveWatchSnapshot;
}) {
  const { t } = useTranslation();

  const { session, styleByPlayerId } = useMemo(() => {
    if (!hasFullPadPayload(snapshot)) {
      return { session: null, styleByPlayerId: null };
    }
    const detail = matchDetailFromLiveSnapshot(snapshot);
    if (!detail) return { session: null, styleByPlayerId: null };
    return {
      session: sessionStatsFromDetail(detail),
      styleByPlayerId: stylePointsFromDetail(detail),
    };
  }, [snapshot]);

  if (!session || session.players.length === 0) {
    return (
      <Box
        component="aside"
        sx={{
          width: { xs: "100%", md: 320, lg: 380 },
          flexShrink: 0,
          borderLeft: { xs: "none", md: "1px solid #C0C0C0" },
          borderTop: { xs: "1px solid #C0C0C0", md: "none" },
          px: 2,
          py: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t("liveWatchStatsPending")}
        </Typography>
      </Box>
    );
  }

  return (
    <HistorySessionStats session={session} styleByPlayerId={styleByPlayerId} />
  );
}
