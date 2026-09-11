"use client";

import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  gamesPlayedForPlayer,
  listHiddenPlayers,
  listVisiblePlayers,
} from "@/lib/analytics/playerVisibility";
import type { PlayerRow } from "@/lib/analytics/types";
import { useTranslation } from "@/i18n/useTranslation";
import { ToolsPanelHeader, ToolsQuietCard, toolsPaperSx } from "@/modules/Analytics/ToolsChrome";
import ToolsNeedData from "@/modules/Analytics/ToolsNeedData";
import {
  Box,
  Button,
  Checkbox,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

function sortByName(players: PlayerRow[]) {
  return players.slice().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Hide / show the active roster from Tools (bulk + per player).
 */
export default function RestoreHiddenPlayersPanel() {
  const { t } = useTranslation();
  const {
    data,
    activeDataset,
    hidePlayer,
    restoreHiddenPlayer,
    setPlayersHidden,
  } = useAnalytics();
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  const visiblePlayers = useMemo(
    () => (data ? sortByName(listVisiblePlayers(data.players)) : []),
    [data]
  );
  const hiddenPlayers = useMemo(
    () => (data ? sortByName(listHiddenPlayers(data.players)) : []),
    [data]
  );

  const selectedVisible = visiblePlayers.filter((player) =>
    selected.has(player.id)
  );
  const selectedHidden = hiddenPlayers.filter((player) =>
    selected.has(player.id)
  );

  const toggle = (playerId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const hideSelected = () => {
    setPlayersHidden(
      selectedVisible.map((player) => player.id),
      true
    );
    setSelected(new Set());
  };

  const showSelected = () => {
    setPlayersHidden(
      selectedHidden.map((player) => player.id),
      false
    );
    setSelected(new Set());
  };

  return (
    <Stack spacing={2} sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <ToolsPanelHeader
        overline={t("toolsRestoreKicker")}
        title={t("toolsRosterTitle")}
        hint={t("toolsRosterHint")}
        extra={
          activeDataset ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.75 }}
            >
              {t("dashboardViewingDataset", { name: activeDataset.displayName })}
            </Typography>
          ) : null
        }
      />

      {!data ? (
        <ToolsNeedData />
      ) : (
        <>
          {selectedVisible.length > 0 || selectedHidden.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selectedVisible.length > 0 ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={hideSelected}
                  sx={{
                    alignSelf: { xs: "stretch", md: "flex-start" },
                    width: { xs: "100%", md: "auto" },
                  }}
                >
                  {t("toolsRosterHideSelected", { n: selectedVisible.length })}
                </Button>
              ) : null}
              {selectedHidden.length > 0 ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={showSelected}
                  sx={{
                    alignSelf: { xs: "stretch", md: "flex-start" },
                    width: { xs: "100%", md: "auto" },
                  }}
                >
                  {t("toolsRosterShowSelected", { n: selectedHidden.length })}
                </Button>
              ) : null}
            </Stack>
          ) : null}

          <RosterGrid
            title={t("toolsRosterVisible")}
            empty={t("toolsRosterVisibleEmpty")}
            players={visiblePlayers}
            selected={selected}
            onToggle={toggle}
            actionLabel={t("toolsRosterHide")}
            onAction={(player) => hidePlayer(player.id)}
            dashed={false}
            gamesFor={(player) => gamesPlayedForPlayer(data, player.id)}
            gamesLabel={(n) => t("datasetsHiddenPlayerGames", { n })}
          />

          <RosterGrid
            title={t("datasetsHiddenPlayersTitle")}
            empty={t("toolsRestoreEmpty")}
            players={hiddenPlayers}
            selected={selected}
            onToggle={toggle}
            actionLabel={t("toolsRosterShow")}
            onAction={(player) => restoreHiddenPlayer(player.id)}
            dashed
            gamesFor={(player) => gamesPlayedForPlayer(data, player.id)}
            gamesLabel={(n) => t("datasetsHiddenPlayerGames", { n })}
          />
        </>
      )}
    </Stack>
  );
}

function RosterGrid({
  title,
  empty,
  players,
  selected,
  onToggle,
  actionLabel,
  onAction,
  dashed,
  gamesFor,
  gamesLabel,
}: {
  title: string;
  empty: string;
  players: PlayerRow[];
  selected: Set<number>;
  onToggle: (playerId: number) => void;
  actionLabel: string;
  onAction: (player: PlayerRow) => void;
  dashed: boolean;
  gamesFor: (player: PlayerRow) => number;
  gamesLabel: (n: number) => string;
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      {players.length === 0 ? (
        <ToolsQuietCard>{empty}</ToolsQuietCard>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          {players.map((player) => {
            const games = gamesFor(player);
            const checked = selected.has(player.id);
            return (
              <Box
                key={player.id}
                sx={[
                  toolsPaperSx({
                    dashed,
                    selected: checked,
                  }),
                  {
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.65,
                  },
                ]}
              >
                <Checkbox
                  size="small"
                  checked={checked}
                  onChange={() => onToggle(player.id)}
                  inputProps={{ "aria-label": player.name }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600 }}>
                    {player.name}
                  </Typography>
                  {games > 0 ? (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {gamesLabel(games)}
                    </Typography>
                  ) : null}
                </Box>
                <Button
                  size="small"
                  onClick={() => onAction(player)}
                  sx={{ flexShrink: 0 }}
                >
                  {actionLabel}
                </Button>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
