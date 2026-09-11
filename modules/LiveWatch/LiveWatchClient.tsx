"use client";

import {
  LIVE_WATCH_FAIL_LIMIT,
  LIVE_WATCH_SCORE_POLL_MS,
  LIVE_WATCH_VIEWER_POLL_MS,
  type LiveWatchSnapshot,
} from "@/lib/liveWatch/types";
import { hasFullPadPayload } from "@/lib/liveWatch/fromSnapshot";
import LiveWatchScoreboard from "@/modules/LiveWatch/LiveWatchScoreboard";
import LiveWatchStatsPanel from "@/modules/LiveWatch/LiveWatchStatsPanel";
import { FONT_DISPLAY } from "@/muiTheme/typography";
import { useTranslation } from "@/i18n/useTranslation";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type TerminalReason =
  | "ended"
  | "expired"
  | "kicked"
  | "disconnected"
  | "full"
  | "disabled"
  | "network"
  | "error";

type WatchState =
  | { kind: "loading" }
  | { kind: "live"; snapshot: LiveWatchSnapshot; viewerCount: number }
  | { kind: "terminal"; reason: TerminalReason; stopped: boolean };

const VIEWER_KEY = (id: string) => `olympus.liveWatch.viewer.${id}`;

function pageIsVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

/** Stable id before any network call — prevents double-counting on Strict Mode. */
function ensureViewerId(shareId: string): string {
  try {
    const existing = sessionStorage.getItem(VIEWER_KEY(shareId));
    if (existing && existing.length >= 8) return existing;
  } catch {
    // ignore
  }
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  try {
    sessionStorage.setItem(VIEWER_KEY(shareId), id);
  } catch {
    // ignore
  }
  return id;
}

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return String(body?.error ?? "");
  } catch {
    return "";
  }
}

function reasonFromHttp(status: number, error: string): TerminalReason {
  if (error === "viewer") return "kicked";
  if (status === 403 || error === "full") return "full";
  if (status === 503 || error === "disabled") return "disabled";
  if (status === 410 || error === "expired") return "expired";
  if (status === 404 || error === "not_found") return "ended";
  return "error";
}

