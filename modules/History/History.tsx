"use client";

import HistoryGamesNotes from "@/modules/History/HistoryGamesNotes";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  formatMatchDate,
  getMatchDetail,
  listMatches,
  seatNamesFromDetail,
  teamLabelsForDetail,
  type MatchDetail,
  type MatchListItem,
} from "@/lib/analytics/history";
import { useTranslation } from "@/i18n/useTranslation";
import {
  activeTeamNumbers,
  tallyPollosZapatos,
  TEAM_KEYS,
} from "@/utils/matchSettings";
import { ArrowBack } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";

function HistoryList({
  items,
  language,
  onOpen,
}: {
  items: MatchListItem[];
  language: string;
  onOpen: (id: number) => void;
}) {
  const { t, modeName } = useTranslation();

  if (items.length === 0) {
    return (
      <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
        {t("historyEmpty")}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {items.map((item) => (
        <Card
          key={item.id}
          component="button"
          type="button"
          onClick={() => onOpen(item.id)}
          sx={{
            p: 2,
            textAlign: "left",
            cursor: "pointer",
            border: "1px solid",
            borderColor: "divider",
            width: "100%",
            font: "inherit",
            color: "inherit",
            backgroundColor: "background.paper",
            "&:hover": {
              backgroundColor: (theme) =>
                alpha(theme.palette.primary.main, 0.05),
              borderColor: (theme) =>
                alpha(theme.palette.primary.main, 0.35),
            },
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
            {formatMatchDate(language, item.endedAt)}
          </Typography>
          <Typography
            variant="overline"
            component="p"
            sx={{ color: "text.secondary", mb: 0.75, lineHeight: 1.4 }}
          >
            {modeName(item.modeLabel)} ·{" "}
            {t("historyGames", { n: item.gameCount })} ·{" "}
            {t("firstTo", { n: item.maxPoints })}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.primary" }}>
            {item.playerNames.join(" · ")}
          </Typography>
        </Card>
      ))}
    </Stack>
  );
}

function HistoryDetailView({
  detail,
  language,
  onBack,
}: {
  detail: MatchDetail;
  language: string;
  onBack: () => void;
}) {
  const { t, modeName, teamName } = useTranslation();
  const seatNames = seatNamesFromDetail(detail);
  const teamLabels = teamLabelsForDetail(detail);
  const isFreeForAll = detail.modeLabel === "Free For All";
  const teamNumbers = activeTeamNumbers(detail.playersAmount, isFreeForAll);
  const shutouts = tallyPollosZapatos(detail.games, teamNumbers);

  return (
    <Stack spacing={2}>
      <Button
        size="small"
        color="inherit"
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{ color: "text.secondary", alignSelf: "flex-start", ml: -0.5 }}
      >
        {t("historyBack")}
      </Button>

      <Card sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
          {formatMatchDate(language, detail.endedAt)}
        </Typography>
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "text.secondary", mb: 0.75, lineHeight: 1.4 }}
        >
          {modeName(detail.modeLabel)} ·{" "}
          {t("playersCount", { n: detail.playersAmount })} ·{" "}
          {t("firstTo", { n: detail.maxPoints })}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.primary", mb: 1.5 }}>
          {detail.seats
            .slice(0, detail.playersAmount)
            .map((s) => s.displayName)
            .filter(Boolean)
            .join(" · ")}
        </Typography>

        <Stack direction="row" spacing={1}>
          {shutouts.map(
            ({
              teamNumber,
              pollosFor,
              zapatosFor,
            }: {
              teamNumber: number;
              pollosFor: number;
              zapatosFor: number;
            }) => {
            const label =
              teamLabels[teamNumber] || teamName(teamNumber);
            const teamKey = (TEAM_KEYS as Record<number, string>)[teamNumber] ?? "team1";
            return (
              <Box
                key={teamNumber}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "center",
                  py: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha((theme.palette as any)[teamKey].main, 0.35),
                  backgroundColor: (theme) =>
                    alpha((theme.palette as any)[teamKey].main, 0.08),
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: (theme) => (theme.palette as any)[teamKey].dark,
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 10,
                    color: "text.disabled",
                  }}
                >
                  {pollosFor}
                  {t("pollo").charAt(0)} · {zapatosFor}
                  {t("zapato").charAt(0)}
                </Typography>
              </Box>
            );
          }
          )}
        </Stack>
      </Card>

      <HistoryGamesNotes
        games={detail.games}
        playersAmount={detail.playersAmount}
        modeLabel={detail.modeLabel}
        seatNames={seatNames}
      />
    </Stack>
  );
}

type Props = {
  onOpenAnalytics?: () => void;
};

export default function History({ onOpenAnalytics }: Props) {
  const { t, language } = useTranslation();
  const { data, loading } = useAnalytics();
  const [matchId, setMatchId] = useState<number | null>(null);

  const items = useMemo(
    () => (data ? listMatches(data) : []),
    [data]
  );

  const detail = useMemo(() => {
    if (!data || matchId == null) return null;
    return getMatchDetail(data, matchId);
  }, [data, matchId]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
        <Stack spacing={2} alignItems="flex-start">
          <Box>
            <Typography variant="h4" sx={{ mb: 0.75 }}>
              {t("historyTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("historyNeedImport")}
            </Typography>
          </Box>
          {onOpenAnalytics ? (
            <Button variant="contained" onClick={onOpenAnalytics}>
              {t("historyGoAnalytics")}
            </Button>
          ) : null}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 920, mx: "auto", width: "100%" }}>
      <Stack spacing={2}>
        {matchId == null ? (
          <>
            <Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {t("historyTitle")}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t("analyticsLoadedMeta", {
                  file: data.fileName,
                  players: data.players.length,
                  matches: data.matches.length,
                })}
              </Typography>
            </Box>
            <HistoryList
              items={items}
              language={language}
              onOpen={setMatchId}
            />
          </>
        ) : detail ? (
          <HistoryDetailView
            detail={detail}
            language={language}
            onBack={() => setMatchId(null)}
          />
        ) : (
          <Stack spacing={2}>
            <Button
              size="small"
              color="inherit"
              startIcon={<ArrowBack />}
              onClick={() => setMatchId(null)}
              sx={{ color: "text.secondary", alignSelf: "flex-start" }}
            >
              {t("historyBack")}
            </Button>
            <Typography sx={{ color: "text.secondary" }}>
              {t("historyEmpty")}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
