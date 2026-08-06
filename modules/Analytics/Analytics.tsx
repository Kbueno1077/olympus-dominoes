"use client";

import AnalyticsCharts from "@/modules/Analytics/AnalyticsCharts";
import AnalyticsCompare from "@/modules/Analytics/AnalyticsCompare";
import DatasetsPanel from "@/modules/Analytics/DatasetsPanel";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { buildH2HCompareLaunch } from "@/lib/analytics/compareLaunch";
import type { CompareLaunch } from "@/lib/analytics/datasets";
import {
  formatJosesCoefficient,
} from "@/lib/analytics/joseCoefficient";
import {
  formatSignedDiff,
  perHandAverage,
} from "@/lib/analytics/signedDiff";
import {
  getPlayerH2H,
  getPlayerStats,
  listLeaderboard,
  listStatModes,
} from "@/lib/analytics/selectors";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ArrowBack,
  CloudUpload,
  InsertDriveFile,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";

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
      sx={{ py: 0.5 }}
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

function DiffStatLine({
  label,
  favor,
  against,
}: {
  label: string;
  favor: number;
  against: number;
}) {
  const diff = favor - against;
  const color =
    diff > 0 ? "primary.main" : diff < 0 ? "error.main" : "text.primary";
  return (
    <StatLine label={label} value={formatSignedDiff(diff)} valueColor={color} />
  );
}

function formatPerHand(points: number, hands: number): string {
  if (hands <= 0) return "—";
  const avg = points / hands;
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
}

function UploadPanel({
  onFile,
  busy,
}: {
  onFile: (file: File) => Promise<void>;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    await onFile(file);
  };

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFiles(e.dataTransfer.files);
      }}
      sx={{
        p: { xs: 3, sm: 4 },
        textAlign: "center",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: (theme) =>
          dragging
            ? theme.palette.primary.main
            : alpha(theme.palette.grey[600], 0.35),
        backgroundColor: (theme) =>
          dragging
            ? alpha(theme.palette.primary.main, 0.06)
            : "background.paper",
        transition: "border-color 160ms ease, background-color 160ms ease",
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            backgroundColor: (theme) =>
              alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
          }}
        >
          {busy ? <CircularProgress size={24} /> : <CloudUpload />}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.75 }}>
            {t("analyticsUploadTitle")}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", maxWidth: 420, mx: "auto" }}
          >
            {t("analyticsUploadBody")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          startIcon={<InsertDriveFile />}
        >
          {t("analyticsChooseFile")}
        </Button>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {t("analyticsUploadHint")}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.sql,text/csv,application/sql,text/plain"
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </Stack>
    </Card>
  );
}

