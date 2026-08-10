"use client";

import type { GameSnapshot, MatchSnapshot } from "@/lib/play/types";
import { useTranslation } from "@/i18n/useTranslation";
import PlayLog from "@/modules/Play/PlayLog";
import PlayScorepad from "@/modules/Play/PlayScorepad";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  match: MatchSnapshot;
  game: GameSnapshot;
  botDelayMs: number;
  onBotDelay: (ms: number) => void;
  animMs: number;
  onAnimMs: (ms: number) => void;
  logOpen: boolean;
  onToggleLog: () => void;
  onNewMatch: () => void;
  onSetup: () => void;
};

/**
 * Right-side notebook: standings, pace controls, debug log.
 */
export default function PlayNotesDrawer({
  open,
  onClose,
  match,
  game,
  botDelayMs,
  onBotDelay,
  animMs,
  onAnimMs,
  logOpen,
  onToggleLog,
  onNewMatch,
  onSetup,
}: Props) {
  const { t } = useTranslation();
  const thinkMarks = useMemo(
    () => [
      { value: 200, label: t("playSpeedFast") },
      { value: 900, label: t("playSpeedNormal") },
      { value: 2000, label: t("playSpeedSlow") },
    ],
    [t]
  );
  const animMarks = useMemo(
    () => [
      { value: 200, label: t("playSpeedFast") },
      { value: 480, label: t("playSpeedNormal") },
      { value: 900, label: t("playSpeedSlow") },
    ],
    [t]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          maxWidth: "100%",
          height: "100%",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "background.paper",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
        sx={{
          flexShrink: 0,
          px: 2.5,
          pt: 2.5,
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ mb: 0.25 }}>
            {t("playNotesTitle")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("playHandN", { n: game.handIndex })} ·{" "}
            {t("playFirstTo", { n: match.maxPoints })}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label={t("playCloseScorepad")}
          sx={{ flexShrink: 0 }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          px: 2.5,
          py: 2,
          pb: { xs: 4, sm: 2.5 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <PlayScorepad match={match} compact />

        <Box>
          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
              letterSpacing: "0.1em",
              mb: 0.5,
              display: "block",
            }}
          >
            {t("playBotSpeed")}
          </Typography>
          <Slider
            value={botDelayMs}
            min={200}
            max={2000}
            step={100}
            marks={thinkMarks}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${(v / 1000).toFixed(1)}s`}
            onChange={(_e, value) => onBotDelay(value as number)}
            sx={{ color: "primary.main", mt: 0.5 }}
          />
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
              letterSpacing: "0.1em",
              mb: 0.5,
              display: "block",
            }}
          >
            {t("playAnimSpeed")}
          </Typography>
          <Slider
            value={animMs}
            min={200}
            max={900}
            step={40}
            marks={animMarks}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${(v / 1000).toFixed(2)}s`}
            onChange={(_e, value) => onAnimMs(value as number)}
            sx={{ color: "secondary.main", mt: 0.5 }}
          />
        </Box>

        <PlayLog logs={game.logs} open={logOpen} onToggle={onToggleLog} />

        <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={onNewMatch}
            fullWidth
          >
            {t("playNewMatch")}
          </Button>
          <Button variant="text" size="small" onClick={onSetup} fullWidth>
            {t("playSetupLink")}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
