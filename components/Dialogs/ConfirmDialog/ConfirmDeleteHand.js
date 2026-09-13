"use client";

import { useTranslation } from "@/i18n/useTranslation";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { alpha } from "@mui/material/styles";
import * as React from "react";

export default function ConfirmDeleteHand({
  onCofirm,
  summary,
  scored,
  children,
}) {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    onCofirm();
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Button
        fullWidth
        color="inherit"
        variant="text"
        onClick={() => setOpen(true)}
        aria-label={t("deleteHandAria", { points: scored })}
        sx={{
          display: "block",
          minWidth: 0,
          minHeight: 0,
          py: 0,
          px: 0,
          borderRadius: 0,
          color: "inherit",
          "&:hover": {
            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
          },
        }}
      >
        {children}
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
