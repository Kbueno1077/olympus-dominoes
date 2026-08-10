"use client";

import { pressableSx, tapFeedback } from "@/modules/Play/pressFeedback";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

type Props = {
  open: boolean;
  onChooseYou: () => void;
  onChoosePartner: () => void;
};

/**
 * 2v2: when your team owns the open, pick You vs Partner.
 * Hand stays visible behind the dialog backdrop.
 */
export default function PlayOpenerDialog({
  open,
  onChooseYou,
  onChoosePartner,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={() => {
        /* must pick You or Partner */
      }}
      disableEscapeKeyDown
      aria-labelledby="play-opener-title"
      aria-describedby="play-opener-desc"
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle id="play-opener-title">{t("playChooseOpenerTitle")}</DialogTitle>
      <DialogContent>
        <Typography id="play-opener-desc" variant="body2" color="text.secondary">
          {t("playChooseOpenerBody")}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: "100%" }}
        >
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onPointerDown={tapFeedback}
            onClick={onChooseYou}
            sx={pressableSx}
          >
            {t("playChooseOpenerYou")}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onPointerDown={tapFeedback}
            onClick={onChoosePartner}
            sx={pressableSx}
          >
            {t("playChooseOpenerPartner")}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
