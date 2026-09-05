"use client";

import RestoreHiddenPlayersPanel from "@/modules/Analytics/RestoreHiddenPlayersPanel";
import ToolsDedupePanel from "@/modules/Analytics/ToolsDedupePanel";
import ToolsExtractPanel from "@/modules/Analytics/ToolsExtractPanel";
import ToolsRepairPanel from "@/modules/Analytics/ToolsRepairPanel";
import DashboardAside from "@/modules/Analytics/DashboardAside";
import {
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { loadDatasetData } from "@/lib/analytics/datasets";
import {
  formatMatchDate,
  getMatchDetail,
  teamLabelsForDetail,
  type HistoryGame,
} from "@/lib/analytics/history";
import {
  analyzeMerge,
  areAllConflictsResolved,
  emptyResolutions,
  previewMergeCounts,
  selectMatchCandidates,
  type MatchCandidate,
  type MatchContentConflict,
  type MergePlan,
  type MergeResolutions,
  type MergeSource,
} from "@/lib/analytics/mergeDatasets";
import { withEnsuredDbMeta } from "@/lib/analytics/dbMetaState";
import { withEnsuredMatchPublicIds } from "@/lib/analytics/matchIdentity";
import { withEnsuredPlayerPublicIds } from "@/lib/analytics/playerIdentity";
import { useTranslation } from "@/i18n/useTranslation";
import { statsDataDrawerOpenRecoil } from "@/recoil/recoilState";
import useToast from "@/hooks/useToast";
import {
  activeTeamNumbers,
  TEAM_KEYS,
  tallyWins,
} from "@/utils/matchSettings";
import { teamsFromRoster } from "@/utils/teams";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CallMergeOutlinedIcon from "@mui/icons-material/CallMergeOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import DifferenceOutlinedIcon from "@mui/icons-material/DifferenceOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { useSetRecoilState } from "recoil";

const GIT_OURS = "#1a7f37";
const GIT_THEIRS = "#cf222e";
const GIT_SEP = "#9a6700";
const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

type Step = "select" | "review" | "approve";
type ToolId = "restore" | "merge" | "dedupe" | "extract" | "repair";

type ConflictSide = {
  key: string;
  label: string;
  sourceName: string;
  lines: string[];
};

function loadSources(
  datasetIds: string[],
  registry: ReturnType<typeof useAnalytics>["registry"]
): MergeSource[] {
  const sources: MergeSource[] = [];
  for (const id of datasetIds) {
    const meta = registry.datasets.find((d) => d.id === id);
    const raw = loadDatasetData(id);
    if (!meta || !raw) continue;
    const data = withEnsuredMatchPublicIds(
      withEnsuredDbMeta(withEnsuredPlayerPublicIds(raw), {
        origin: "web",
        label: meta.displayName,
      })
    );
    sources.push({
      datasetId: id,
      displayName: meta.displayName,
      data,
    });
  }
  return sources;
}

function sourceByIdMap(sources: MergeSource[]) {
  return new Map(sources.map((s) => [s.datasetId, s]));
}

/**
 * Prototype: pick 2+ datasets, resolve player/match conflicts, create a new DB.
 */
export default function MergeDatasets() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const displayToast = useToast();
  const { registry, createMergedDataset, loading } = useAnalytics();
  const openDataDrawer = useSetRecoilState(statsDataDrawerOpenRecoil);

  const [tool, setTool] = useState<ToolId>("restore");
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [plan, setPlan] = useState<MergePlan | null>(null);
  const [sources, setSources] = useState<MergeSource[]>([]);
  const [resolutions, setResolutions] =
    useState<MergeResolutions>(emptyResolutions());
  const [mergeName, setMergeName] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [cleanOpen, setCleanOpen] = useState(false);
  const [gamesOpenId, setGamesOpenId] = useState<string | null>(null);
  const [detailOpenKeys, setDetailOpenKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [excludeMatchKeys, setExcludeMatchKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingDelete, setPendingDelete] = useState<MatchCandidate | null>(
    null
  );

  const fmt = (iso: string) => formatMatchDate(language, iso);

  const selectable = useMemo(() => {
    return registry.datasets
      .map((ds) => {
        const data = loadDatasetData(ds.id);
        if (!data) return null;
        return {
          id: ds.id,
          displayName: ds.displayName,
          playerCount: data.players.length,
          matchCount: (data.tables.matches ?? data.matches ?? []).length,
          origin: data.db_meta?.origin ?? "—",
        };
      })
      .filter(Boolean) as {
      id: string;
      displayName: string;
      playerCount: number;
      matchCount: number;
      origin: string;
    }[];
  }, [registry.datasets]);

  const resolved = plan ? areAllConflictsResolved(plan, resolutions) : false;
  const preview =
    plan && sources.length >= 2
      ? previewMergeCounts(sources, plan, resolutions, excludeMatchKeys)
      : null;

  const resultMatches = useMemo(() => {
    if (!plan || sources.length < 2 || !resolved) return [];
    return selectMatchCandidates(sources, plan, resolutions, excludeMatchKeys);
  }, [plan, sources, resolutions, resolved, excludeMatchKeys]);

  const deletedMatches = useMemo(() => {
    if (!plan || sources.length < 2 || !resolved || excludeMatchKeys.size === 0) {
      return [];
    }
    const all = selectMatchCandidates(sources, plan, resolutions, []);
    return all.filter((m) => excludeMatchKeys.has(m.key));
  }, [plan, sources, resolutions, resolved, excludeMatchKeys]);

  const bySource = useMemo(() => sourceByIdMap(sources), [sources]);

  const toggleDetailKey = (key: string) => {
    setDetailOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const conflictTotal = plan
    ? plan.playerNameConflicts.length +
      plan.playerIdentityConflicts.length +
      plan.matchContentConflicts.length
    : 0;

  const conflictResolvedCount = useMemo(() => {
    if (!plan) return 0;
    let n = 0;
    for (const c of plan.playerNameConflicts) {
      if (resolutions.playerNames[c.id]?.pickDatasetId) n += 1;
    }
    for (const c of plan.playerIdentityConflicts) {
      if (resolutions.playerIdentities[c.id]) n += 1;
    }
    for (const c of plan.matchContentConflicts) {
      if (resolutions.matchContents[c.id]) n += 1;
    }
    return n;
  }, [plan, resolutions]);

  const skippedDupCount = plan
    ? plan.matchesSkippedDuplicates.reduce((n, g) => n + g.skipped.length, 0)
    : 0;

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    // Selection changed — drop stale analysis until they review again.
    setPlan(null);
    setSources([]);
    setResolutions(emptyResolutions());
    setExcludeMatchKeys(new Set());
    setGamesOpenId(null);
    setDetailOpenKeys(new Set());
    setPendingDelete(null);
    setLocalError(null);
  };

  const goReview = () => {
    setLocalError(null);
    if (selectedIds.length < 2) {
      setLocalError(t("mergeNeedTwo"));
      return;
    }
    try {
      const nextSources = loadSources(selectedIds, registry);
      if (nextSources.length < 2) {
        setLocalError(t("mergeMissingSource"));
        return;
      }
      const nextPlan = analyzeMerge(nextSources);
      setSources(nextSources);
      setPlan(nextPlan);
      setResolutions(emptyResolutions());
      setGamesOpenId(null);
      setDetailOpenKeys(new Set());
      setExcludeMatchKeys(new Set());
      setPendingDelete(null);
      setMergeName(
        t("mergeDefaultName", {
          a: nextSources[0].displayName,
          b: nextSources[1].displayName,
        })
      );
      setStep("review");
    } catch (err) {
      console.error(err);
      setLocalError(t("mergeAnalyzeFailed"));
    }
  };

  const create = () => {
    if (!plan || !resolved) return;
    setBusy(true);
    setLocalError(null);
    try {
      createMergedDataset(mergeName, selectedIds, resolutions, {
        excludeMatchKeys,
      });
      displayToast(t("toastMergeCreated"), "success");
      router.push("/history");
    } catch (err) {
      const code = err instanceof Error ? err.message : "failed";
      if (code === "empty_name") setLocalError(t("datasetsEmptyName"));
      else if (code === "duplicate_name")
        setLocalError(t("datasetsDuplicateName"));
      else if (code === "merge_unresolved")
        setLocalError(t("mergeUnresolved"));
      else {
        console.error(err);
        setLocalError(t("mergeCreateFailed"));
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">{t("toolsHintShort")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={dashboardShellSx}>
      <DashboardAside
        title={t("mergeNav")}
        subtitle={t("toolsHintShort")}
        filtersLabel={t("mergeNav")}
        sx={{ width: { xs: "100%", md: 380, lg: 420 } }}
      >
        <Stack
          spacing={1.5}
          sx={{
            px: 2,
            pb: 2,
            flex: 1,
            minHeight: 0,
            overflow: { xs: "visible", md: "auto" },
          }}
        >
          <Stack spacing={0.5}>
            {(
              [
                ["restore", t("toolsRestoreSection"), PersonSearchOutlinedIcon],
                ["merge", t("toolsMergeSection"), CallMergeOutlinedIcon],
                ["dedupe", t("toolsDedupeSection"), DifferenceOutlinedIcon],
                ["extract", t("toolsExtractSection"), ContentCutOutlinedIcon],
                ["repair", t("toolsRepairSection"), BuildOutlinedIcon],
              ] as const
            ).map(([id, label, Icon]) => {
              const active = tool === id;
              return (
                <Box
                  key={id}
                  component="button"
                  type="button"
                  onClick={() => setTool(id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                    textAlign: "left",
                    border: "1px solid",
                    borderColor: active
                      ? alpha(GIT_OURS, 0.45)
                      : "transparent",
                    backgroundColor: active
                      ? alpha(GIT_OURS, 0.08)
                      : "transparent",
                    borderRadius: 1.25,
                    px: 1,
                    py: 0.65,
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                    "&:hover": {
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.06),
                    },
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: 18,
                      color: active ? "primary.main" : "text.secondary",
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: active ? 700 : 500,
                      color: active ? "text.primary" : "text.secondary",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {tool === "merge" ? (
          <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            {(
              [
                ["select", t("mergeStepSelect")],
                ["review", t("mergeStepReview")],
                ["approve", t("mergeStepApprove")],
              ] as const
            ).map(([id, label], index) => {
              const active = step === id;
              const done =
                (id === "select" && step !== "select") ||
                (id === "review" && step === "approve");
              const canJump =
                (id === "select") ||
                (id === "review" && plan != null) ||
                (id === "approve" && plan != null && resolved);
              return (
                <Box
                  key={id}
                  component={canJump ? "button" : "div"}
                  type={canJump ? "button" : undefined}
                  onClick={
                    canJump
                      ? () => {
                          if (id === "select") setStep("select");
                          else if (id === "review" && plan) setStep("review");
                          else if (id === "approve" && plan && resolved) {
                            setStep("approve");
                          }
                        }
                      : undefined
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                    textAlign: "left",
                    border: "1px solid",
                    borderColor: active
                      ? alpha(GIT_OURS, 0.45)
                      : "transparent",
                    backgroundColor: active
                      ? alpha(GIT_OURS, 0.08)
                      : "transparent",
                    borderRadius: 1.25,
                    px: 1,
                    py: 0.65,
                    cursor: canJump ? "pointer" : "default",
                    font: "inherit",
                    color: "inherit",
                    "&:hover": canJump
                      ? {
                          backgroundColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.06),
                        }
                      : undefined,
                  }}
                >
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: done || active ? "#fff" : "text.secondary",
                      backgroundColor: done
                        ? GIT_OURS
                        : active
                          ? "primary.main"
                          : (theme) => alpha(theme.palette.grey[500], 0.2),
                    }}
                  >
                    {done ? "✓" : index + 1}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: active ? 700 : 500,
                      color: active
                        ? "text.primary"
                        : done
                          ? "text.primary"
                          : "text.secondary",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {selectedIds.length > 0 ? (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: 0.3 }}
              >
                {t("mergeSidebarSources")}
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                {selectedIds.map((id, index) => {
                  const name =
                    registry.datasets.find((d) => d.id === id)?.displayName ??
                    id;
                  const accent = index === 0 ? GIT_OURS : GIT_THEIRS;
                  return (
                    <Stack
                      key={id}
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      sx={{
                        px: 1,
                        py: 0.55,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: alpha(accent, 0.35),
                        backgroundColor: alpha(accent, 0.06),
                      }}
                    >
                      <Chip
                        size="small"
                        label={
                          index === 0
                            ? t("mergeGitCurrent")
                            : t("mergeGitIncoming")
                        }
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          color: accent,
                          borderColor: alpha(accent, 0.4),
                          backgroundColor: alpha(accent, 0.1),
                        }}
                        variant="outlined"
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ) : null}

          {preview && plan ? (
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: 0.3 }}
              >
                {t("mergeSidebarResult")}
              </Typography>
              <Stack direction="row" spacing={1.25} sx={{ mt: 0.75 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {t("mergeSidebarStatPlayers")}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>
                    {preview.players}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("mergeSidebarStatAdded", {
                      n: plan.playersAdded.length,
                    })}
                    {" · "}
                    {t("mergeSidebarStatShared", {
                      n: plan.playersUnchanged.length,
                    })}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: "1px",
                    alignSelf: "stretch",
                    backgroundColor: "divider",
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {t("mergeSidebarStatMatches")}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>
                    {preview.matches}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("mergeSidebarStatAdded", {
                      n: plan.matchesAdded.length,
                    })}
                    {" · "}
                    {t("mergeSidebarStatDups", { n: skippedDupCount })}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ) : null}

          {plan ? (
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
                sx={{ mb: 0.5 }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color:
                      conflictTotal === 0 || conflictResolvedCount === conflictTotal
                        ? "success.main"
                        : "text.primary",
                  }}
                >
                  {conflictTotal === 0
                    ? t("mergeSidebarNoConflicts")
                    : t("mergeSidebarConflicts", {
                        done: conflictResolvedCount,
                        total: conflictTotal,
                      })}
                </Typography>
              </Stack>
              {conflictTotal > 0 ? (
                <LinearProgress
                  variant="determinate"
                  value={(conflictResolvedCount / conflictTotal) * 100}
                  color={
                    conflictResolvedCount === conflictTotal
                      ? "success"
                      : "warning"
                  }
                  sx={{ height: 6, borderRadius: 999 }}
                />
              ) : null}
            </Box>
          ) : null}

          {step === "review" && plan ? (
            <Button
              size="small"
              variant="outlined"
              fullWidth
              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setCleanOpen(true)}
            >
              {t("mergeViewClean")}
            </Button>
          ) : null}
          </Stack>
          ) : null}
        </Stack>
      </DashboardAside>

      <Box sx={dashboardMainSx}>
        {(() => {
          switch (tool) {
            case "restore":
              return <RestoreHiddenPlayersPanel />;
            case "dedupe":
              return <ToolsDedupePanel />;
            case "extract":
              return <ToolsExtractPanel />;
            case "repair":
              return <ToolsRepairPanel />;
            case "merge":
              return (
        <Stack
          spacing={2}
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          {step === "select" ? (
            <>
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                gap={1}
                flexWrap="wrap"
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("mergeSelectTitle")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.35 }}
                  >
                    {t("mergeSelectBody")}
                  </Typography>
                </Box>
                {selectedIds.length > 0 ? (
                  <Chip
                    size="small"
                    color={selectedIds.length >= 2 ? "success" : "default"}
                    label={t("mergeSelectedCount", { n: selectedIds.length })}
                    sx={{ fontWeight: 600 }}
                  />
                ) : null}
              </Stack>

              {selectable.length < 2 ? (
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
                    {t("mergeNeedDatasets")}
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
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.25,
                    gridTemplateColumns: {
                      xs: "minmax(0, 1fr)",
                      sm: "repeat(2, minmax(0, 1fr))",
                      xl: "repeat(3, minmax(0, 1fr))",
                    },
                  }}
                >
                  {selectable.map((ds) => {
                    const checked = selectedIds.includes(ds.id);
                    const order = checked ? selectedIds.indexOf(ds.id) : -1;
                    const accent =
                      order === 0
                        ? GIT_OURS
                        : order > 0
                          ? GIT_THEIRS
                          : null;
                    return (
                      <Box
                        key={ds.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleId(ds.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleId(ds.id);
                          }
                        }}
                        sx={{
                          px: 1.5,
                          py: 1.1,
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: accent
                            ? alpha(accent, 0.55)
                            : "divider",
                          backgroundColor: accent
                            ? alpha(accent, 0.07)
                            : (theme) =>
                                alpha(theme.palette.background.paper, 0.7),
                          cursor: "pointer",
                          transition: "border-color 120ms, background-color 120ms",
                          "&:hover": {
                            borderColor: accent
                              ? accent
                              : (theme) =>
                                  alpha(theme.palette.primary.main, 0.4),
                            backgroundColor: accent
                              ? alpha(accent, 0.1)
                              : (theme) =>
                                  alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Checkbox
                            checked={checked}
                            tabIndex={-1}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleId(ds.id)}
                            sx={{ p: 0.5 }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.75}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Typography sx={{ fontWeight: 700 }}>
                                {ds.displayName}
                              </Typography>
                              {order === 0 ? (
                                <Chip
                                  size="small"
                                  label={t("mergeSelectOrderCurrent")}
                                  sx={{
                                    height: 20,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: GIT_OURS,
                                    borderColor: alpha(GIT_OURS, 0.4),
                                    backgroundColor: alpha(GIT_OURS, 0.1),
                                  }}
                                  variant="outlined"
                                />
                              ) : null}
                              {order > 0 ? (
                                <Chip
                                  size="small"
                                  label={t("mergeSelectOrderIncoming")}
                                  sx={{
                                    height: 20,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: GIT_THEIRS,
                                    borderColor: alpha(GIT_THEIRS, 0.4),
                                    backgroundColor: alpha(GIT_THEIRS, 0.1),
                                  }}
                                  variant="outlined"
                                />
                              ) : null}
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ mt: 0.5 }}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Chip
                                size="small"
                                label={`${ds.playerCount} ${t("mergeSidebarStatPlayers").toLowerCase()}`}
                                sx={{ height: 22, fontSize: 11 }}
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={`${ds.matchCount} ${t("mergeSidebarStatMatches").toLowerCase()}`}
                                sx={{ height: 22, fontSize: 11 }}
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={ds.origin}
                                sx={{ height: 22, fontSize: 11 }}
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {localError ? (
                <Typography color="error" variant="body2">
                  {localError}
                </Typography>
              ) : null}

              <Button
                variant="contained"
                size="large"
                startIcon={<CallMergeOutlinedIcon />}
                disabled={selectedIds.length < 2}
                onClick={goReview}
                sx={{
                  alignSelf: { xs: "stretch", md: "flex-start" },
                  width: { xs: "100%", md: "auto" },
                  minWidth: { md: 280 },
                }}
              >
                {t("mergeContinueReview")}
              </Button>
            </>
          ) : null}

          {step === "review" && plan ? (
            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                flexWrap="wrap"
                gap={1}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("mergeReviewTitle")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.35 }}
                  >
                    {t("mergeReviewFocus")}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setCleanOpen(true)}
                  >
                    {t("mergeViewClean")}
                  </Button>
                  <Button size="small" onClick={() => setStep("select")}>
                    {t("mergeBack")}
                  </Button>
                </Stack>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                useFlexGap
              >
                {(
                  [
                    [
                      t("mergeReviewStatIn"),
                      `${plan.totals.sourcePlayers} · ${plan.totals.sourceMatches}`,
                    ],
                    [
                      t("mergeReviewStatOut"),
                      `${preview?.players ?? plan.totals.autoMergedPlayers} · ${
                        preview?.matches ?? plan.totals.autoUniqueMatches
                      }`,
                    ],
                    [
                      t("mergeReviewStatConflicts"),
                      conflictTotal === 0
                        ? t("mergeSidebarNoConflicts")
                        : t("mergeConflictsProgress", {
                            done: conflictResolvedCount,
                            total: conflictTotal,
                          }),
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <Box
                    key={label}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      px: 1.25,
                      py: 1,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: (theme) =>
                        alpha(theme.palette.background.paper, 0.8),
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, letterSpacing: 0.3 }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, mt: 0.15 }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {conflictTotal > 0 ? (
                <LinearProgress
                  variant="determinate"
                  value={(conflictResolvedCount / conflictTotal) * 100}
                  color={
                    conflictResolvedCount === conflictTotal
                      ? "success"
                      : "warning"
                  }
                  sx={{ height: 6, borderRadius: 999 }}
                />
              ) : null}

              <Section
                title={
                  conflictTotal > 0
                    ? `${t("mergeConflictsSection")} · ${conflictResolvedCount}/${conflictTotal}`
                    : t("mergeConflictsSection")
                }
              >
                {conflictTotal === 0 ? (
                  <Typography variant="body2" color="success.main">
                    {t("mergeSidebarNoConflicts")}
                  </Typography>
                ) : null}

                {plan.playerNameConflicts.map((c) => {
                  const sides: ConflictSide[] = c.occurrences.map(
                    (o, index) => ({
                      key: o.datasetId,
                      label:
                        index === 0
                          ? t("mergeGitCurrent")
                          : t("mergeGitIncoming"),
                      sourceName: o.datasetName,
                      lines: [
                        `name: ${o.name}`,
                        `name_key: ${o.nameKey}`,
                        `public_id: ${o.publicId}`,
                        `is_myself: ${o.isMyself ? 1 : 0}`,
                      ],
                    })
                  );
                  const picked =
                    resolutions.playerNames[c.id]?.pickDatasetId ?? "";
                  return (
                    <GitConflictBlock
                      key={c.id}
                      path={`players/${c.publicId}`}
                      subtitle={t("mergeConflictPlayerNameHint")}
                      sides={sides}
                      selectedKey={picked}
                      resolved={Boolean(picked)}
                      onAccept={(key) =>
                        setResolutions((prev) => ({
                          ...prev,
                          playerNames: {
                            ...prev.playerNames,
                            [c.id]: {
                              conflictId: c.id,
                              pickDatasetId: key,
                            },
                          },
                        }))
                      }
                    />
                  );
                })}

                {plan.playerIdentityConflicts.map((c) => {
                  const sides: ConflictSide[] = c.occurrences.map(
                    (o, index) => ({
                      key: `link:${o.publicId}`,
                      label:
                        index === 0
                          ? t("mergeGitCurrent")
                          : t("mergeGitIncoming"),
                      sourceName: o.datasetName,
                      lines: [
                        `name: ${o.name}`,
                        `public_id: ${o.publicId}`,
                        `dataset: ${o.datasetName}`,
                      ],
                    })
                  );
                  const r = resolutions.playerIdentities[c.id];
                  const selectedKey = !r
                    ? ""
                    : r.action === "keep_separate"
                      ? "keep_separate"
                      : `link:${r.keepPublicId}`;
                  return (
                    <GitConflictBlock
                      key={c.id}
                      path={`players/name/${c.nameKey}`}
                      subtitle={t("mergeConflictPlayerIdentityHint")}
                      sides={sides}
                      selectedKey={selectedKey}
                      resolved={Boolean(r)}
                      bothKey="keep_separate"
                      bothLabel={t("mergeKeepSeparate")}
                      onAccept={(key) => {
                        if (key === "keep_separate") {
                          setResolutions((prev) => ({
                            ...prev,
                            playerIdentities: {
                              ...prev.playerIdentities,
                              [c.id]: {
                                conflictId: c.id,
                                action: "keep_separate",
                              },
                            },
                          }));
                          return;
                        }
                        const keepPublicId = key.replace(/^link:/, "");
                        const occ = c.occurrences.find(
                          (o) => o.publicId === keepPublicId
                        );
                        setResolutions((prev) => ({
                          ...prev,
                          playerIdentities: {
                            ...prev.playerIdentities,
                            [c.id]: {
                              conflictId: c.id,
                              action: "link",
                              keepPublicId,
                              nameFromDatasetId: occ?.datasetId,
                            },
                          },
                        }));
                      }}
                    />
                  );
                })}

                {plan.matchContentConflicts.map((c) => (
                  <MatchConflictBlock
                    key={c.id}
                    conflict={c}
                    bySource={bySource}
                    fmt={fmt}
                    open={gamesOpenId === c.id}
                    onToggleGames={() =>
                      setGamesOpenId((prev) =>
                        prev === c.id ? null : c.id
                      )
                    }
                    selectedKey={
                      !resolutions.matchContents[c.id]
                        ? ""
                        : resolutions.matchContents[c.id].action ===
                            "keep_both"
                          ? "keep_both"
                          : `pick:${resolutions.matchContents[c.id].pickKey}`
                    }
                    resolved={Boolean(resolutions.matchContents[c.id])}
                    onAccept={(key) => {
                      if (key === "keep_both") {
                        setResolutions((prev) => ({
                          ...prev,
                          matchContents: {
                            ...prev.matchContents,
                            [c.id]: {
                              conflictId: c.id,
                              action: "keep_both",
                            },
                          },
                        }));
                        return;
                      }
                      const pickKey = key.replace(/^pick:/, "");
                      setResolutions((prev) => ({
                        ...prev,
                        matchContents: {
                          ...prev.matchContents,
                          [c.id]: {
                            conflictId: c.id,
                            action: "pick",
                            pickKey,
                          },
                        },
                      }));
                    }}
                  />
                ))}
              </Section>

              {localError ? (
                <Typography color="error" variant="body2">
                  {localError}
                </Typography>
              ) : null}

              <Button
                variant="contained"
                size="large"
                disabled={!resolved}
                onClick={() => {
                  setLocalError(null);
                  setStep("approve");
                }}
                sx={{
                  alignSelf: { xs: "stretch", md: "flex-start" },
                  width: { xs: "100%", md: "auto" },
                  minWidth: { md: 280 },
                }}
              >
                {resolved
                  ? t("mergeContinueApprove")
                  : t("mergeResolveFirst")}
              </Button>
            </>
          ) : null}

          {step === "approve" && plan ? (
            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("mergeApproveTitle")}
                </Typography>
                <Button size="small" onClick={() => setStep("review")}>
                  {t("mergeBack")}
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {t("mergeApproveBody", {
                  players: preview?.players ?? 0,
                  matches: preview?.matches ?? 0,
                })}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={() => setCleanOpen(true)}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("mergeViewClean")}
              </Button>

              <Section title={t("mergeApproveMatchesTitle")}>
                {resultMatches.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                ) : (
                  resultMatches.map((m) => (
                    <MatchAuditRow
                      key={m.key}
                      candidate={m}
                      source={bySource.get(m.datasetId)}
                      fmt={fmt}
                      open={detailOpenKeys.has(`approve:${m.key}`)}
                      onToggle={() => toggleDetailKey(`approve:${m.key}`)}
                      actions={
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                          onClick={() => setPendingDelete(m)}
                          sx={{ textTransform: "none" }}
                        >
                          {t("mergeDeleteMatch")}
                        </Button>
                      }
                    />
                  ))
                )}
              </Section>

              {deletedMatches.length > 0 ? (
                <Section title={t("mergeApproveDeletedTitle")}>
                  {deletedMatches.map((m) => (
                    <MatchAuditRow
                      key={m.key}
                      candidate={m}
                      source={bySource.get(m.datasetId)}
                      fmt={fmt}
                      open={detailOpenKeys.has(`deleted:${m.key}`)}
                      onToggle={() => toggleDetailKey(`deleted:${m.key}`)}
                      dimmed
                      actions={
                        <Button
                          size="small"
                          onClick={() =>
                            setExcludeMatchKeys((prev) => {
                              const next = new Set(prev);
                              next.delete(m.key);
                              return next;
                            })
                          }
                          sx={{ textTransform: "none" }}
                        >
                          {t("mergeRestoreMatch")}
                        </Button>
                      }
                    />
                  ))}
                </Section>
              ) : null}

              <TextField
                fullWidth
                label={t("datasetsRenamePlaceholder")}
                value={mergeName}
                onChange={(e) => {
                  setLocalError(null);
                  setMergeName(e.target.value);
                }}
                error={Boolean(localError)}
                helperText={localError || undefined}
                sx={{ maxWidth: { md: 480 } }}
              />
              <Button
                variant="contained"
                disabled={busy || !mergeName.trim()}
                startIcon={<CallMergeOutlinedIcon />}
                onClick={create}
                sx={{
                  alignSelf: { xs: "stretch", md: "flex-start" },
                  width: { xs: "100%", md: "auto" },
                  minWidth: { md: 280 },
                }}
              >
                {t("mergeCreate")}
              </Button>
            </>
          ) : null}
        </Stack>
              );
            default: {
              const _never: never = tool;
              return _never;
            }
          }
        })()}
      </Box>

      <Dialog
        open={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
      >
        <DialogTitle>{t("mergeDeleteMatchConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingDelete
              ? t("mergeDeleteMatchConfirmBody", {
                  when: fmt(pendingDelete.endedAt),
                  mode: pendingDelete.modeLabel,
                  roster: pendingDelete.playerNames.join(", "),
                })
              : ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>{t("cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (!pendingDelete) return;
              const key = pendingDelete.key;
              setExcludeMatchKeys((prev) => new Set(prev).add(key));
              setPendingDelete(null);
            }}
          >
            {t("mergeDeleteMatch")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cleanOpen && plan != null}
        onClose={() => setCleanOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{t("mergeCleanTitle")}</DialogTitle>
        <DialogContent dividers>
          {plan ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {t("mergeCleanHint")}
              </Typography>

              <SubBlock title={t("mergePlayersAdded")}>
                {plan.playersAdded.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                ) : (
                  plan.playersAdded.map((p) => (
                    <Typography
                      key={`${p.datasetId}:${p.playerId}`}
                      variant="body2"
                      sx={{ fontFamily: MONO, fontSize: 12 }}
                    >
                      {p.name} · {p.publicId}{" "}
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        ({p.datasetName})
                      </Typography>
                    </Typography>
                  ))
                )}
              </SubBlock>

              <SubBlock title={t("mergePlayersUnchanged")}>
                {plan.playersUnchanged.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                ) : (
                  plan.playersUnchanged.map((p) => (
                    <Typography
                      key={p.publicId}
                      variant="body2"
                      sx={{ fontFamily: MONO, fontSize: 12 }}
                    >
                      {p.name} · {p.publicId}{" "}
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        ({p.sourceNames.join(", ")})
                      </Typography>
                    </Typography>
                  ))
                )}
              </SubBlock>

              <SubBlock title={t("mergeMatchesAdded")}>
                {plan.matchesAdded.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                ) : (
                  plan.matchesAdded.map((m) => (
                    <MatchAuditRow
                      key={m.key}
                      candidate={m}
                      source={bySource.get(m.datasetId)}
                      fmt={fmt}
                      open={detailOpenKeys.has(`clean-add:${m.key}`)}
                      onToggle={() => toggleDetailKey(`clean-add:${m.key}`)}
                    />
                  ))
                )}
              </SubBlock>

              <SubBlock title={t("mergeMatchesDuplicates")}>
                {plan.matchesSkippedDuplicates.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                ) : (
                  plan.matchesSkippedDuplicates.map((g) => (
                    <Box key={g.fingerprint}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        {t("mergeKeptFrom", { name: g.keep.datasetName })}
                        {g.skipped.length > 0
                          ? ` · ${t("mergeSkippedFrom", {
                              name: g.skipped
                                .map((s) => s.datasetName)
                                .join(", "),
                            })}`
                          : ""}
                      </Typography>
                      <MatchAuditRow
                        candidate={g.keep}
                        source={bySource.get(g.keep.datasetId)}
                        fmt={fmt}
                        open={detailOpenKeys.has(`clean-dup:${g.keep.key}`)}
                        onToggle={() =>
                          toggleDetailKey(`clean-dup:${g.keep.key}`)
                        }
                      />
                      {g.skipped.map((s) => (
                        <MatchAuditRow
                          key={s.key}
                          candidate={s}
                          source={bySource.get(s.datasetId)}
                          fmt={fmt}
                          open={detailOpenKeys.has(`clean-skip:${s.key}`)}
                          onToggle={() =>
                            toggleDetailKey(`clean-skip:${s.key}`)
                          }
                          dimmed
                        />
                      ))}
                    </Box>
                  ))
                )}
              </SubBlock>

              <SubBlock title={t("mergeIdCollisionsSection")}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.75 }}
                >
                  {t("mergeIdCollisionsHint")}
                </Typography>
                {plan.matchIdCollisionsIgnored.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                ) : (
                  plan.matchIdCollisionsIgnored.map((group) => (
                    <Box key={group.publicId} sx={{ mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: MONO, fontSize: 12, mb: 0.5 }}
                      >
                        public_id: {group.publicId}
                      </Typography>
                      {group.candidates.map((m) => (
                        <MatchAuditRow
                          key={m.key}
                          candidate={m}
                          source={bySource.get(m.datasetId)}
                          fmt={fmt}
                          open={detailOpenKeys.has(`clean-id:${m.key}`)}
                          onToggle={() =>
                            toggleDetailKey(`clean-id:${m.key}`)
                          }
                        />
                      ))}
                    </Box>
                  ))
                )}
              </SubBlock>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanOpen(false)}>{t("done")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
      <Stack spacing={1.25}>{children}</Stack>
    </Box>
  );
}

function SubBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600 }}
      >
        {title}
      </Typography>
      <Stack spacing={0.25} sx={{ mt: 0.5 }}>
        {children}
      </Stack>
    </Box>
  );
}

function MatchConflictBlock({
  conflict,
  bySource,
  fmt,
  open,
  onToggleGames,
  selectedKey,
  resolved,
  onAccept,
}: {
  conflict: MatchContentConflict;
  bySource: Map<string, MergeSource>;
  fmt: (iso: string) => string;
  open: boolean;
  onToggleGames: () => void;
  selectedKey: string;
  resolved: boolean;
  onAccept: (key: string) => void;
}) {
  const { t } = useTranslation();
  const sides: ConflictSide[] = conflict.candidates.map((cand, index) => {
    const detail = bySource.get(cand.datasetId)
      ? getMatchDetail(bySource.get(cand.datasetId)!.data, cand.matchId)
      : null;
    const isFreeForAll = cand.modeLabel === "Free For All";
    const teamNumbers = activeTeamNumbers(
      cand.playersAmount,
      isFreeForAll
    ) as number[];
    const wins = detail ? tallyWins(detail.games, teamNumbers) : [];
    const score =
      wins.length > 0
        ? wins.map((w: { teamNumber: number; wins: number }) => w.wins).join("–")
        : null;
    const gameCount = detail?.games.length ?? 0;
    return {
      key: `pick:${cand.key}`,
      label: index === 0 ? t("mergeGitCurrent") : t("mergeGitIncoming"),
      sourceName: cand.datasetName,
      lines: [
        `when: ${fmt(cand.endedAt)}`,
        `mode: ${cand.modeLabel}${gameCount > 0 ? ` · ${gameCount} games` : ""}`,
        score ? `result: ${score}` : `max_points: ${cand.maxPoints}`,
        `public_id: ${cand.publicId}`,
        `roster: ${cand.playerNames.join(", ")}`,
        `seat ids: ${cand.seatPublicIds.join(", ")}`,
        `source: ${cand.datasetName}`,
      ],
    };
  });

  return (
    <GitConflictBlock
      path={`matches/${fmt(conflict.endedAt)}`}
      subtitle={t("mergeConflictMatchSoftKeyHint")}
      sides={sides}
      selectedKey={selectedKey}
      resolved={resolved}
      bothKey="keep_both"
      bothLabel={t("mergeKeepBothMatches")}
      onAccept={onAccept}
      extra={
        <Box sx={{ px: 1.25, pb: 1.25 }}>
          <Button
            size="small"
            variant="text"
            onClick={onToggleGames}
            sx={{ textTransform: "none", mb: open ? 1 : 0 }}
          >
            {open ? t("mergeHideGames") : t("mergeViewGames")}
          </Button>
          <Collapse in={open}>
            <Stack
              spacing={1.25}
              direction={{ xs: "column", md: "row" }}
              alignItems="stretch"
            >
              {conflict.candidates.map((cand, index) => (
                <MatchGamesCard
                  key={cand.key}
                  candidate={cand}
                  source={bySource.get(cand.datasetId)}
                  fmt={fmt}
                  label={
                    index === 0
                      ? t("mergeGitCurrent")
                      : t("mergeGitIncoming")
                  }
                  accent={index === 0 ? GIT_OURS : GIT_THEIRS}
                />
              ))}
            </Stack>
          </Collapse>
        </Box>
      }
    />
  );
}