export default function Analytics() {
  const { t, modeName } = useTranslation();
  const { data, error, loading, importFile, peekPendingCompare, clearPendingCompare } =
    useAnalytics();
  const [busy, setBusy] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compareLaunch, setCompareLaunch] = useState<CompareLaunch | null>(
    null
  );
  const [compareKey, setCompareKey] = useState(0);
  const [modeLabel, setModeLabel] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const launch = peekPendingCompare();
    if (!launch) return;
    setCompareLaunch(launch);
    setCompareKey((k) => k + 1);
    setComparing(true);
  }, [peekPendingCompare]);

  const closeCompare = () => {
    clearPendingCompare();
    setComparing(false);
    setCompareLaunch(null);
  };

  const openCompare = (launch: CompareLaunch | null = null) => {
    clearPendingCompare();
    setCompareLaunch(launch);
    setCompareKey((k) => k + 1);
    setComparing(true);
  };

  const modes = useMemo(
    () => (data ? listStatModes(data) : []),
    [data]
  );

  const activeMode = useMemo(() => {
    if (modeLabel && modes.includes(modeLabel)) return modeLabel;
    return modes[0] ?? null;
  }, [modeLabel, modes]);

  const leaderboard = useMemo(
    () => (data && activeMode ? listLeaderboard(data, activeMode) : []),
    [data, activeMode]
  );

  const selectedPlayerId = useMemo(() => {
    if (playerId && leaderboard.some((r) => r.playerId === playerId)) {
      return playerId;
    }
    return leaderboard[0]?.playerId ?? null;
  }, [playerId, leaderboard]);

  const selectedPlayer = useMemo(
    () => data?.players.find((p) => p.id === selectedPlayerId) ?? null,
    [data, selectedPlayerId]
  );

  const activeStats = useMemo(() => {
    if (!data || selectedPlayerId == null || !activeMode) return null;
    return (
      getPlayerStats(data, selectedPlayerId).find(
        (s) => s.modeLabel === activeMode
      ) ?? null
    );
  }, [data, selectedPlayerId, activeMode]);

  const h2h = useMemo(() => {
    if (!data || selectedPlayerId == null || !activeMode) return [];
    return getPlayerH2H(data, selectedPlayerId, activeMode);
  }, [data, selectedPlayerId, activeMode]);

  const handleUpload = async (file: File) => {
    setBusy(true);
    setLocalError(null);
    try {
      await importFile(file);
      setModeLabel(null);
      setPlayerId(null);
      setComparing(false);
      setCompareLaunch(null);
    } catch (err) {
      const code = err instanceof Error ? err.message : "parse_failed";
      setLocalError(code);
    } finally {
      setBusy(false);
    }
  };

  const errorMessage = (() => {
    const code = localError || error;
    if (!code) return null;
    if (code.startsWith("unknown_table:")) return t("analyticsErrorUnknownTable");
    if (code === "empty_export") return t("analyticsErrorEmpty");
    if (code === "unknown_format") return t("analyticsErrorFormat");
    return t("analyticsErrorGeneric");
  })();

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
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.75 }}>
              {t("analyticsTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("analyticsSubtitle")}
            </Typography>
          </Box>
          <UploadPanel onFile={handleUpload} busy={busy} />
          <DatasetsPanel />
          {errorMessage ? (
            <Typography variant="body2" sx={{ color: "error.main" }}>
              {errorMessage}
            </Typography>
          ) : null}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", width: "100%" }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
        >
          <Box>
            {comparing ? (
              <Button
                size="small"
                color="inherit"
                startIcon={<ArrowBack />}
                onClick={closeCompare}
                sx={{ color: "text.secondary", ml: -0.5, mb: 0.75 }}
              >
                {t("statsBack")}
              </Button>
            ) : null}
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              {comparing ? t("statsCompare") : t("analyticsTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("analyticsLoadedMeta", {
                file: data.fileName,
                players: data.players.length,
                matches: data.matches.length,
              })}
            </Typography>
          </Box>
          {!comparing ? (
            <Button variant="outlined" onClick={() => openCompare(null)}>
              {t("statsCompare")}
            </Button>
          ) : null}
        </Stack>

        {errorMessage ? (
          <Typography variant="body2" sx={{ color: "error.main" }}>
            {errorMessage}
          </Typography>
        ) : null}

        {comparing ? (
          <AnalyticsCompare
            key={compareKey}
            data={data}
            modes={modes}
            initialMode={activeMode}
            initialLaunch={compareLaunch}
          />
        ) : modes.length === 0 ? (
          <>
            <DatasetsPanel />
            <Card sx={{ p: 3 }}>
              <Typography sx={{ color: "text.secondary" }}>
                {t("statsNoData")}
              </Typography>
            </Card>
          </>
        ) : (
          <>
            <DatasetsPanel />

            <Card sx={{ p: 2 }}>
              <Typography
                variant="overline"
                component="p"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                {t("format")}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={activeMode}
                onChange={(_, value) => {
                  if (value) setModeLabel(value);
                }}
                sx={{ flexWrap: "wrap" }}
              >
                {modes.map((mode) => (
                  <ToggleButton key={mode} value={mode}>
                    {modeName(mode)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Card>

            <AnalyticsCharts
              leaderboard={leaderboard}
              activeStats={activeStats}
              playerName={selectedPlayer?.name ?? null}
              t={t}
            />

            <Card sx={{ p: 2 }}>
              <Typography
                variant="overline"
                component="p"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                {t("statsLeaderboard")}
              </Typography>
              {leaderboard.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {t("statsNoData")}
                </Typography>
              ) : (
                <Stack>
                  {leaderboard.map((row, index) => {
                    const selected = row.playerId === selectedPlayerId;
                    return (
                      <Box
                        key={row.playerId}
                        component="button"
                        type="button"
                        onClick={() => setPlayerId(row.playerId)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          width: "100%",
                          textAlign: "left",
                          border: 0,
                          borderTop: "1px solid",
                          borderColor: selected ? "transparent" : "divider",
                          backgroundColor: selected
                            ? (theme) =>
                                alpha(theme.palette.primary.main, 0.08)
                            : "transparent",
                          borderRadius: selected ? 1.5 : 0,
                          px: selected ? 1 : 0.5,
                          py: 1.25,
                          cursor: "pointer",
                          color: "inherit",
                          font: "inherit",
                          "&:hover": {
                            backgroundColor: (theme) =>
                              alpha(theme.palette.primary.main, 0.06),
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            width: 22,
                            color: "text.secondary",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {index + 1}
                        </Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ fontWeight: 600 }}>
                              {row.playerName}
                            </Typography>
                            {row.isMyself ? (
                              <Typography
                                variant="overline"
                                sx={{
                                  color: "primary.main",
                                  fontSize: 10,
                                  lineHeight: 1,
                                }}
                              >
                                {t("youBadge")}
                              </Typography>
                            ) : null}
                          </Stack>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {t("statsRecord", {
                              wins: row.gamesWon,
                              losses: row.gamesLost,
                            })}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "primary.main",
                            minWidth: 48,
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatJosesCoefficient(row.josesCoefficient)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Card>

            {selectedPlayer && activeStats ? (
              <>
                <Card sx={{ p: 2 }}>
                  <Typography
                    variant="overline"
                    component="p"
                    sx={{ color: "text.secondary", mb: 1 }}
                  >
                    {selectedPlayer.name}
                    {selectedPlayer.is_myself ? ` · ${t("youBadge")}` : ""}
                  </Typography>
                  <StatLine
                    label={t("statsJosesCoefficient")}
                    value={formatJosesCoefficient(activeStats.josesCoefficient)}
                  />
                  <StatLine
                    label={t("statsGamesPlayed")}
                    value={activeStats.gamesPlayed}
                  />
                  <StatLine
                    label={t("statsGamesWon")}
                    value={activeStats.gamesWon}
                  />
                  <StatLine
                    label={t("statsGamesLost")}
                    value={activeStats.gamesLost}
                  />
                  <DiffStatLine
                    label={t("statsGameDifference")}
                    favor={activeStats.gamesWon}
                    against={activeStats.gamesLost}
                  />
                  <StatLine
                    label={t("statsPointsFor")}
                    value={activeStats.pointsFor}
                  />
                  <StatLine
                    label={t("statsPointsAgainst")}
                    value={activeStats.pointsAgainst}
                  />
                  <DiffStatLine
                    label={t("statsPointsDifference")}
                    favor={activeStats.pointsFor}
                    against={activeStats.pointsAgainst}
                  />
                  <StatLine
                    label={t("statsHandsTotal")}
                    value={activeStats.handsFor}
                  />
                  <StatLine
                    label={t("statsHandsWon")}
                    value={activeStats.handsWon}
                  />
                  <StatLine
                    label={t("statsHandsLost")}
                    value={activeStats.handsLost}
                  />
                  <DiffStatLine
                    label={t("statsHandsDifference")}
                    favor={activeStats.handsWon}
                    against={activeStats.handsLost}
                  />
                  <StatLine
                    label={t("statsPointsPerHandFor")}
                    value={formatPerHand(
                      activeStats.pointsFor,
                      activeStats.handsFor
                    )}
                  />
                  <StatLine
                    label={t("statsPointsPerHandAgainst")}
                    value={formatPerHand(
                      activeStats.pointsAgainst,
                      activeStats.handsAgainst
                    )}
                  />
                  {(() => {
                    const forAvg = perHandAverage(
                      activeStats.pointsFor,
                      activeStats.handsFor
                    );
                    const againstAvg = perHandAverage(
                      activeStats.pointsAgainst,
                      activeStats.handsAgainst
                    );
                    if (forAvg == null || againstAvg == null) {
                      return (
                        <StatLine
                          label={t("statsPointsPerHandDifference")}
                          value="—"
                        />
                      );
                    }
                    const diff = forAvg - againstAvg;
                    return (
                      <StatLine
                        label={t("statsPointsPerHandDifference")}
                        value={formatSignedDiff(diff, 1)}
                        valueColor={
                          diff > 0
                            ? "primary.main"
                            : diff < 0
                              ? "error.main"
                              : "text.primary"
                        }
                      />
                    );
                  })()}
                  <StatLine
                    label={t("statsPollosFor")}
                    value={activeStats.pollosFor}
                  />
                  <StatLine
                    label={t("statsPollosAgainst")}
                    value={activeStats.pollosAgainst}
                  />
                  <DiffStatLine
                    label={t("statsPollosDifference")}
                    favor={activeStats.pollosFor}
                    against={activeStats.pollosAgainst}
                  />
                  <StatLine
                    label={t("statsZapatosFor")}
                    value={activeStats.zapatosFor}
                  />
                  <StatLine
                    label={t("statsZapatosAgainst")}
                    value={activeStats.zapatosAgainst}
                  />
                  <DiffStatLine
                    label={t("statsZapatosDifference")}
                    favor={activeStats.zapatosFor}
                    against={activeStats.zapatosAgainst}
                  />
                </Card>

                <Card sx={{ p: 2 }}>
                  <Typography
                    variant="overline"
                    component="p"
                    sx={{ color: "text.secondary", mb: 1 }}
                  >
                    {t("statsH2HTitle")}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mb: 1 }}
                  >
                    {t("statsH2HCompareHint")}
                  </Typography>
                  {h2h.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {t("statsNoData")}
                    </Typography>
                  ) : (
                    <Stack>
                      {h2h.map((row) => (
                        <Box
                          key={`${row.opponentId}-${row.modeLabel}`}
                          component="button"
                          type="button"
                          onClick={() => {
                            if (selectedPlayerId == null || !activeMode) return;
                            openCompare(
                              buildH2HCompareLaunch({
                                modeLabel: activeMode,
                                playerId: selectedPlayerId,
                                opponentId: row.opponentId,
                              })
                            );
                          }}
                          sx={{
                            py: 1,
                            px: 0.5,
                            border: 0,
                            borderTop: "1px solid",
                            borderColor: "divider",
                            background: "transparent",
                            textAlign: "left",
                            cursor: "pointer",
                            color: "inherit",
                            font: "inherit",
                            borderRadius: 1,
                            "&:hover": {
                              backgroundColor: (theme) =>
                                alpha(theme.palette.primary.main, 0.06),
                            },
                          }}
                        >
                          <Typography sx={{ fontWeight: 600 }}>
                            {row.opponentName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {t("statsH2HRecord", {
                              total: row.wins + row.losses,
                              wins: row.wins,
                              losses: row.losses,
                            })}
                            {row.winPct != null
                              ? ` · ${t("statsWinPct", {
                                  pct: Math.round(row.winPct * 100),
                                })}`
                              : ""}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Card>
              </>
            ) : null}
          </>
        )}
      </Stack>
    </Box>
  );
}
