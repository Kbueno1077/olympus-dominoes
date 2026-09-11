"use client";

import { LIVE_WATCH_POLL_MS, type LiveWatchSnapshot } from "@/lib/liveWatch/types";
import { hasFullPadPayload } from "@/lib/liveWatch/fromSnapshot";
import LiveWatchScoreboard from "@/modules/LiveWatch/LiveWatchScoreboard";
import LiveWatchStatsPanel from "@/modules/LiveWatch/LiveWatchStatsPanel";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type WatchState =
  | { kind: "loading" }
  | { kind: "live"; snapshot: LiveWatchSnapshot; viewerCount: number }
  | { kind: "ended"; message: string }
  | { kind: "full" }
  | { kind: "disabled" }
  | { kind: "error"; message: string };

const VIEWER_KEY = (id: string) => `olympus.liveWatch.viewer.${id}`;

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

export default function LiveWatchClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [state, setState] = useState<WatchState>({ kind: "loading" });
  const viewerIdRef = useRef<string | null>(null);
  const stoppedRef = useRef(false);
  const tickInFlight = useRef(false);

  const disconnect = useCallback(async () => {
    stoppedRef.current = true;
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
    setState({ kind: "ended", message: t("liveWatchDisconnected") });
  }, [id, t]);

  useEffect(() => {
    if (!id) return;
    stoppedRef.current = false;
    let cancelled = false;

    async function tick() {
      if (cancelled || stoppedRef.current || tickInFlight.current) return;
      tickInFlight.current = true;

      try {
        const viewerId = ensureViewerId(id);
        viewerIdRef.current = viewerId;

        // Always "join" with a stable client id — server upserts (no double count).
        const joinRes = await fetch(`/api/live-watch/${id}/viewers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", viewerId }),
        });

        if (joinRes.status === 503) {
          if (!cancelled) setState({ kind: "disabled" });
          return;
        }
        if (joinRes.status === 403) {
          if (!cancelled) setState({ kind: "full" });
          return;
        }
        if (joinRes.status === 404 || joinRes.status === 410) {
          let err = "";
          try {
            const body = await joinRes.json();
            err = String(body?.error ?? "");
          } catch {
            // ignore
          }
          if (err === "viewer" && !cancelled) {
            stoppedRef.current = true;
            try {
              sessionStorage.removeItem(VIEWER_KEY(id));
            } catch {
              // ignore
            }
            viewerIdRef.current = null;
            setState({ kind: "ended", message: t("liveWatchKicked") });
            return;
          }
          if (!cancelled) {
            setState({ kind: "ended", message: t("liveWatchEnded") });
          }
          return;
        }

        if (!joinRes.ok) {
          if (!cancelled) {
            setState({ kind: "error", message: t("liveWatchError") });
          }
          return;
        }

        const joinBody = await joinRes.json();
        if (joinBody.viewerId && joinBody.viewerId !== viewerId) {
          viewerIdRef.current = joinBody.viewerId;
          try {
            sessionStorage.setItem(VIEWER_KEY(id), joinBody.viewerId);
          } catch {
            // ignore
          }
        }

        const res = await fetch(`/api/live-watch/${id}`, { cache: "no-store" });
        if (res.status === 503) {
          if (!cancelled) setState({ kind: "disabled" });
          return;
        }
        if (res.status === 404) {
          if (!cancelled) {
            setState({ kind: "ended", message: t("liveWatchEnded") });
          }
          return;
        }
        if (!res.ok) {
          if (!cancelled) {
            setState({ kind: "error", message: t("liveWatchError") });
          }
          return;
        }
        const data = await res.json();
        if (!cancelled && data.snapshot) {
          setState({
            kind: "live",
            snapshot: data.snapshot,
            viewerCount: data.viewerCount ?? joinBody.viewerCount ?? 0,
          });
        }
      } catch {
        if (!cancelled) {
          setState({ kind: "error", message: t("liveWatchError") });
        }
      } finally {
        tickInFlight.current = false;
      }
    }

    void tick();
    const timer = setInterval(() => {
      void tick();
    }, LIVE_WATCH_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id, t]);

  if (state.kind === "loading") {
    return (
      <Box sx={{ p: 3, maxWidth: 920, mx: "auto" }}>
        <Typography color="text.secondary">{t("liveWatchLoading")}</Typography>
      </Box>
    );
  }

  if (state.kind === "disabled") {
    return (
      <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t("liveWatchDisabledTitle")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t("liveWatchDisabledBody")}
        </Typography>
        <Button variant="outlined" onClick={() => router.push("/")}>
          {t("liveWatchGoHome")}
        </Button>
      </Box>
    );
  }

  if (state.kind === "full") {
    return (
      <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t("liveWatchFullTitle")}
        </Typography>
        <Typography color="text.secondary">{t("liveWatchFullBody")}</Typography>
      </Box>
    );
  }

  if (state.kind === "ended" || state.kind === "error") {
    return (
      <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {state.kind === "ended"
            ? t("liveWatchEndedTitle")
            : t("liveWatchErrorTitle")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {state.message}
        </Typography>
        <Button variant="outlined" onClick={() => router.push("/")}>
          {t("liveWatchGoHome")}
        </Button>
      </Box>
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