export default function LiveWatchClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [state, setState] = useState<WatchState>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const viewerIdRef = useRef<string | null>(null);
  const leftRef = useRef(false);
  const haltedRef = useRef(false);
  const liveRef = useRef(false);
  const failCountRef = useRef(0);
  const fetchScoreRef = useRef<() => Promise<void>>(async () => {});
  const fetchViewersRef = useRef<() => Promise<void>>(async () => {});

  const disconnect = useCallback(async () => {
    leftRef.current = true;
    haltedRef.current = true;
    liveRef.current = false;
    const viewerId = viewerIdRef.current;
    if (id && viewerId) {
      try {
        await fetch(`/api/live-watch/${id}/viewers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "leave", viewerId }),
        });
      } catch {
        // ignore
      }
      try {
        sessionStorage.removeItem(VIEWER_KEY(id));
      } catch {
        // ignore
      }
    }
    setState({ kind: "terminal", reason: "disconnected", stopped: true });
  }, [id]);

  const refreshLive = useCallback(() => {
    if (leftRef.current) return;
    haltedRef.current = false;
    failCountRef.current = 0;
    setRefreshing(true);
    void (async () => {
      await fetchScoreRef.current();
      if (!haltedRef.current && !leftRef.current) {
        await fetchViewersRef.current();
      }
      setRefreshing(false);
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    leftRef.current = false;
    haltedRef.current = false;
    liveRef.current = false;
    failCountRef.current = 0;
    setState({ kind: "loading" });

    let cancelled = false;
    let loadingRetry: ReturnType<typeof setTimeout> | null = null;
    let scoreBusy = false;
    let viewersBusy = false;

    function clearLoadingRetry() {
      if (loadingRetry) {
        clearTimeout(loadingRetry);
        loadingRetry = null;
      }
    }

    function noteSuccess() {
      failCountRef.current = 0;
      haltedRef.current = false;
    }

    function noteFailure(reason: TerminalReason) {
      failCountRef.current += 1;
      if (failCountRef.current < LIVE_WATCH_FAIL_LIMIT) {
        if (!liveRef.current && !cancelled && !haltedRef.current) {
          clearLoadingRetry();
          loadingRetry = setTimeout(() => {
            void fetchScoreRef.current();
          }, 1500);
        }
        return;
      }
      haltedRef.current = true;
      liveRef.current = false;
      clearLoadingRetry();
      if (!cancelled) {
        setState({ kind: "terminal", reason, stopped: true });
      }
    }

    async function fetchScore() {
      if (cancelled || leftRef.current || haltedRef.current || scoreBusy) {
        return;
      }
      scoreBusy = true;
      try {
        const res = await fetch(`/api/live-watch/${id}`, { cache: "no-store" });
        if (cancelled || leftRef.current) return;
        if (res.status === 503) {
          noteFailure("disabled");
          return;
        }
        if (!res.ok) {
          const error = await readApiError(res);
          noteFailure(reasonFromHttp(res.status, error));
          return;
        }
        const data = (await res.json()) as {
          snapshot?: LiveWatchSnapshot;
          viewerCount?: number;
        };
        if (!data.snapshot) {
          noteFailure("error");
          return;
        }
        noteSuccess();
        liveRef.current = true;
        setState((prev) => ({
          kind: "live",
          snapshot: data.snapshot as LiveWatchSnapshot,
          viewerCount:
            data.viewerCount ??
            (prev.kind === "live" ? prev.viewerCount : 0),
        }));
        if (!cancelled && !haltedRef.current && !leftRef.current) {
          void fetchViewers();
        }
      } catch {
        if (!cancelled && !leftRef.current) noteFailure("network");
      } finally {
        scoreBusy = false;
      }
    }

    async function fetchViewers() {
      if (
        cancelled ||
        leftRef.current ||
        haltedRef.current ||
        viewersBusy ||
        !liveRef.current
      ) {
        return;
      }
      viewersBusy = true;
      try {
        const viewerId = ensureViewerId(id);
        viewerIdRef.current = viewerId;
        const joinRes = await fetch(`/api/live-watch/${id}/viewers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", viewerId }),
        });
        if (cancelled || leftRef.current) return;
        if (!joinRes.ok) {
          const error = await readApiError(joinRes);
          noteFailure(reasonFromHttp(joinRes.status, error));
          return;
        }
        const joinBody = (await joinRes.json()) as {
          viewerId?: string;
          viewerCount?: number;
        };
        if (joinBody.viewerId && joinBody.viewerId !== viewerId) {
          viewerIdRef.current = joinBody.viewerId;
          try {
            sessionStorage.setItem(VIEWER_KEY(id), joinBody.viewerId);
          } catch {
            // ignore
          }
        }
        noteSuccess();
        if (typeof joinBody.viewerCount === "number") {
          setState((prev) =>
            prev.kind === "live"
              ? { ...prev, viewerCount: joinBody.viewerCount as number }
              : prev
          );
        }
      } catch {
        if (!cancelled && !leftRef.current) noteFailure("network");
      } finally {
        viewersBusy = false;
      }
    }

    fetchScoreRef.current = fetchScore;
    fetchViewersRef.current = fetchViewers;

    void fetchScore();

    const scoreTimer = setInterval(() => {
      if (!pageIsVisible()) return;
      void fetchScore();
    }, LIVE_WATCH_SCORE_POLL_MS);

    const viewerTimer = setInterval(() => {
      if (!pageIsVisible()) return;
      void fetchViewers();
    }, LIVE_WATCH_VIEWER_POLL_MS);

    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (haltedRef.current || leftRef.current) return;
      void fetchScore();
      void fetchViewers();
    }

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearLoadingRetry();
      clearInterval(scoreTimer);
      clearInterval(viewerTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [id]);

  if (state.kind === "loading") {
    return (
      <WatchStatusPanel
        tone="loading"
        chip={t("liveWatchLive")}
        title={t("liveWatchLoadingTitle")}
        lead={t("liveWatchLoadingLead")}
        body={t("liveWatchLoading")}
        pulse
      />
    );
  }

  if (state.kind === "terminal") {
    const copy = terminalCopy(state.reason, t, state.stopped);
    return (
      <WatchStatusPanel
        tone={copy.tone}
        chip={copy.chip}
        title={copy.title}
        lead={copy.lead}
        body={copy.body}
        actionLabel={t("liveWatchGoHome")}
        onAction={() => router.push("/")}
      />
    );
  }

  const { snapshot, viewerCount } = state;
  const fullPad = hasFullPadPayload(snapshot);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        flex: { xs: "0 0 auto", md: 1 },
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        minHeight: { xs: 0, md: 0 },
        height: { xs: "auto", md: "100%" },
        maxHeight: { xs: "none", md: "100%" },
        bgcolor: "background.default",
        alignItems: "stretch",
        overflowX: "hidden",
        overflowY: { xs: "visible", md: "hidden" },
      }}
    >
      <Box
        component="main"
        sx={{
          flex: { xs: "0 0 auto", md: 1 },
          minWidth: 0,
          maxWidth: "100%",
          width: "100%",
          minHeight: 0,
          height: { xs: "auto", md: "100%" },
          maxHeight: { xs: "none", md: "100%" },
          overflowX: "hidden",
          overflowY: { xs: "visible", md: "auto" },
          overscrollBehavior: { md: "contain" },
          WebkitOverflowScrolling: "touch",
          bgcolor: "#F1E7D6",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: { xs: 1.5, sm: 2.5, lg: 3 },
          pt: { xs: 2, md: 2.5 },
          pb: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 920, width: "100%", mx: "auto" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2, gap: 1, flexWrap: "wrap" }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                label={t("liveWatchLive")}
                sx={{
                  bgcolor: alpha("#1F6B58", 0.18),
                  color: "#1F6B58",
                  fontWeight: 700,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {t("liveWatchViewers", { n: viewerCount })}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                variant="contained"
                disableElevation
                startIcon={<RefreshIcon />}
                disabled={refreshing}
                onClick={refreshLive}
                sx={{
                  bgcolor: "#1F6B58",
                  color: "#FDF8EE",
                  "&:hover": { bgcolor: "#185546" },
                }}
              >
                {t("liveWatchRefresh")}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => {
                  void disconnect();
                }}
              >
                {t("liveWatchDisconnect")}
              </Button>
            </Stack>
          </Stack>

          <Typography variant="overline" color="text.secondary">
            {snapshot.modeLabel} · {snapshot.tileSet} ·{" "}
            {t("liveWatchFirstTo", { n: snapshot.maxPoints })} ·{" "}
            {snapshot.isClosed ? t("liveWatchClosed") : t("liveWatchOpen")}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.25, mb: 0.25 }}>
            {snapshot.overallLine}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t("liveWatchGame", { n: snapshot.gameIndex })} ·{" "}
            {snapshot.currentLine}
          </Typography>

          {fullPad ? (
            <LiveWatchScoreboard snapshot={snapshot} />
          ) : (
            <LegacyTeamCards snapshot={snapshot} />
          )}
        </Box>
      </Box>

      {fullPad ? <LiveWatchStatsPanel snapshot={snapshot} /> : null}
    </Box>
  );
}

