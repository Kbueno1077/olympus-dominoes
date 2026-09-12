"use client";

import {
  LIVE_WATCH_ADMIN_POLL_MS,
  LIVE_WATCH_MAX_SHARES,
  LIVE_WATCH_VIEWER_MAX,
  LIVE_WATCH_VIEWER_WARN,
} from "@/lib/liveWatch/types";
import { useTranslation } from "@/i18n/useTranslation";
import { ToolsPanelHeader, ToolsQuietCard, toolsPaperSx } from "@/modules/Analytics/ToolsChrome";
import useToast from "@/hooks/useToast";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState, Fragment } from "react";

type AdminViewer = {
  id: string;
  displayName?: string;
  joinOrder?: number;
  joinedAt: number;
  lastSeenAt: number;
};

type AdminSession = {
  id: string;
  matchId: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  viewerCount: number;
  viewers: AdminViewer[];
  overallLine: string;
  currentLine: string;
  modeLabel: string;
  isClosed: boolean;
};

function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.round(m / 60)}h`;
}

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    return String(body?.error || body?.message || "");
  } catch {
    return "";
  }
}

function watchAdminErrorDetail(
  t: (key: string) => string,
  status: number,
  code: string
): string {
  switch (code) {
    case "unauthorized":
      return t("toastErrorNoAccess");
    case "not_found":
    case "not_found_or_unauthorized":
      return t("toastErrorShareGone");
    case "expired":
      return t("toastErrorShareExpired");
    case "disabled":
      return t("toastErrorLiveOff");
    default:
      break;
  }
  if (status === 401 || status === 403) return t("toastErrorNoAccess");
  if (status === 404) return t("toastErrorShareGone");
  if (status === 410) return t("toastErrorShareExpired");
  if (status === 503) return t("toastErrorLiveOff");
  return t("toastErrorTryAgain");
}

export default function ToolsLiveWatchPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const tRef = useRef(t);
  tRef.current = t;

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [shareCount, setShareCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/live-watch", { cache: "no-store" });
      if (!res.ok) {
        const code = await readApiError(res);
        toastRef.current(tRef.current("liveWatchAdminLoadFailed"), "error", {
          detail:
            code || res.status
              ? watchAdminErrorDetail(tRef.current, res.status, code)
              : tRef.current("liveWatchAdminLoadFailedDetail"),
        });
        return;
      }
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setShareCount(data.shareCount ?? 0);
    } catch {
      toastRef.current(tRef.current("liveWatchAdminLoadFailed"), "error", {
        detail: tRef.current("toastErrorOffline"),
      });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, LIVE_WATCH_ADMIN_POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const failAction = async (
    titleKey: string,
    res: Response
  ): Promise<boolean> => {
    if (res.ok) return false;
    const code = await readApiError(res);
    toast(t(titleKey), "error", {
      detail: watchAdminErrorDetail(t, res.status, code),
    });
    return true;
  };

  const removeShare = async (id: string) => {
    try {
      const res = await fetch(`/api/live-watch/admin/${id}`, { method: "DELETE" });
      if (await failAction("liveWatchAdminRemoveFailed", res)) return;
    } catch {
      toast(t("liveWatchAdminRemoveFailed"), "error", {
        detail: t("toastErrorOffline"),
      });
      return;
    }
    toast(t("liveWatchAdminRemoved"), "success");
    void refresh();
  };

  const clearViewers = async (id: string) => {
    try {
      const res = await fetch(`/api/live-watch/admin/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_viewers" }),
      });
      if (await failAction("liveWatchAdminClearFailed", res)) return;
    } catch {
      toast(t("liveWatchAdminClearFailed"), "error", {
        detail: t("toastErrorOffline"),
      });
      return;
    }
    toast(t("liveWatchAdminViewersCleared"), "success");
    void refresh();
  };

  const kickViewer = async (shareId: string, viewerId: string) => {
    try {
      const res = await fetch(`/api/live-watch/admin/${shareId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kick_viewer", viewerId }),
      });
      if (await failAction("liveWatchAdminKickFailed", res)) return;
    } catch {
      toast(t("liveWatchAdminKickFailed"), "error", {
        detail: t("toastErrorOffline"),
      });
      return;
    }
    toast(t("liveWatchAdminViewerKicked"), "success");
    void refresh();
  };

  return (
    <Box>
      <ToolsPanelHeader
        overline={t("toolsLiveWatchKicker")}
        title={t("liveWatchAdminTitle")}
        hint={t("liveWatchAdminHint", {
          used: shareCount,
          max: LIVE_WATCH_MAX_SHARES,
          warn: LIVE_WATCH_VIEWER_WARN,
          cap: LIVE_WATCH_VIEWER_MAX,
          hours: 10,
        })}
        extra={
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.85, lineHeight: 1.45 }}
          >
            {t("liveWatchAdminPollHint", { minutes: 5 })}
          </Typography>
        }
        trailing={
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              void refresh();
            }}
            disabled={loading}
          >
            {t("liveWatchAdminRefresh")}
          </Button>
        }
      />

      <Chip
        label={`${shareCount} / ${LIVE_WATCH_MAX_SHARES}`}
        color={shareCount >= LIVE_WATCH_MAX_SHARES ? "error" : "default"}
        sx={{ mb: 2 }}
      />

      {loading && sessions.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.5}
          sx={{ py: 6 }}
        >
          <CircularProgress size={32} thickness={4} sx={{ color: "#1F6B58" }} />
          <Typography color="text.secondary">
            {t("liveWatchAdminLoading")}
          </Typography>
        </Stack>
      ) : sessions.length === 0 ? (
        <ToolsQuietCard>{t("liveWatchAdminEmpty")}</ToolsQuietCard>
      ) : (
        <Box sx={[toolsPaperSx(), { p: 0, overflow: "auto" }]}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>{t("liveWatchAdminColId")}</TableCell>
              <TableCell>{t("liveWatchAdminColScore")}</TableCell>
              <TableCell>{t("liveWatchAdminColViewers")}</TableCell>
              <TableCell>{t("liveWatchAdminColAge")}</TableCell>
              <TableCell align="right">{t("liveWatchAdminColActions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => {
              const open = Boolean(expanded[s.id]);
              const viewers = s.viewers ?? [];
              return (
                <Fragment key={s.id}>
                  <TableRow hover>
                    <TableCell>
                      <Tooltip
                        title={
                          open
                            ? t("liveWatchAdminHideViewers")
                            : t("liveWatchAdminToggleViewers")
                        }
                      >
                        <IconButton
                          size="small"
                          aria-label={
                            open
                              ? t("liveWatchAdminHideViewers")
                              : t("liveWatchAdminToggleViewers")
                          }
                          onClick={() =>
                            setExpanded((prev) => ({
                              ...prev,
                              [s.id]: !prev[s.id],
                            }))
                          }
                        >
                          {open ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {s.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.modeLabel} · {s.isClosed ? "closed" : "open"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.overallLine}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.currentLine}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={s.viewerCount}
                        color={
                          s.viewerCount >= LIVE_WATCH_VIEWER_MAX
                            ? "error"
                            : s.viewerCount >= LIVE_WATCH_VIEWER_WARN
                              ? "warning"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {t("liveWatchAdminUpdated", {
                          ago: ago(Date.now() - s.updatedAt),
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("liveWatchAdminExpires", {
                          left: ago(Math.max(0, s.expiresAt - Date.now())),
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t("liveWatchAdminClearViewers")}>
                        <IconButton
                          size="small"
                          aria-label={t("liveWatchAdminClearViewers")}
                          onClick={() => {
                            void clearViewers(s.id);
                          }}
                        >
                          <PersonOffOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("liveWatchAdminRemove")}>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={t("liveWatchAdminRemove")}
                          onClick={() => {
                            void removeShare(s.id);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        href={`/watch/${s.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("liveWatchAdminOpen")}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                      <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 2, py: 1.5, bgcolor: "action.hover" }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, fontWeight: 700 }}
                          >
                            {t("liveWatchAdminViewersTitle", {
                              n: viewers.length,
                            })}
                          </Typography>
                          {viewers.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              {t("liveWatchAdminNoViewers")}
                            </Typography>
                          ) : (
                            <Stack spacing={0.75}>
                              {viewers.map((v) => (
                                <Stack
                                  key={v.id}
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  spacing={1}
                                  sx={{
                                    bgcolor: "background.paper",
                                    borderRadius: 1,
                                    px: 1.25,
                                    py: 0.75,
                                  }}
                                >
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" noWrap>
                                      {v.joinOrder
                                        ? `#${v.joinOrder} ${v.displayName || v.id}`
                                        : v.displayName || v.id}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      fontFamily="monospace"
                                      noWrap
                                    >
                                      {v.id}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block" }}
                                    >
                                      {t("liveWatchAdminViewerSeen", {
                                        joined: ago(Date.now() - v.joinedAt),
                                        seen: ago(Date.now() - v.lastSeenAt),
                                      })}
                                    </Typography>
                                  </Box>
                                  <Button
                                    size="small"
                                    color="warning"
                                    startIcon={
                                      <PersonRemoveOutlinedIcon fontSize="small" />
                                    }
                                    onClick={() => {
                                      void kickViewer(s.id, v.id);
                                    }}
                                  >
                                    {t("liveWatchAdminKickOne")}
                                  </Button>
                                </Stack>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
        </Box>
      )}
    </Box>
  );
}
