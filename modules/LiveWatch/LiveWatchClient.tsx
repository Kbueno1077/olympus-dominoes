"use client";

import {
  LIVE_WATCH_FAIL_LIMIT,
  LIVE_WATCH_POLL_MS,
  LIVE_WATCH_RETRY_MS,
  type LiveWatchPublicViewer,
  type LiveWatchSnapshot,
} from "@/lib/liveWatch/types";
import { LIVE_WATCH_DISPLAY_NAME_MAX } from "@/lib/liveWatch/displayName";
import { hasFullPadPayload } from "@/lib/liveWatch/fromSnapshot";
import LiveWatchScoreboard from "@/modules/LiveWatch/LiveWatchScoreboard";
import LiveWatchStatsPanel from "@/modules/LiveWatch/LiveWatchStatsPanel";
import LiveWatchViewersRail from "@/modules/LiveWatch/LiveWatchViewersRail";
import { FONT_DISPLAY } from "@/muiTheme/typography";
import { useTranslation } from "@/i18n/useTranslation";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

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
  | { kind: "name" }
  | { kind: "loading" }
  | {
      kind: "live";
      snapshot: LiveWatchSnapshot;
      viewers: LiveWatchPublicViewer[];
      selfId: string;
    }
  | { kind: "terminal"; reason: TerminalReason; stopped: boolean };

const VIEWER_KEY = (id: string) => `olympus.liveWatch.viewer.${id}`;
const NAME_KEY = (id: string) => `olympus.liveWatch.name.${id}`;

function pageIsVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

