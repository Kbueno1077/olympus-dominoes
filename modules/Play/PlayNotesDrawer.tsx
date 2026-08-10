"use client";

import type { MatchSnapshot } from "@/lib/play/types";
import { useTranslation } from "@/i18n/useTranslation";
import PlayScorepad from "@/modules/Play/PlayScorepad";
import { pressableSx, tapFeedback } from "@/modules/Play/pressFeedback";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  match: MatchSnapshot;
  onEndGame: () => void;
};

/**
 * Right-side notebook: match standing + games + end match.
 * Pace, debug log, nav, and language live in PlayConfigDrawer.
 */
export default function PlayNotesDrawer({
  open,
  onClose,
  match,
  onEndGame,
}: Props) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmEnd = () => {
    setConfirmOpen(false);
    onEndGame();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 400 },
            maxWidth: "100%",
            height: "100dvh",
            maxHeight: "100dvh",
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
            px: { xs: 2, sm: 2.5 },
            pt: { xs: 1.5, sm: 2.5 },
            pb: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{ mb: 0.25, fontSize: { xs: 18, sm: undefined } }}
            >
              {t("playNotesTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("gameNumber", { n: match.gameIndex })} ·{" "}
              {t("firstToPoints", { n: match.maxPoints })}
            </Typography>
          </Box>
          <IconButton
            onPointerDown={tapFeedback}
            onClick={onClose}
            aria-label={t("playCloseScorepad")}
            sx={{ ...pressableSx, flexShrink: 0 }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowX: "hidden",
            overflowY: "scroll",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
            px: { xs: 2, sm: 2.5 },
            py: 2,
            pb: { xs: "max(24px, env(safe-area-inset-bottom))", sm: 2.5 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <PlayScorepad match={match} compact />

          <Button
            variant="contained"
            color="error"
            fullWidth
            onPointerDown={tapFeedback}
            onClick={() => setConfirmOpen(true)}
            sx={{
              ...pressableSx,
              mt: "auto",
              pt: 1.1,
              pb: 1.1,
              fontWeight: 700,
            }}
          >
            {t("playEndGame")}
          </Button>
        </Box>
      </Drawer>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="play-end-game-title"
        aria-describedby="play-end-game-desc"
      >
        <DialogTitle id="play-end-game-title">
          {t("playEndGameTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="play-end-game-desc">
            {t("playEndGameBody")}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={pressableSx}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onPointerDown={tapFeedback}
            onClick={handleConfirmEnd}
            sx={pressableSx}
            autoFocus
          >
            {t("playEndGameConfirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
