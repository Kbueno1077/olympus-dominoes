"use client";

import DashboardAside from "@/modules/Analytics/DashboardAside";
import DashboardEmptyState from "@/modules/Analytics/DashboardEmptyState";
import {
  DashboardPanel,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import StatsDataDrawer from "@/modules/Analytics/StatsDataDrawer";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  buildPodium,
  type PodiumCategoryId,
  type PodiumCategoryResult,
  type PodiumKind,
} from "@/lib/analytics/podium";
import { listLeaderboard, listStatModes } from "@/lib/analytics/selectors";
import { useTranslation } from "@/i18n/useTranslation";
import { usePodiumPunchlines } from "@/hooks/usePodiumPunchlines";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";

const SECTION_ORDER: PodiumKind[] = ["glory", "grind", "shame"];

function categoryTitleKey(id: PodiumCategoryId): string {
  const map: Record<PodiumCategoryId, string> = {
    jose: "podiumJoseTitle",
    datas: "podiumDatasTitle",
    points: "podiumPointsTitle",
    pph: "podiumPphTitle",
    pollos: "podiumPollosTitle",
    polloRate: "podiumPolloRateTitle",
    zapatos: "podiumZapatosTitle",
    zapatoRate: "podiumZapatoRateTitle",
    games: "podiumGamesTitle",
    hands: "podiumHandsTitle",
    bestLoser: "podiumBestLoserTitle",
    keepsComing: "podiumKeepsComingTitle",
    pollosEaten: "podiumPollosEatenTitle",
    zapatosEaten: "podiumZapatosEatenTitle",
  };
  return map[id];
}

function sectionTitleKey(kind: PodiumKind): string {
  switch (kind) {
    case "glory":
      return "podiumSectionGlory";
    case "grind":
      return "podiumSectionGrind";
    case "shame":
      return "podiumSectionShame";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function PlaceRow({
  label,
  place,
  emphasize,
  muted,
}: {
  label: string;
  place: PodiumCategoryResult["winner"];
  emphasize?: boolean;
  muted?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="baseline"
      spacing={1.5}
      sx={{ py: 0.55 }}
    >
      <Stack direction="row" spacing={1} alignItems="baseline" sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: muted ? "text.disabled" : "text.secondary",
            fontWeight: 600,
            width: 28,
            flexShrink: 0,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontWeight: emphasize ? 700 : 500,
            color: muted ? "text.secondary" : "text.primary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {place?.playerName ?? t("podiumNoPlace")}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontWeight: emphasize ? 700 : 600,
          fontVariantNumeric: "tabular-nums",
          color: muted ? "text.secondary" : "text.primary",
          flexShrink: 0,
        }}
      >
        {place?.display ?? t("podiumNoPlace")}
      </Typography>
    </Stack>
  );
}

function TrophyCard({
  category,
  punchlineKey,
}: {
  category: PodiumCategoryResult;
  punchlineKey: (id: PodiumCategoryId) => string;
}) {
  const { t } = useTranslation();
  const shame = category.kind === "shame";
  const grind = category.kind === "grind";

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: shame
          ? (theme) => alpha(theme.palette.error.main, 0.28)
          : "divider",
        backgroundColor: shame
          ? (theme) => alpha(theme.palette.error.main, 0.04)
          : grind
            ? (theme) => alpha(theme.palette.grey[700], 0.03)
            : (theme) => alpha(theme.palette.primary.main, 0.04),
        px: 1.75,
        py: 1.5,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
        <EmojiEventsOutlinedIcon
          sx={{
            fontSize: 18,
            mt: 0.2,
            color: shame
              ? "text.disabled"
              : grind
                ? "text.secondary"
                : "primary.main",
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1.3,
              color: shame ? "text.secondary" : "text.primary",
            }}
          >
            {t(categoryTitleKey(category.id))}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: 0.25 }}
          >
            {t(punchlineKey(category.id))}
          </Typography>
        </Box>
      </Stack>
      <PlaceRow
        label={t("podiumFirst")}
        place={category.winner}
        emphasize
        muted={shame}
      />
      <PlaceRow
        label={t("podiumSecond")}
        place={category.runnerUp}
        muted
      />
    </Box>
  );
}