type WatchStatusTone = "ended" | "error" | "full" | "disabled" | "loading";

function watchStatusChipSx(tone: WatchStatusTone) {
  switch (tone) {
    case "ended":
      return {
        bgcolor: alpha("#6B4F3A", 0.16),
        color: "#6B4F3A",
        fontWeight: 700,
      };
    case "error":
      return {
        bgcolor: alpha("#8B2E2E", 0.14),
        color: "#8B2E2E",
        fontWeight: 700,
      };
    case "full":
      return {
        bgcolor: alpha("#8A5A12", 0.16),
        color: "#8A5A12",
        fontWeight: 700,
      };
    case "disabled":
    case "loading":
      return {
        bgcolor: alpha("#1F6B58", 0.18),
        color: "#1F6B58",
        fontWeight: 700,
      };
    default: {
      const _never: never = tone;
      return _never;
    }
  }
}

function terminalCopy(
  reason: TerminalReason,
  t: (key: string) => string,
  stopped: boolean
): {
  tone: WatchStatusTone;
  chip: string;
  title: string;
  lead?: string;
  body: string;
} {
  const stoppedLead = stopped ? t("liveWatchStoppedLead") : undefined;
  switch (reason) {
    case "ended":
      return {
        tone: "ended",
        chip: t("liveWatchEndedChip"),
        title: t("liveWatchEndedTitle"),
        lead: stoppedLead ?? t("liveWatchEndedLead"),
        body: t("liveWatchEnded"),
      };
    case "expired":
      return {
        tone: "ended",
        chip: t("liveWatchExpiredChip"),
        title: t("liveWatchExpiredTitle"),
        lead: stoppedLead ?? t("liveWatchExpiredLead"),
        body: t("liveWatchExpired"),
      };
    case "kicked":
      return {
        tone: "ended",
        chip: t("liveWatchKickedChip"),
        title: t("liveWatchKickedTitle"),
        lead: stoppedLead ?? t("liveWatchKickedLead"),
        body: t("liveWatchKicked"),
      };
    case "disconnected":
      return {
        tone: "ended",
        chip: t("liveWatchDisconnectedChip"),
        title: t("liveWatchDisconnectedTitle"),
        lead: t("liveWatchDisconnectedLead"),
        body: t("liveWatchDisconnected"),
      };
    case "full":
      return {
        tone: "full",
        chip: t("liveWatchFullChip"),
        title: t("liveWatchFullTitle"),
        lead: stoppedLead,
        body: t("liveWatchFullBody"),
      };
    case "disabled":
      return {
        tone: "disabled",
        chip: t("liveWatchDisabledChip"),
        title: t("liveWatchDisabledTitle"),
        lead: stoppedLead,
        body: t("liveWatchDisabledBody"),
      };
    case "network":
      return {
        tone: "error",
        chip: t("liveWatchNetworkChip"),
        title: t("liveWatchNetworkTitle"),
        lead: stoppedLead,
        body: t("liveWatchNetwork"),
      };
    case "error":
      return {
        tone: "error",
        chip: t("liveWatchErrorChip"),
        title: t("liveWatchErrorTitle"),
        lead: stoppedLead,
        body: t("liveWatchError"),
      };
    default: {
      const _never: never = reason;
      return _never;
    }
  }
}