function teamDatasForGame(
  game: HistoryGame,
  playersAmount: number
): number[][] {
  const teams = [
    game.t1Datas,
    game.t2Datas,
    game.t3Datas,
    game.t4Datas,
  ].slice(0, playersAmount <= 2 ? 2 : playersAmount);
  return teams;
}

function MatchGamesCard({
  candidate,
  source,
  fmt,
  label,
  accent,
  compact,
}: {
  candidate: MatchCandidate;
  source: MergeSource | undefined;
  fmt: (iso: string) => string;
  label?: string;
  accent?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const detail = source
    ? getMatchDetail(source.data, candidate.matchId)
    : null;
  const border = accent ?? "divider";
  const teamLabels = detail ? teamLabelsForDetail(detail) : {};

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.25,
        borderRadius: 1,
        border: "1px solid",
        borderColor:
          typeof border === "string" && border !== "divider"
            ? alpha(border, 0.4)
            : "divider",
        backgroundColor:
          typeof accent === "string" ? alpha(accent, 0.04) : "transparent",
        opacity: compact ? 0.95 : 1,
      }}
    >
      {label ? (
        <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.75 }}>
          {label} · {candidate.datasetName}
        </Typography>
      ) : null}

      <Stack spacing={0.25} sx={{ mb: 1, fontFamily: MONO, fontSize: 11 }}>
        <Typography variant="caption" component="div">
          {t("mergeMatchMetaWhen", { value: fmt(candidate.endedAt) })}
        </Typography>
        <Typography variant="caption" component="div">
          {t("mergeMatchMetaMode", { value: candidate.modeLabel })}
        </Typography>
        <Typography variant="caption" component="div">
          {t("mergeMatchMetaMax", { value: candidate.maxPoints })}
        </Typography>
        <Typography variant="caption" component="div">
          {t("mergeMatchMetaId", { value: candidate.publicId })}
        </Typography>
        <Typography variant="caption" component="div">
          {t("mergeMatchMetaRoster", {
            value: candidate.playerNames.join(", "),
          })}
        </Typography>
        <Typography variant="caption" component="div">
          {t("mergeMatchMetaSeats", {
            value: candidate.seatPublicIds.join(", "),
          })}
        </Typography>
        <Typography variant="caption" component="div">
          {t("mergeMatchMetaSource", { value: candidate.datasetName })}
        </Typography>
      </Stack>

      {!detail ? (
        <Typography variant="caption" color="text.secondary">
          {t("mergeGamesMissing")}
        </Typography>
      ) : detail.games.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          —
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {detail.games.map((game, index) => {
            const teamCount =
              detail.playersAmount <= 2 ? 2 : detail.playersAmount;
            const totals = [
              game.t1TotalPoints,
              game.t2TotalPoints,
              game.t3TotalPoints,
              game.t4TotalPoints,
            ].slice(0, teamCount);
            const scores = totals
              .map((pts, i) => {
                const labelText = teamLabels[i + 1] ?? `T${i + 1}`;
                return `${labelText} ${pts}`;
              })
              .join(" – ");
            const hands = teamDatasForGame(game, detail.playersAmount)
              .map((datas, i) => {
                const labelText = teamLabels[i + 1] ?? `T${i + 1}`;
                return `${labelText}[${datas.join(",")}]`;
              })
              .join(" ");
            return (
              <Box key={index}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: MONO, fontSize: 12 }}
                >
                  {t("mergeGameLine", {
                    n: index + 1,
                    winner: game.winner,
                    scores,
                  })}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontFamily: MONO,
                    fontSize: 11,
                    display: "block",
                    wordBreak: "break-all",
                  }}
                >
                  {t("mergeGameHands", { hands })}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function teamPaletteKey(teamNumber: number): string {
  return (TEAM_KEYS as Record<number, string>)[teamNumber] ?? "team1";
}

function TeamColoredRoster({
  playersAmount,
  modeLabel,
  playerNames,
}: {
  playersAmount: number;
  modeLabel: string;
  playerNames: string[];
}) {
  const teams = teamsFromRoster(playersAmount, modeLabel, playerNames) as {
    number: number;
    members: { name: string }[];
  }[];

  return (
    <Typography
      variant="body2"
      component="div"
      sx={{
        lineHeight: 1.35,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        columnGap: 0.5,
        rowGap: 0.15,
      }}
    >
      {teams.map((team, index) => {
        const names = team.members
          .map((m) => m.name)
          .filter(Boolean)
          .join(" · ");
        if (!names) return null;
        const key = teamPaletteKey(team.number);
        return (
          <Fragment key={team.number}>
            {index > 0 ? (
              <Box
                component="span"
                sx={{ color: "text.disabled", fontWeight: 600, px: 0.15 }}
              >
                –
              </Box>
            ) : null}
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: (theme) => (theme.palette as any)[key].dark,
              }}
            >
              {names}
            </Box>
          </Fragment>
        );
      })}
    </Typography>
  );
}

