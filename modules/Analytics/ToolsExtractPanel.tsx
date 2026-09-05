"use client";

import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { isDateRangeActive } from "@/lib/analytics/dateRangeFilter";
import { extractDataset } from "@/lib/analytics/extractDataset";
import type { PlayerRow } from "@/lib/analytics/types";
import { useTranslation } from "@/i18n/useTranslation";
import DashboardDateRangeFilter from "@/modules/Analytics/DashboardDateRangeFilter";
import ToolsNeedData from "@/modules/Analytics/ToolsNeedData";
import useToast from "@/hooks/useToast";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import {
  Box,
  Button,
  Checkbox,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function sortByName(players: PlayerRow[]) {
  return players.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export default function ToolsExtractPanel() {
  const { t } = useTranslation();
  const router = useRouter();
  const displayToast = useToast();
  const { data, activeDataset, createExtractedDataset } = useAnalytics();
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const players = useMemo(
    () => (data ? sortByName(data.players) : []),
    [data]
  );

  const dateRange = useMemo(
    () => ({ startDate, endDate }),
    [startDate, endDate]
  );

  const preview = useMemo(() => {
    if (!data) return null;
    return extractDataset(data, { dateRange, playerIds: selectedIds });
  }, [data, dateRange, selectedIds]);

  const canFilter =
    isDateRangeActive(dateRange) || selectedIds.length > 0;

  const togglePlayer = (playerId: number) => {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const create = () => {
    setBusy(true);
    setLocalError(null);
    try {
      createExtractedDataset(name, { dateRange, playerIds: selectedIds });
      displayToast(t("toastExtractCreated"), "success");
      router.push("/history");
    } catch (err) {
      const code = err instanceof Error ? err.message : "failed";
      if (code === "empty_name") setLocalError(t("datasetsEmptyName"));
      else if (code === "duplicate_name")
        setLocalError(t("datasetsDuplicateName"));
      else if (code === "extract_need_filter")
        setLocalError(t("toolsExtractNeedFilter"));
      else if (code === "extract_no_matches")
        setLocalError(t("toolsExtractNoMatches"));
      else {
        console.error(err);
        setLocalError(t("toolsExtractFailed"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("toolsExtractTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
          {t("toolsExtractHint")}
        </Typography>
        {activeDataset ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.75 }}
          >
            {t("dashboardViewingDataset", { name: activeDataset.displayName })}
          </Typography>
        ) : null}
      </Box>

      {!data ? (
        <ToolsNeedData />
      ) : (
        <>
          <Box>
            <Typography
              variant="overline"
              component="p"
              sx={{ color: "text.secondary", mb: 0.75 }}
            >
              {t("dashboardDateRange")}
            </Typography>
            <DashboardDateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              onClear={() => {
                setStartDate(null);
                setEndDate(null);
              }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              {t("toolsExtractPeople")}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {t("toolsExtractPeopleHint")}
            </Typography>
            {players.length === 0 ? (
              <Typography color="text.secondary">
                {t("datasetsPlayersEmpty")}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    sm: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(3, minmax(0, 1fr))",
                  },
                }}
              >
                {players.map((player) => {
                  const checked = selectedIds.includes(player.id);
                  return (
                    <Box
                      key={player.id}
                      component="button"
                      type="button"
                      onClick={() => togglePlayer(player.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.65,
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: (theme: Theme) =>
                          checked
                            ? alpha(theme.palette.primary.main, 0.08)
                            : alpha(theme.palette.common.white, 0.5),
                        cursor: "pointer",
                        font: "inherit",
                        color: "inherit",
                        textAlign: "left",
                      }}
                    >
                      <Checkbox size="small" checked={checked} tabIndex={-1} />
                      <Typography noWrap sx={{ fontWeight: 600 }}>
                        {player.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            {!canFilter
              ? t("toolsExtractNeedFilter")
              : preview?.ok
                ? t("toolsExtractPreview", { n: preview.keptMatchCount })
                : t("toolsExtractNoMatches")}
          </Typography>

          <TextField
            size="small"
            label={t("toolsExtractName")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={
              activeDataset
                ? t("toolsExtractDefaultName", {
                    name: activeDataset.displayName,
                  })
                : undefined
            }
            error={Boolean(localError)}
            helperText={localError || undefined}
            sx={{ maxWidth: { md: 480 } }}
          />
          <Button
            variant="contained"
            disabled={busy || !name.trim() || !canFilter || !preview?.ok}
            startIcon={<ContentCutOutlinedIcon />}
            onClick={create}
            sx={{
              alignSelf: { xs: "stretch", md: "flex-start" },
              width: { xs: "100%", md: "auto" },
              minWidth: { md: 280 },
            }}
          >
            {t("toolsExtractCreate")}
          </Button>
        </>
      )}
    </Stack>
  );
}