function WatchStatusPanel({
  tone,
  chip,
  title,
  lead,
  body,
  pulse,
  actionLabel,
  onAction,
}: {
  tone: WatchStatusTone;
  chip: string;
  title: string;
  lead?: string;
  body: string;
  pulse?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flex: { xs: "0 0 auto", md: 1 },
        width: "100%",
        minHeight: { xs: "70vh", md: "100%" },
        bgcolor: "#F1E7D6",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 5, md: 7 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 460,
          textAlign: "center",
          borderRadius: 3,
          border: "1px dashed",
          borderColor: alpha("#1F6B58", 0.28),
          bgcolor: alpha("#FDF8EE", 0.94),
          px: { xs: 3, sm: 4.5 },
          py: { xs: 4, sm: 5 },
          boxShadow: `0 18px 40px ${alpha("#3A2A18", 0.08)}`,
        }}
      >
        <Chip
          size="small"
          label={chip}
          sx={{
            ...watchStatusChipSx(tone),
            ...(pulse
              ? {
                  "@keyframes olympusLiveChip": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.42 },
                  },
                  animation: "olympusLiveChip 1.4s ease-in-out infinite",
                }
              : null),
          }}
        />
        {lead ? (
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mt: 2.5,
              letterSpacing: "0.14em",
              color: "text.secondary",
            }}
          >
            {lead}
          </Typography>
        ) : null}
        <Typography
          component="h1"
          sx={{
            mt: lead ? 0.5 : 2,
            mb: 1,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: { xs: 28, sm: 34 },
            lineHeight: 1.15,
            color: "#2C2118",
          }}
        >
          {title}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mb: actionLabel || pulse ? 3 : 0, maxWidth: 340, mx: "auto" }}
        >
          {body}
        </Typography>
        {pulse ? (
          <LinearProgress
            aria-hidden
            sx={{
              height: 3,
              maxWidth: 180,
              mx: "auto",
              mb: actionLabel ? 3 : 0,
              borderRadius: 99,
              bgcolor: alpha("#1F6B58", 0.12),
              "& .MuiLinearProgress-bar": { bgcolor: "#1F6B58" },
            }}
          />
        ) : null}
        {actionLabel && onAction ? (
          <Button
            variant="outlined"
            onClick={onAction}
            sx={{
              borderColor: "#1F6B58",
              color: "#1F6B58",
              "&:hover": {
                borderColor: "#185546",
                bgcolor: alpha("#1F6B58", 0.08),
              },
            }}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

/** Fallback for older snapshots that only had summary teams. */
function LegacyTeamCards({ snapshot }: { snapshot: LiveWatchSnapshot }) {
  const { t } = useTranslation();
  return (
    <Stack spacing={1.5}>
      {snapshot.teams.map((team) => (
        <Box
          key={team.teamNumber}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: alpha("#FDF8EE", 0.95),
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700}>{team.label}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {team.names.filter(Boolean).join(" · ") || "—"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="baseline">
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                {t("liveWatchWins")}
              </Typography>
              <Typography variant="h4" fontWeight={800} lineHeight={1}>
                {team.wins}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                {t("liveWatchPts")}
              </Typography>
              <Typography variant="h4" fontWeight={800} lineHeight={1}>
                {team.points}
              </Typography>
            </Box>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
