"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { FONT_HAND } from "@/muiTheme/typography";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";

function runningTotal(teamDatas, index) {
  return (
    teamDatas.slice(0, index).reduce((a, b) => a + b, 0) + teamDatas[index]
  );
}

export default function ConfirmDeleteHand({
  onCofirm,
  teamDatas,
  index,
  isFirst,
}) {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    onCofirm();
    setOpen(false);
  };

  const scored = isFirst ? "x" : teamDatas[index];
  const total = isFirst ? teamDatas[0] : runningTotal(teamDatas, index);
  const summary = `${scored} — ${total}`;

  return (
    <React.Fragment>
      <Button
        fullWidth
        size="small"
        color="error"
        variant="outlined"
        onClick={() => setOpen(true)}
        endIcon={<DeleteOutline sx={{ fontSize: 16 }} />}
        aria-label={t("deleteHandAria", { points: scored })}
        sx={{
          my: 0.4,
          py: 0.2,
          // Matches the pencilled rows these buttons stand in for.
          fontFamily: FONT_HAND,
          fontSize: 19,
          fontWeight: 700,
        }}
      >
        {summary}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="delete-hand-title"
        aria-describedby="delete-hand-description"
      >
        <DialogTitle id="delete-hand-title">{t("deleteHandTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-hand-description">
            {t("deleteHandBody", { summary })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            {t("keepIt")}
          </Button>
          <Button
            onClick={handleConfirm}
            autoFocus
            variant="contained"
            color="error"
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