function CompactWinScoreline({
  wins,
}: {
  wins: { teamNumber: number; wins: number }[];
}) {
  if (wins.length === 0) return null;
  return (
    <Typography
      component="div"
      sx={{
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        fontSize: 14,
        lineHeight: 1.2,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0.35,
      }}
      aria-label={wins.map((w) => w.wins).join("–")}
    >
      {wins.map((row, index) => {
        const key = teamPaletteKey(row.teamNumber);
        return (
          <Fragment key={row.teamNumber}>
            {index > 0 ? (
              <Box component="span" sx={{ color: "text.disabled" }}>
                –
              </Box>
            ) : null}
            <Box
              component="span"
              sx={{ color: (theme) => (theme.palette as any)[key].main }}
            >
              {row.wins}
            </Box>
          </Fragment>
        );
      })}
    </Typography>
  );
}

function MatchAuditRow({
  candidate,
  source,
  fmt,
  open,
  onToggle,
  actions,
  dimmed,
}: {
  candidate: MatchCandidate;
  source: MergeSource | undefined;
  fmt: (iso: string) => string;
  open: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  dimmed?: boolean;
}) {
  const { t, modeName } = useTranslation();
  const detail = source
    ? getMatchDetail(source.data, candidate.matchId)
    : null;
  const isFreeForAll = candidate.modeLabel === "Free For All";
  const teamNumbers = activeTeamNumbers(
    candidate.playersAmount,
    isFreeForAll
  ) as number[];
  const wins = detail ? tallyWins(detail.games, teamNumbers) : [];
  const gameCount = detail?.games.length ?? 0;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        px: 1.25,
        py: 0.85,
        opacity: dimmed ? 0.7 : 1,
        backgroundColor: (theme) =>
          alpha(theme.palette.background.paper, dimmed ? 0.5 : 0.95),
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={1}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 0.2 }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fmt(candidate.endedAt)}
              <Box
                component="span"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                {" "}
                · {modeName(candidate.modeLabel)}
                {gameCount > 0
                  ? ` · ${t("historyGames", { n: gameCount })}`
                  : ""}
              </Box>
            </Typography>
            <CompactWinScoreline wins={wins} />
          </Stack>

          <TeamColoredRoster
            playersAmount={candidate.playersAmount}
            modeLabel={candidate.modeLabel}
            playerNames={candidate.playerNames}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontFamily: MONO,
              fontSize: 11,
              display: "block",
              mt: 0.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {candidate.publicId} · {candidate.datasetName}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={0.25}
          alignItems="center"
          sx={{ flexShrink: 0, mt: -0.25 }}
        >
          <Button
            size="small"
            variant="text"
            onClick={onToggle}
            sx={{ textTransform: "none", minWidth: 0, px: 0.75 }}
          >
            {open ? t("mergeCollapseDetails") : t("mergeExpandDetails")}
          </Button>
          {actions}
        </Stack>
      </Stack>
      <Collapse in={open}>
        <Box sx={{ mt: 0.85 }}>
          <MatchGamesCard
            candidate={candidate}
            source={source}
            fmt={fmt}
            compact
          />
        </Box>
      </Collapse>
    </Box>
  );
}

