"use client";

import {
  hasFullPadPayload,
  matchDetailFromLiveSnapshot,
} from "@/lib/liveWatch/fromSnapshot";
import type { LiveWatchSnapshot } from "@/lib/liveWatch/types";
import { sessionStatsFromDetail } from "@/lib/analytics/sessionStats";
import { stylePointsFromDetail } from "@/lib/analytics/stylePoints";
import {
  SidebarDrawer,
  SidebarOpenButton,
  useMdUp,
} from "@/modules/Analytics/SidebarSheet";
import HistorySessionStats from "@/modules/History/HistorySessionStats";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";

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
  const isDesktop = useMdUp();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const openDrawer = useCallback(() => setOpen(true), []);

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
    const pending = (
      <Typography variant="body2" color="text.secondary">
        {t("liveWatchStatsPending")}
      </Typography>
    );
    if (!isDesktop) {
      return (
        <Box sx={{ flexShrink: 0 }}>
          <SidebarOpenButton
            label={t("historySessionStatsTitle")}
            onClick={openDrawer}
          />
          <SidebarDrawer
            open={open}
            onOpen={openDrawer}
            onClose={close}
            title={t("historySessionStatsTitle")}
            anchor="right"
          >
            <Box sx={{ px: 2, py: 2 }}>{pending}</Box>
          </SidebarDrawer>
        </Box>
      );
    }
    return (
      <Box
        component="aside"
        sx={{
          width: { md: 320, lg: 380 },
          flexShrink: 0,
          borderLeft: "1px solid #C0C0C0",
          px: 2,
          py: 2,
        }}
      >
        {pending}
      </Box>
    );
  }

  return (
    <HistorySessionStats session={session} styleByPlayerId={styleByPlayerId} />
  );
}
