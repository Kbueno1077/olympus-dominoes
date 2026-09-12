"use client";

import {
  JOSES_ACCENT,
  dashboardAsideSx,
} from "@/modules/Analytics/dashboardChrome";
import {
  BREAKDOWN_STAT_DEFS,
  breakdownValueColor,
  formatBreakdownValue,
} from "@/lib/analytics/statBreakdown";
import {
  type SessionPlayerRow,
  type SessionStats,
  type SessionTeamGroup,
} from "@/lib/analytics/sessionStats";
import type { StylePoints } from "@/lib/analytics/stylePoints";
import { StylePointsLines } from "@/modules/Analytics/StylePointsLines";
import {
  formatSignedDiff,
  signedDiffColor,
} from "@/lib/analytics/signedDiff";
import { useTranslation } from "@/i18n/useTranslation";
import {
  SidebarDrawer,
  SidebarOpenButton,
  useAsideDesktop,
  type AsideDesktopAt,
} from "@/modules/Analytics/SidebarSheet";
import { TEAM_KEYS } from "@/utils/matchSettings";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";

type Props = {
  session: SessionStats;
  styleByPlayerId?: Map<number, StylePoints> | null;
  desktopAt?: AsideDesktopAt;
};

function teamPaletteKey(teamNumber: number): string {
  return (TEAM_KEYS as Record<number, string>)[teamNumber] ?? "team1";
}

/**
 * Right rail for /history/[id]: this night only, these seats, full breakdown.
 */
export default function HistorySessionStats({
  session,
  styleByPlayerId,
  desktopAt = "md",
}: Props) {
  const { t } = useTranslation();
  const isDesktop = useAsideDesktop(desktopAt);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const [selectedKey, setSelectedKey] = useState(
    () => session.players[0]?.key ?? ""
  );

  useEffect(() => {
    const stillThere = session.players.some((row) => row.key === selectedKey);
    if (!stillThere) setSelectedKey(session.players[0]?.key ?? "");
  }, [session.matchId, session.players, selectedKey]);

  const selected =
    session.players.find((row) => row.key === selectedKey) ??
    session.players[0] ??
    null;

  const body = (
    <Box
      sx={{
        px: 1.25,
        pb: 2,
        flex: 1,
        minHeight: 0,
        overflow: { xs: "visible", md: "auto" },
        overscrollBehavior: { md: "contain" },
      }}
    >
      {session.players.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", px: 1, py: 2 }}
        >
          {t("historySessionStatsEmpty")}
        </Typography>
      ) : (
        <Stack spacing={2}>
          <Stack spacing={1.25}>
            {session.teams.map((team) => (
              <TeamBlock
                key={team.teamNumber}
                team={team}
                selectedKey={selected?.key ?? ""}
                onSelect={setSelectedKey}
              />
            ))}
          </Stack>

          {selected ? (
            <SelectedBreakdown
              player={selected}
              style={
                selected.playerId != null
                  ? (styleByPlayerId?.get(selected.playerId) ?? null)
                  : null
              }
            />
          ) : null}
        </Stack>
      )}
    </Box>
  );

  if (!isDesktop) {
    return (
      <Box sx={{ flexShrink: 0 }}>
        <SidebarOpenButton
          label={t("historySessionStatsTitle")}
          onClick={openDrawer}
          desktopAt={desktopAt}
        />
        <SidebarDrawer
          open={drawerOpen}
          onOpen={openDrawer}
          onClose={closeDrawer}
          title={t("historySessionStatsTitle")}
          subtitle={t("historySessionStatsHint")}
          anchor="right"
        >
          {body}
        </SidebarDrawer>
      </Box>
    );
  }

  return (
    <Box
      component="aside"
      sx={{
        ...dashboardAsideSx,
        borderRight: "none",
        borderLeft: "1px solid #C0C0C0",
        borderTop: "none",
        borderBottom: "none",
        width: { md: 320, lg: 380 },
      }}
    >
      <Box sx={{ px: 2, pt: 3, pb: 1.5 }}>
        <Typography variant="h5" sx={{ mb: 0.25 }}>
          {t("historySessionStatsTitle")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("historySessionStatsHint")}
        </Typography>
      </Box>
      {body}
    </Box>
  );
}

