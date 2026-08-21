"use client";

import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  gamesPlayedForPlayer,
  listHiddenPlayers,
} from "@/lib/analytics/playerVisibility";
import type { PlayerRow } from "@/lib/analytics/types";
import { useTranslation } from "@/i18n/useTranslation";
import { statsDataDrawerOpenRecoil } from "@/recoil/recoilState";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";
import { useSetRecoilState } from "recoil";

function sortByName(players: PlayerRow[]) {
  return players.slice().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Restore people the phone hid (is_hidden=1). Used on Tools.
 */
export default function RestoreHiddenPlayersPanel() {
  const { t } = useTranslation();
  const { data, activeDataset, restoreHiddenPlayer } = useAnalytics();
  const openDataDrawer = useSetRecoilState(statsDataDrawerOpenRecoil);

  const hiddenPlayers = useMemo(
    () => (data ? sortByName(listHiddenPlayers(data.players)) : []),
    [data]
  );

  return (
    <Stack spacing={2} sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("datasetsHiddenPlayersTitle")}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.35 }}
        >
          {t("datasetsHiddenPlayersHint")}
        </Typography>
        {activeDataset ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.75 }}
          >
            {t("dashboardViewingDataset", { name: activeDataset.displayName })}
          </Typography>
        ) : null}
      </Box>

      {!data ? (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <Typography color="text.secondary">
            {t("toolsRestoreNeedData")}
          </Typography>
          <Button
            size="small"
            sx={{ mt: 1 }}
            startIcon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
            onClick={() => openDataDrawer(true)}
          >
            {t("statsManageData")}
          </Button>
        </Box>
      ) : hiddenPlayers.length === 0 ? (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Typography color="text.secondary">
            {t("toolsRestoreEmpty")}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.75}>
          {hiddenPlayers.map((player) => {
            const games = gamesPlayedForPlayer(data, player.id);
            return (
              <Box
                key={player.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.25,
                  py: 0.85,
                  borderRadius: 1.5,
                  border: "1px dashed",
                  borderColor: "divider",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.common.white, 0.5),
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600 }}>
                    {player.name}
                  </Typography>
                  {games > 0 ? (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {t("datasetsHiddenPlayerGames", { n: games })}
                    </Typography>
                  ) : null}
                </Box>
                <Button
                  size="small"
                  onClick={() => restoreHiddenPlayer(player.id)}
                  sx={{ flexShrink: 0 }}
                >
                  {t("datasetsRestorePlayer")}
                </Button>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
