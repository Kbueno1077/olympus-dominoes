"use client";

import StatsDataDrawer from "@/modules/Analytics/StatsDataDrawer";
import DashboardEmptyState from "@/modules/Analytics/DashboardEmptyState";
import HistoryGamesNotes from "@/modules/History/HistoryGamesNotes";
import {
  dashboardAsideSx,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { buildHistoryMatchCompareLaunch } from "@/lib/analytics/compareLaunch";
import {
  formatMatchDate,
  formatMatchScoreline,
  getMatchDetail,
  listMatches,
  seatNamesFromDetail,
  teamLabelsForDetail,
  type MatchDetail,
  type MatchListItem,
} from "@/lib/analytics/history";
import {
  matchPassesHistoryFilter,
  type HistoryFilterPlayer,
  type HistoryFilterTeam,
} from "@/lib/analytics/historyFilters";
import {
  loadHistoryUiFilters,
  saveHistoryUiFilters,
} from "@/lib/analytics/historyFilterState";
import {
  formatSignedDiff,
  signedDiffColor,
} from "@/lib/analytics/signedDiff";
import { useTranslation } from "@/i18n/useTranslation";
import {
  activeTeamNumbers,
  tallyPollosZapatos,
  tallyWins,
  TEAM_KEYS,
} from "@/utils/matchSettings";
import { ArrowBack } from "@mui/icons-material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useParams, useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

const SIDE_A = "#2F6F9F";
const SIDE_B = "#B8453A";

function HistoryList({
  items,
  language,
  onOpen,
}: {
  items: MatchListItem[];
  language: string;
  onOpen: (id: number) => void;
}) {
  const { t, modeName, teamName } = useTranslation();

  if (items.length === 0) {
    return (
      <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
        {t("historyEmpty")}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {items.map((item) => {
        const scoreline = formatMatchScoreline(item, teamName);
        const heading =
          item.title.trim().length > 0
            ? item.title.trim()
            : formatMatchDate(language, item.endedAt);

        return (
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
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "baseline" }}
              spacing={0.75}
              sx={{ mb: 0.5 }}
            >
              <Typography sx={{ fontWeight: 700 }}>{heading}</Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "primary.main",
                  fontSize: 15,
                }}
              >
                {scoreline}
              </Typography>
            </Stack>
            {item.title.trim().length > 0 ? (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 0.5 }}
              >
                {formatMatchDate(language, item.endedAt)}
              </Typography>
            ) : null}
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
        );
      })}
    </Stack>
  );
}

function HistoryDetailView({
  detail,
  language,
  onBack,
  onCompare,
  canCompare,
}: {
  detail: MatchDetail;
  language: string;
  onBack: () => void;
  onCompare: () => void;
  canCompare: boolean;
}) {
  const { t, modeName, teamName } = useTranslation();
  const seatNames = seatNamesFromDetail(detail);
  const teamLabels = teamLabelsForDetail(detail);
  const isFreeForAll = detail.modeLabel === "Free For All";
  const teamNumbers = activeTeamNumbers(detail.playersAmount, isFreeForAll);
  const shutouts = tallyPollosZapatos(detail.games, teamNumbers);
  const wins = tallyWins(detail.games, teamNumbers);
  const totalGames = detail.games.length;
  const winsByTeam = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of wins) map.set(row.teamNumber, row.wins);
    return map;
  }, [wins]);

  const heading =
    detail.title.trim().length > 0
      ? detail.title.trim()
      : formatMatchDate(language, detail.endedAt);

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
      >
        <Button
          size="small"
          color="inherit"
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ color: "text.secondary", ml: -0.5 }}
        >
          {t("historyBack")}
        </Button>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {canCompare ? (
            <Button size="small" variant="outlined" onClick={onCompare}>
              {t("historyCompareMatch")}
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Card sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.35 }}>{heading}</Typography>
        {detail.title.trim().length > 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 0.5 }}
          >
            {formatMatchDate(language, detail.endedAt)}
          </Typography>
        ) : null}
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "text.secondary", mb: 0.75, lineHeight: 1.4 }}
        >
          {modeName(detail.modeLabel)} ·{" "}
          {t("playersCount", { n: detail.playersAmount })} ·{" "}
          {t("firstTo", { n: detail.maxPoints })} ·{" "}
          {t("historyGames", { n: detail.games.length })}
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
              const label = teamLabels[teamNumber] || teamName(teamNumber);
              const teamKey =
                (TEAM_KEYS as Record<number, string>)[teamNumber] ?? "team1";
              const gameWins = winsByTeam.get(teamNumber) ?? 0;
              const net = 2 * gameWins - totalGames;
              return (
                <Box
                  key={teamNumber}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "center",
                    py: 1.1,
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
                      mt: 0.35,
                      fontWeight: 700,
                      fontSize: 22,
                      lineHeight: 1.1,
                      fontVariantNumeric: "tabular-nums",
                      color: (theme) => (theme.palette as any)[teamKey].main,
                    }}
                  >
                    {gameWins}
                    <Box
                      component="span"
                      sx={{
                        ml: 0.6,
                        fontSize: 14,
                        fontWeight: 700,
                        color: signedDiffColor(net) ?? "text.secondary",
                      }}
                    >
                      ({formatSignedDiff(net)})
                    </Box>
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.35,
                      fontSize: 10,
                      color: "text.disabled",
                    }}
                  >
                    {t("historyGamesWonShort")} · {pollosFor}
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