/** Git-style conflict hunk: markers + Accept Current / Incoming / Both. */
function GitConflictBlock({
  path,
  subtitle,
  sides,
  selectedKey,
  resolved,
  bothKey,
  bothLabel,
  onAccept,
  extra,
}: {
  path: string;
  subtitle: string;
  sides: ConflictSide[];
  selectedKey: string;
  resolved: boolean;
  bothKey?: string;
  bothLabel?: string;
  onAccept: (key: string) => void;
  extra?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: resolved ? alpha(GIT_OURS, 0.45) : alpha(GIT_THEIRS, 0.45),
        borderRadius: 1,
        overflow: "hidden",
        backgroundColor: (theme) =>
          alpha(theme.palette.background.paper, 0.9),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{
          px: 1.25,
          py: 0.75,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.08),
        }}
      >
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 600,
            wordBreak: "break-all",
          }}
        >
          {path}
        </Typography>
        <Chip
          size="small"
          icon={
            resolved ? (
              <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
            ) : (
              <ErrorOutlineIcon sx={{ fontSize: 16 }} />
            )
          }
          label={resolved ? t("mergeGitResolved") : t("mergeGitUnresolved")}
          color={resolved ? "success" : "error"}
          variant="outlined"
          sx={{ fontFamily: MONO, fontSize: 11, height: 24 }}
        />
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", px: 1.25, pt: 1 }}
      >
        {subtitle}
      </Typography>

      <Box
        sx={{
          mx: 1.25,
          my: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
          fontFamily: MONO,
          fontSize: 12,
          lineHeight: 1.55,
        }}
      >
        {sides.map((side, index) => (
          <Box key={side.key}>
            {index === 0 ? (
              <MarkerRow
                color={GIT_OURS}
                text={`<<<<<<< ${side.label} (${side.sourceName})`}
              />
            ) : (
              <MarkerRow color={GIT_SEP} text="=======" />
            )}
            <Box
              sx={{
                px: 1.25,
                py: 0.75,
                backgroundColor: alpha(
                  index === 0 ? GIT_OURS : GIT_THEIRS,
                  selectedKey === side.key ? 0.14 : 0.05
                ),
                outline:
                  selectedKey === side.key
                    ? `2px solid ${index === 0 ? GIT_OURS : GIT_THEIRS}`
                    : "none",
                outlineOffset: -2,
              }}
            >
              {side.lines.map((line) => (
                <Box key={line} component="div">
                  {line}
                </Box>
              ))}
            </Box>
            {index === sides.length - 1 ? (
              <MarkerRow
                color={GIT_THEIRS}
                text={`>>>>>>> ${side.label} (${side.sourceName})`}
              />
            ) : null}
          </Box>
        ))}
      </Box>

      <Stack
        direction="row"
        flexWrap="wrap"
        useFlexGap
        spacing={1}
        sx={{ px: 1.25, pb: extra ? 0.5 : 1.25 }}
      >
        {sides.map((side, index) => (
          <Button
            key={side.key}
            size="small"
            variant={selectedKey === side.key ? "contained" : "outlined"}
            color={index === 0 ? "success" : "error"}
            onClick={() => onAccept(side.key)}
            sx={{ textTransform: "none", fontFamily: MONO, fontSize: 12 }}
          >
            {index === 0
              ? t("mergeGitAcceptCurrent")
              : t("mergeGitAcceptIncoming")}
            {sides.length > 2 ? ` (${side.sourceName})` : ""}
          </Button>
        ))}
        {bothKey && bothLabel ? (
          <Button
            size="small"
            variant={selectedKey === bothKey ? "contained" : "outlined"}
            color="warning"
            onClick={() => onAccept(bothKey)}
            sx={{ textTransform: "none", fontFamily: MONO, fontSize: 12 }}
          >
            {bothLabel}
          </Button>
        ) : null}
      </Stack>
      {extra}
    </Box>
  );
}

function MarkerRow({ color, text }: { color: string; text: string }) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.35,
        color,
        fontWeight: 700,
        backgroundColor: alpha(color, 0.08),
        borderTop: "1px solid",
        borderBottom: "1px solid",
        borderColor: alpha(color, 0.25),
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {text}
    </Box>
  );
}
