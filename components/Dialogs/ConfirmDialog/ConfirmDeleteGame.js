"use client";

import { useTranslation } from "@/i18n/useTranslation";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { IconButton, Tooltip } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { alpha } from "@mui/material/styles";
import * as React from "react";

export default function ConfirmDeleteGame({ onCofirm, index }) {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    onCofirm(index);
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Tooltip title={t("deleteGameTooltip")}>
        <IconButton
          onClick={() => setOpen(true)}
          size="small"
          color="default"
          aria-label={t("deleteGameAria", { n: index + 1 })}
          sx={{
            width: 34,
            height: 34,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            "&:hover": {
              borderColor: (theme) => alpha(theme.palette.error.main, 0.45),
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
              color: "error.main",
            },
          }}
        >
          <DeleteOutline fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="delete-game-title"
        aria-describedby="delete-game-description"
      >
        <DialogTitle id="delete-game-title">
          {t("deleteGameTitle", { n: index + 1 })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-game-description">
            {t("deleteGameBody")}
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