export default function History() {
  const { t, language, modeName } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { data, loading, activeDataset, registry, setPendingCompare } =
    useAnalytics();
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);

  const datasetId = activeDataset?.id ?? registry.activeDatasetId;

  const [query, setQuery] = useState(() => loadHistoryUiFilters(datasetId).query);
  const [modeFilter, setModeFilter] = useState(
    () => loadHistoryUiFilters(datasetId).modeFilter
  );
  const [rosterFilter, setRosterFilter] = useState<HistoryFilterPlayer[]>(
    () => loadHistoryUiFilters(datasetId).rosterFilter
  );
  const [rosterPickerInput, setRosterPickerInput] = useState("");
  const [filtersHydratedFor, setFiltersHydratedFor] = useState<string | null>(
    null
  );

  const routeMatchId = useMemo(() => {
    const raw = params?.matchId;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value == null || value === "") return null;
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  }, [params]);

  const items = useMemo(() => (data ? listMatches(data) : []), [data]);

  const modes = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.modeLabel) set.add(item.modeLabel);
    }
    return Array.from(set);
  }, [items]);

  const players = useMemo(() => {
    if (!data) return [];
    return data.players
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const playersById = useMemo(() => {
    const map = new Map<number, string>();
    for (const player of players) map.set(player.id, player.name);
    return map;
  }, [players]);

  const playerIdKey = useMemo(
    () => players.map((player) => player.id).join(","),
    [players]
  );

  // Restore filters when the active data set changes (list ↔ match remounts
  // hit memory/sessionStorage via the lazy useState initializers too).
  useEffect(() => {
    const loaded = loadHistoryUiFilters(datasetId);
    setQuery(loaded.query);
    setModeFilter(loaded.modeFilter);
    setRosterFilter(loaded.rosterFilter);
    setFiltersHydratedFor(datasetId);
  }, [datasetId]);

  // Drop roster picks that disappeared after a replace/import.
  useEffect(() => {
    if (!playerIdKey) return;
    const validIds = new Set(
      playerIdKey.split(",").map((id) => Number(id))
    );
    setRosterFilter((current) => {
      const next = current.filter((entry) => validIds.has(entry.playerId));
      return next.length === current.length ? current : next;
    });
  }, [playerIdKey]);

  useEffect(() => {
    if (filtersHydratedFor !== datasetId) return;
    saveHistoryUiFilters({
      datasetId,
      query,
      modeFilter,
      rosterFilter,
    });
  }, [datasetId, query, modeFilter, rosterFilter, filtersHydratedFor]);

  // Drop a saved format that this data set no longer has.
  useEffect(() => {
    if (modeFilter === "all") return;
    if (modes.length === 0) return;
    if (!modes.includes(modeFilter)) setModeFilter("all");
  }, [modes, modeFilter]);

  const addablePlayers = useMemo(
    () =>
      players.filter(
        (player) => !rosterFilter.some((entry) => entry.playerId === player.id)
      ),
    [players, rosterFilter]
  );

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      if (modeFilter !== "all" && item.modeLabel !== modeFilter) return false;

      if (
        !matchPassesHistoryFilter(
          {
            playersAmount: item.playersAmount,
            modeLabel: item.modeLabel,
            seats: item.seats.map((seat) => ({
              seat: seat.seat,
              displayName: seat.displayName,
              playerId: seat.playerId,
              nameKey: "",
            })),
          },
          { players: rosterFilter }
        )
      ) {
        return false;
      }

      if (!needle) return true;
      const haystack = [
        item.title,
        formatMatchDate(language, item.endedAt),
        item.modeLabel,
        modeName(item.modeLabel),
        item.playerNames.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, query, modeFilter, rosterFilter, language, modeName]);

  const setPlayerTeam = (playerId: number, team: HistoryFilterTeam) => {
    setRosterFilter((current) =>
      current.map((entry) =>
        entry.playerId === playerId ? { ...entry, team } : entry
      )
    );
  };

  const removePlayer = (playerId: number) => {
    setRosterFilter((current) =>
      current.filter((entry) => entry.playerId !== playerId)
    );
  };

  const clearRosterFilter = () => setRosterFilter([]);

  const detail = useMemo(() => {
    if (!data || routeMatchId == null) return null;
    return getMatchDetail(data, routeMatchId);
  }, [data, routeMatchId]);

  const openMatch = (id: number) => {
    startTransition(() => router.push(`/history/${id}`));
  };

  const backToList = () => {
    startTransition(() => router.push("/history"));
  };

  const openCompare = () => {
    if (!detail) return;
    const launch = buildHistoryMatchCompareLaunch({
      modeLabel: detail.modeLabel,
      playersAmount: detail.playersAmount,
      seats: detail.seats,
    });
    if (!launch) return;
    setPendingCompare(launch);
    router.push("/compare");
  };

  const canCompare = useMemo(() => {
    if (!detail) return false;
    return detail.seats.some(
      (s) =>
        s.seat >= 1 &&
        s.seat <= detail.playersAmount &&
        s.playerId != null
    );
  }, [detail]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <DashboardEmptyState page="history" />;
  }

  return (
    <Box sx={dashboardShellSx}>
      <Box component="aside" sx={dashboardAsideSx}>
        <Box sx={{ px: 2, pt: { xs: 2.5, md: 3 }, pb: 2 }}>
          <Typography variant="h5" sx={{ mb: 1.5 }}>
            {t("historyTitle")}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              icon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
              label={t("statsManageData")}
              onClick={() => setDataDrawerOpen(true)}
              variant="outlined"
              clickable
            />
          </Stack>
        </Box>

        {routeMatchId == null ? (
          <Box
            sx={{
              px: 2,
              pb: 2.5,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              flex: 1,
              minHeight: 0,
              overflow: { xs: "visible", md: "auto" },
              overscrollBehavior: "contain",
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.grey[600], 0.16),
                backgroundColor: (theme) =>
                  alpha(theme.palette.common.white, 0.45),
              }}
            >
              <Typography
                variant="overline"
                component="p"
                sx={{ color: "text.secondary", mb: 1.25 }}
              >
                {t("historyFilterFind")}
              </Typography>
              <Stack spacing={1.25}>
                <TextField
                  size="small"
                  label={t("historySearch")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  fullWidth
                  helperText={t("historySearchHint")}
                />
                <Box>
                  <Typography
                    variant="overline"
                    component="p"
                    sx={{ color: "text.secondary", mb: 0.75 }}
                  >
                    {t("format")}
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    fullWidth
                    value={modeFilter}
                    onChange={(_, value) => {
                      if (value) setModeFilter(value);
                    }}
                    sx={{ flexWrap: "wrap" }}
                  >
                    <ToggleButton value="all" sx={{ flex: "1 1 auto" }}>
                      {t("historyFilterAll")}
                    </ToggleButton>
                    {modes.map((mode) => (
                      <ToggleButton
                        key={mode}
                        value={mode}
                        sx={{ flex: "1 1 auto" }}
                      >
                        {modeName(mode)}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.22),
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <Stack
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 0.5 }}
              >
                <Typography
                  variant="overline"
                  component="p"
                  sx={{ color: "primary.dark", mb: 0 }}
                >
                  {t("historyFilterPlayers")}
                </Typography>
                {rosterFilter.length > 0 ? (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={clearRosterFilter}
                    sx={{
                      minWidth: 0,
                      px: 0.75,
                      py: 0,
                      fontSize: 11,
                      color: "text.secondary",
                    }}
                  >
                    {t("historyFilterClearPlayers")}
                  </Button>
                ) : null}
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  display: "block",
                  mb: 1.25,
                  lineHeight: 1.35,
                }}
              >
                {t("historyFilterPlayersHint")}
              </Typography>

              <Autocomplete
                size="small"
                options={addablePlayers}
                getOptionLabel={(option) => option.name}
                value={null}
                inputValue={rosterPickerInput}
                onInputChange={(_, value, reason) => {
                  if (reason === "reset") {
                    setRosterPickerInput("");
                    return;
                  }
                  setRosterPickerInput(value);
                }}
                onChange={(_, value) => {
                  if (!value) return;
                  setRosterFilter((current) => [
                    ...current,
                    { playerId: value.id, team: null },
                  ]);
                  setRosterPickerInput("");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("historyFilterAddPlayer")}
                  />
                )}
                sx={{
                  mb: rosterFilter.length > 0 ? 1.25 : 0,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "background.paper",
                  },
                }}
              />

              {rosterFilter.length > 0 ? (
                <Stack spacing={1}>
                  {rosterFilter.map((entry) => {
                    const name =
                      playersById.get(entry.playerId) ??
                      `#${entry.playerId}`;
                    return (
                      <Box
                        key={entry.playerId}
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          backgroundColor: "background.paper",
                          border: "1px solid",
                          borderColor: (theme) =>
                            alpha(theme.palette.grey[600], 0.14),
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                          sx={{ mb: 0.85 }}
                        >
                          <Typography
                            sx={{ fontWeight: 600, fontSize: 14 }}
                            title={name}
                          >
                            {name}
                          </Typography>
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => removePlayer(entry.playerId)}
                            aria-label={t("statsCompareRemove", { name })}
                            sx={{
                              minWidth: 0,
                              px: 0.75,
                              color: "text.secondary",
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </Button>
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                          {(
                            [
                              {
                                value: null as HistoryFilterTeam,
                                label: t("historyFilterAnySide"),
                                activeBorder: "rgba(95, 83, 65, 0.45)",
                                activeBg: "rgba(95, 83, 65, 0.1)",
                                activeColor: "text.primary",
                              },
                              {
                                value: 1 as const,
                                label: t("historyFilterSideA"),
                                activeBorder: SIDE_A,
                                activeBg: alpha(SIDE_A, 0.14),
                                activeColor: SIDE_A,
                              },
                              {
                                value: 2 as const,
                                label: t("historyFilterSideB"),
                                activeBorder: SIDE_B,
                                activeBg: alpha(SIDE_B, 0.14),
                                activeColor: SIDE_B,
                              },
                            ] as const
                          ).map((option) => {
                            const selected = entry.team === option.value;
                            return (
                              <Button
                                key={String(option.value)}
                                size="small"
                                variant="outlined"
                                aria-pressed={selected}
                                onClick={() =>
                                  setPlayerTeam(entry.playerId, option.value)
                                }
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                  px: 0.5,
                                  py: 0.35,
                                  fontSize: 12,
                                  fontWeight: selected ? 700 : 500,
                                  borderColor: selected
                                    ? option.activeBorder
                                    : (theme) =>
                                        alpha(theme.palette.grey[600], 0.22),
                                  backgroundColor: selected
                                    ? option.activeBg
                                    : "transparent",
                                  color: selected
                                    ? option.activeColor
                                    : "text.secondary",
                                  "&:hover": {
                                    borderColor: option.activeBorder,
                                    backgroundColor: option.activeBg,
                                  },
                                }}
                              >
                                {option.label}
                              </Button>
                            );
                          })}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              ) : null}
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                px: 0.25,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {t("historyFilterCount", {
                shown: filteredItems.length,
                total: items.length,
              })}
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Box component="main" sx={dashboardMainSx}>
        {routeMatchId == null ? (
          <HistoryList
            items={filteredItems}
            language={language}
            onOpen={openMatch}
          />
        ) : detail ? (
          <HistoryDetailView
            detail={detail}
            language={language}
            onBack={backToList}
            onCompare={openCompare}
            canCompare={canCompare}
          />
        ) : (
          <Stack spacing={2}>
            <Button
              size="small"
              color="inherit"
              startIcon={<ArrowBack />}
              onClick={backToList}
              sx={{ color: "text.secondary", alignSelf: "flex-start" }}
            >
              {t("historyBack")}
            </Button>
            <Typography sx={{ color: "text.secondary" }}>
              {t("historyEmpty")}
            </Typography>
          </Stack>
        )}
      </Box>

      <StatsDataDrawer
        open={dataDrawerOpen}
        onClose={() => setDataDrawerOpen(false)}
      />
    </Box>
  );
}
