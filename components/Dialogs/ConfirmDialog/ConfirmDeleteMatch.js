"use client";

import { useTranslation } from "@/i18n/useTranslation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";

export default function ConfirmDeleteMatch({ onCofirm }) {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    onCofirm();
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Button onClick={() => setOpen(true)} color="error" size="small">
        {t("endMatch")}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="end-match-title"
        aria-describedby="end-match-description"
      >
        <DialogTitle id="end-match-title">{t("endMatchTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText id="end-match-description">
            {t("endMatchBody")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            {t("keepPlaying")}
          </Button>
          <Button
            onClick={handleConfirm}
            autoFocus
            variant="contained"
            color="error"
          >
            {t("endMatch")}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