function readStored(key: string): string | null {
  try {
    const value = sessionStorage.getItem(key);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeStored(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Stable id before any network call — prevents double-counting on Strict Mode. */
function ensureViewerId(shareId: string): string {
  const existing = readStored(VIEWER_KEY(shareId));
  if (existing && existing.length >= 8) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  writeStored(VIEWER_KEY(shareId), id);
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
  const [state, setState] = useState<WatchState>({ kind: "name" });
  const [watching, setWatching] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const viewerIdRef = useRef<string | null>(null);
  const displayNameRef = useRef<string | null>(null);
  const watchingRef = useRef(false);
  const leftRef = useRef(false);
  const haltedRef = useRef(false);
  const liveRef = useRef(false);
  const failCountRef = useRef(0);
  const pendingRetryRef = useRef(false);
  const syncRef = useRef<() => Promise<void>>(async () => {});

  const disconnect = useCallback(async () => {
    leftRef.current = true;
    haltedRef.current = true;
    liveRef.current = false;
    watchingRef.current = false;
    setWatching(false);
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
      removeStored(VIEWER_KEY(id));
      removeStored(NAME_KEY(id));
    }
    setState({ kind: "terminal", reason: "disconnected", stopped: true });
  }, [id]);

  const beginWatching = useCallback(
    (displayName: string | null) => {
      if (!id || watchingRef.current) return;
      displayNameRef.current = displayName;
      watchingRef.current = true;
      leftRef.current = false;
      haltedRef.current = false;
      liveRef.current = false;
      failCountRef.current = 0;
      setWatching(true);
      setState({ kind: "loading" });
    },
    [id]
  );

  const refreshLive = useCallback(() => {
    if (leftRef.current || !watchingRef.current) return;
    if (haltedRef.current) return;
    setRefreshing(true);
    void (async () => {
      await syncRef.current();
      setRefreshing(false);
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    const savedName = readStored(NAME_KEY(id));
    if (savedName) {
      setNameDraft(savedName);
      beginWatching(savedName);
    }
  }, [id, beginWatching]);

  useEffect(() => {
    if (!id || !watching) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let busy = false;

    function clearRetry() {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    }

    function noteSuccess() {
      failCountRef.current = 0;
      haltedRef.current = false;
      pendingRetryRef.current = false;
    }

    function scheduleRetry() {
      clearRetry();
      retryTimer = setTimeout(() => {
        if (cancelled || leftRef.current || haltedRef.current) return;
        if (!pageIsVisible()) {
          pendingRetryRef.current = true;
          return;
        }
        void sync();
      }, LIVE_WATCH_RETRY_MS);
    }

    function noteFailure(reason: TerminalReason) {
      failCountRef.current += 1;
      if (failCountRef.current < LIVE_WATCH_FAIL_LIMIT) {
        scheduleRetry();
        return;
      }
      haltedRef.current = true;
      liveRef.current = false;
      watchingRef.current = false;
      pendingRetryRef.current = false;
      clearRetry();
      if (!cancelled) {
        setWatching(false);
        setRefreshing(false);
        setState({ kind: "terminal", reason, stopped: true });
      }
    }

    async function sync() {
      if (cancelled || leftRef.current || haltedRef.current || busy) {
        return;
      }
      if (!pageIsVisible() && liveRef.current) {
        pendingRetryRef.current = true;
        return;
      }
      busy = true;
      try {
        const viewerId = ensureViewerId(id);
        viewerIdRef.current = viewerId;
        const res = await fetch(`/api/live-watch/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            viewerId,
            displayName: displayNameRef.current || undefined,
          }),
        });
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
          viewers?: LiveWatchPublicViewer[];
          viewerId?: string;
        };
        if (!data.snapshot) {
          noteFailure("error");
          return;
        }
        const selfId =
          typeof data.viewerId === "string" && data.viewerId.length >= 8
            ? data.viewerId
            : viewerId;
        if (selfId !== viewerId) {
          viewerIdRef.current = selfId;
          writeStored(VIEWER_KEY(id), selfId);
        }
        const self = (data.viewers ?? []).find((v) => v.id === selfId);
        if (self?.displayName) {
          displayNameRef.current = self.displayName;
          writeStored(NAME_KEY(id), self.displayName);
        }
        noteSuccess();
        liveRef.current = true;
        setState({
          kind: "live",
          snapshot: data.snapshot,
          viewers: data.viewers ?? [],
          selfId,
        });
      } catch {
        if (!cancelled && !leftRef.current) noteFailure("network");
      } finally {
        busy = false;
      }
    }

    syncRef.current = sync;
    void sync();

    const pollTimer = setInterval(() => {
      if (!pageIsVisible()) return;
      void sync();
    }, LIVE_WATCH_POLL_MS);

    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (haltedRef.current || leftRef.current || !watchingRef.current) return;
      pendingRetryRef.current = false;
      void sync();
    }

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearRetry();
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [id, watching]);

  if (state.kind === "name") {
    return (
      <WatchStatusPanel
        tone="loading"
        title={t("liveWatchNameTitle")}
        body={t("liveWatchNameBody")}
      >
        <Stack
          component="form"
          spacing={1.5}
          onSubmit={(event) => {
            event.preventDefault();
            const typed = nameDraft.trim();
            beginWatching(typed || null);
          }}
          sx={{ mt: 0.5, textAlign: "left" }}
        >
          <TextField
            autoFocus
            fullWidth
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            label={t("liveWatchNameLabel")}
            inputProps={{ maxLength: LIVE_WATCH_DISPLAY_NAME_MAX }}
          />
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button
              type="submit"
              variant="contained"
              disableElevation
              sx={{
                bgcolor: "#1F6B58",
                color: "#FDF8EE",
                "&:hover": { bgcolor: "#185546" },
              }}
            >
              {t("liveWatchNameJoin")}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => beginWatching(null)}
              sx={{
                borderColor: "#1F6B58",
                color: "#1F6B58",
                "&:hover": {
                  borderColor: "#185546",
                  bgcolor: alpha("#1F6B58", 0.08),
                },
              }}
            >
              {t("liveWatchNameSkip")}
            </Button>
          </Stack>
        </Stack>
      </WatchStatusPanel>
    );
  }

  if (state.kind === "loading") {
    return (
      <WatchStatusPanel
        tone="loading"
        title={t("liveWatchLoadingTitle")}
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

  const { snapshot, viewers, selfId } = state;
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
      <LiveWatchViewersRail viewers={viewers} selfId={selfId} />
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
          order: { xs: 1, md: 0 },
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
          <WatchLiveMasthead
            viewerCount={viewers.length}
            refreshing={refreshing}
            onRefresh={refreshLive}
            onDisconnect={() => {
              void disconnect();
            }}
          />

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

const creamCardSx = {
  borderRadius: 2,
  border: "1px solid",
  borderColor: alpha("#1F6B58", 0.18),
  bgcolor: alpha("#FDF8EE", 0.92),
  px: { xs: 1.75, sm: 2.25 },
  py: { xs: 1.6, sm: 2 },
  mb: 2,
  boxShadow: `0 10px 28px ${alpha("#3A2A18", 0.05)}`,
};

function WatchLiveMasthead({
  viewerCount,
  refreshing,
  onRefresh,
  onDisconnect,
}: {
  viewerCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Box sx={{ ...creamCardSx, py: { xs: 1.25, sm: 1.35 }, mb: 1.5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.25}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ minWidth: 0 }}
        >
          <Chip
            size="small"
            label={t("liveWatchLive")}
            sx={{
              bgcolor: alpha("#1F6B58", 0.18),
              color: "#1F6B58",
              fontWeight: 700,
              "@keyframes olympusLiveChip": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.42 },
              },
              animation: "olympusLiveChip 1.4s ease-in-out infinite",
            }}
          />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13.5,
              color: "#1F6B58",
            }}
          >
            {t("liveWatchViewers", { n: viewerCount })}
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            flexShrink: 0,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Tooltip title={t("liveWatchPollHint", { minutes: 3 })}>
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Button
                fullWidth
                variant="contained"
                disableElevation
                startIcon={<RefreshIcon />}
                disabled={refreshing}
                onClick={onRefresh}
                sx={{
                  py: 1.05,
                  px: 2,
                  minWidth: { sm: 132 },
                  fontWeight: 700,
                  textTransform: "none",
                  bgcolor: "#1F6B58",
                  color: "#FDF8EE",
                  "&:hover": { bgcolor: "#185546" },
                  "@keyframes olympusRefreshSpin": {
                    to: { transform: "rotate(360deg)" },
                  },
                  "& .MuiButton-startIcon": refreshing
                    ? {
                        animation: "olympusRefreshSpin 0.8s linear infinite",
                      }
                    : null,
                }}
              >
                {t("liveWatchRefresh")}
              </Button>
            </Box>
          </Tooltip>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            startIcon={<LogoutOutlinedIcon />}
            onClick={onDisconnect}
            sx={{
              py: 1.05,
              px: 2,
              minWidth: { sm: 168 },
              fontWeight: 700,
              textTransform: "none",
              bgcolor: "#6B4F3A",
              color: "#FDF8EE",
              "&:hover": { bgcolor: "#563D2C" },
            }}
          >
            {t("liveWatchDisconnect")}
          </Button>
        </Stack>
      </Stack>
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
  chip?: string;
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
        title: t("liveWatchDisconnectedTitle"),
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
        title: t("liveWatchUnavailableTitle"),
        lead: stoppedLead,
        body: t("liveWatchUnavailableBody"),
      };
    case "error":
      return {
        tone: "error",
        chip: t("liveWatchErrorChip"),
        title: t("liveWatchUnavailableTitle"),
        lead: stoppedLead,
        body: t("liveWatchUnavailableBody"),
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
  children,
}: {
  tone: WatchStatusTone;
  chip?: string;
  title: string;
  lead?: string;
  body: string;
  pulse?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
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
        {chip ? (
          <Chip
            size="small"
            label={chip}
            sx={watchStatusChipSx(tone)}
          />
        ) : null}
        {lead ? (
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mt: chip ? 2.5 : 0,
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
            mt: chip || lead ? (lead ? 0.5 : 2) : 0,
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
          sx={{
            mb: actionLabel || pulse || children ? 3 : 0,
            maxWidth: 340,
            mx: "auto",
          }}
        >
          {body}
        </Typography>
        {pulse ? (
          <CircularProgress
            size={32}
            thickness={4}
            sx={{
              color: "#1F6B58",
              mb: actionLabel || children ? 3 : 0,
            }}
          />
        ) : null}
        {children}
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
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", lineHeight: 1.4 }}
      >
        {snapshot.modeLabel} · {snapshot.tileSet} ·{" "}
        {t("liveWatchFirstTo", { n: snapshot.maxPoints })}
      </Typography>
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
