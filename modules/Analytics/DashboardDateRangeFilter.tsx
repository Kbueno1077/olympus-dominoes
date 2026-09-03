"use client";

import { useTranslation } from "@/i18n/useTranslation";
import {
  formatYmd,
  localDateToYmd,
  ymdToLocalDate,
} from "@/lib/analytics/dateRangeFilter";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { DayPicker, type DateRange as DayPickerRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";

type Props = {
  startDate: string | null;
  endDate: string | null;
  onStartChange: (value: string | null) => void;
  onEndChange: (value: string | null) => void;
  onClear: () => void;
};

function toPickerRange(
  startDate: string | null,
  endDate: string | null
): DayPickerRange | undefined {
  const from = startDate ? ymdToLocalDate(startDate) : undefined;
  const to = endDate ? ymdToLocalDate(endDate) : undefined;
  if (!from && !to) return undefined;
  return { from: from ?? undefined, to: to ?? undefined };
}

function rangeButtonLabel(
  t: (key: string, values?: Record<string, string>) => string,
  language: string,
  startDate: string | null,
  endDate: string | null
): string {
  if (startDate && endDate && startDate === endDate) {
    return formatYmd(language, startDate);
  }
  if (startDate && endDate) {
    return t("dashboardDateBetween", {
      start: formatYmd(language, startDate),
      end: formatYmd(language, endDate),
    });
  }
  if (startDate) {
    return t("dashboardDateFrom", { date: formatYmd(language, startDate) });
  }
  if (endDate) {
    return t("dashboardDateUntil", { date: formatYmd(language, endDate) });
  }
  return t("dashboardDatePick");
}

export default function DashboardDateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
}: Props) {
  const { t, language } = useTranslation();
  const theme = useTheme();
  const twoMonths = useMediaQuery(theme.breakpoints.up("sm"), {
    defaultMatches: false,
    noSsr: true,
  });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayPickerRange | undefined>(undefined);
  const active = Boolean(startDate || endDate);
  const label = rangeButtonLabel(t, language, startDate, endDate);

  useEffect(() => {
    if (!open) return;
    setDraft(toPickerRange(startDate, endDate));
  }, [open, startDate, endDate]);

  const applyDraft = () => {
    const from = draft?.from ?? null;
    const to = draft?.to ?? from;
    onStartChange(from ? localDateToYmd(from) : null);
    onEndChange(to ? localDateToYmd(to) : null);
    setOpen(false);
  };

  const clearAndClose = () => {
    setDraft(undefined);
    onClear();
    setOpen(false);
  };

  return (
    <>
      <Stack direction="row" spacing={0.75} alignItems="stretch">
        <Button
          fullWidth
          variant={active ? "contained" : "outlined"}
          color={active ? "primary" : "inherit"}
          startIcon={<CalendarMonthOutlined />}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          sx={{
            textTransform: "none",
            justifyContent: "flex-start",
            fontWeight: active ? 700 : 600,
            minHeight: 40,
            px: 1.25,
            borderColor: "divider",
            color: active ? undefined : "text.primary",
          }}
        >
          <Box
            component="span"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "left",
            }}
          >
            {label}
          </Box>
        </Button>
        {active ? (
          <IconButton
            onClick={onClear}
            aria-label={t("dashboardDateClear")}
            size="small"
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
            }}
          >
            <CloseOutlined fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth={twoMonths ? "md" : "xs"}
        scroll="paper"
        PaperProps={{
          sx: {
            maxHeight: "min(720px, calc(100dvh - 24px))",
          },
        }}
      >
        <DialogTitle>{t("dashboardDateRange")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            {t("dashboardDateHint")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              overflowX: "auto",
            }}
          >
            <DayPicker
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={twoMonths ? 2 : 1}
              defaultMonth={draft?.from ?? draft?.to}
              locale={language === "es" ? es : undefined}
              className="olympus-rdp"
              navLayout="around"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearAndClose} color="inherit">
            {t("dashboardDateClear")}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(false)} color="inherit">
            {t("cancel")}
          </Button>
          <Button onClick={applyDraft} variant="contained">
            {t("dashboardDateApply")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