export default function Podium() {
  const { t, modeName } = useTranslation();
  const { data, error, loading, activeDataset } = useAnalytics();
  const { ready: punchlinesReady, punchlineKey } = usePodiumPunchlines();
  const [modeLabel, setModeLabel] = useState<string | null>(null);
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);

  const modes = useMemo(() => (data ? listStatModes(data) : []), [data]);

  const activeMode = useMemo(() => {
    if (modeLabel && modes.includes(modeLabel)) return modeLabel;
    return modes[0] ?? null;
  }, [modeLabel, modes]);

  const podium = useMemo(() => {
    if (!data || !activeMode) return [];
    return buildPodium(listLeaderboard(data, activeMode));
  }, [data, activeMode]);

  const byKind = useMemo(() => {
    const map: Record<PodiumKind, PodiumCategoryResult[]> = {
      glory: [],
      grind: [],
      shame: [],
    };
    for (const cat of podium) {
      map[cat.kind].push(cat);
    }
    return map;
  }, [podium]);

  const errorMessage = (() => {
    const code = error;
    if (!code) return null;
    if (code.startsWith("unknown_table:")) return t("analyticsErrorUnknownTable");
    if (code === "empty_export") return t("analyticsErrorEmpty");
    if (code === "unknown_format") return t("analyticsErrorFormat");
    if (code === "sql_unsupported") return t("analyticsErrorSqlUnsupported");
    if (code === "schema_too_new") return t("analyticsErrorSchemaTooNew");
    if (code === "schema_too_old") return t("analyticsErrorSchemaTooOld");
    return t("analyticsErrorGeneric");
  })();

  if (loading || !punchlinesReady) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <DashboardEmptyState page="podium" errorMessage={errorMessage} />
    );
  }

  const datasetLabel = activeDataset?.displayName || data.fileName;

  return (
    <Box sx={dashboardShellSx}>
      <DashboardAside
        title={t("podiumTitle")}
        subtitle={t("podiumSubtitle")}
        filtersLabel={t("format")}
        toolbar={
          <Chip
            size="small"
            icon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
            label={t("statsManageData")}
            onClick={() => setDataDrawerOpen(true)}
            variant="outlined"
            clickable
          />
        }
      >
        {modes.length > 0 ? (
          <Box sx={{ px: 2, pb: 1.5 }}>
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
              value={activeMode}
              onChange={(_, value) => {
                if (value) setModeLabel(value);
              }}
              sx={{ flexWrap: "wrap" }}
            >
              {modes.map((mode) => (
                <ToggleButton key={mode} value={mode} sx={{ flex: "1 1 auto" }}>
                  {modeName(mode)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        ) : null}
      </DashboardAside>

      <Box component="main" sx={dashboardMainSx}>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 1.5 }}
        >
          {t("dashboardViewingDataset", { name: datasetLabel })}
        </Typography>

        {modes.length === 0 || podium.every((c) => !c.winner) ? (
          <DashboardPanel title={t("podiumTitle")}>
            <Typography sx={{ color: "text.secondary" }}>
              {t("podiumEmpty")}
            </Typography>
          </DashboardPanel>
        ) : (
          <Stack spacing={3}>
            {SECTION_ORDER.map((kind) => {
              const cats = byKind[kind];
              if (cats.length === 0) return null;
              return (
                <Box key={kind}>
                  <Typography
                    variant="overline"
                    sx={{
                      color:
                        kind === "shame" ? "text.disabled" : "text.secondary",
                      display: "block",
                      mb: 1.25,
                    }}
                  >
                    {t(sectionTitleKey(kind))}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.5,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                        lg: "1fr 1fr 1fr",
                      },
                    }}
                  >
                    {cats.map((category) => (
                      <TrophyCard
                        key={category.id}
                        category={category}
                        punchlineKey={punchlineKey}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
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