function TeamBlock({
  team,
  selectedKey,
  onSelect,
}: {
  team: SessionTeamGroup;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation();
  const teamKey = teamPaletteKey(team.teamNumber);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: (theme: Theme) =>
          alpha((theme.palette as any)[teamKey].main, 0.35),
        backgroundColor: (theme: Theme) =>
          alpha((theme.palette as any)[teamKey].main, 0.08),
        overflow: "hidden",
      }}
    >
      <Typography
        sx={{
          px: 1.25,
          pt: 0.85,
          pb: 0.35,
          fontWeight: 700,
          fontSize: 13,
          color: (theme: Theme) => (theme.palette as any)[teamKey].dark,
        }}
      >
        {team.label}
      </Typography>
      {team.players.map((row) => {
        const active = row.key === selectedKey;
        const won = row.stats?.gamesWon ?? 0;
        const lost = row.stats?.gamesLost ?? 0;
        return (
          <Box
            key={row.key}
            component="button"
            type="button"
            onClick={() => onSelect(row.key)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
              textAlign: "left",
              border: 0,
              borderTop: "1px solid",
              borderColor: (theme: Theme) =>
                alpha((theme.palette as any)[teamKey].main, 0.18),
              backgroundColor: active
                ? (theme: Theme) =>
                    alpha((theme.palette as any)[teamKey].main, 0.14)
                : "transparent",
              px: 1.25,
              py: 0.85,
              cursor: "pointer",
              color: "inherit",
              font: "inherit",
              "&:hover": {
                backgroundColor: (theme: Theme) =>
                  alpha((theme.palette as any)[teamKey].main, 0.12),
              },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: active ? 700 : 600,
                  color: (theme: Theme) =>
                    active
                      ? (theme.palette as any)[teamKey].dark
                      : "text.primary",
                }}
                noWrap
              >
                {row.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {row.stats
                  ? t("statsRecord", { wins: won, losses: lost })
                  : "—"}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                fontSize: 14,
                color:
                  row.stats != null
                    ? signedDiffColor(won - lost) ?? "text.secondary"
                    : "text.secondary",
              }}
            >
              {row.stats ? formatSignedDiff(won - lost) : "—"}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function SelectedBreakdown({
  player,
  style,
}: {
  player: SessionPlayerRow;
  style: StylePoints | null;
}) {
  const { t } = useTranslation();
  const stats = player.stats;
  const teamKey = teamPaletteKey(player.teamNumber);

  return (
    <Stack spacing={1.25} sx={{ px: 0.25 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          px: 0.5,
          color: (theme: Theme) => (theme.palette as any)[teamKey].dark,
        }}
      >
        {player.name}
      </Typography>
      {stats ? (
        <Box sx={{ px: 0.5 }}>
          {BREAKDOWN_STAT_DEFS.map((def) => {
            const value = formatBreakdownValue(stats, def.key);
            const valueColor =
              def.key === "josesCoefficient"
                ? JOSES_ACCENT
                : breakdownValueColor(stats, def.key);
            return (
              <StatLine
                key={def.key}
                label={t(def.fullKey)}
                value={value}
                valueColor={valueColor}
              />
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: "text.secondary", px: 0.5 }}>
          {t("historySessionStatsNoId")}
        </Typography>
      )}

      {player.playerId != null ? (
        <Box sx={{ px: 0.5, pt: 0.5 }}>
          <Typography
            variant="overline"
            component="p"
            sx={{ color: "text.secondary", mb: 0.5 }}
          >
            {t("statsStylePointsTitle")}
          </Typography>
          <StylePointsLines points={style} />
        </Box>
      ) : null}
    </Stack>
  );
}

function StatLine({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ py: 0.4 }}
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 600,
          color: valueColor || "text.primary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
