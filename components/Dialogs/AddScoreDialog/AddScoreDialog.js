"use client";

import useToast from "@/hooks/useToast";
import { useTranslation } from "@/i18n/useTranslation";
import AddIcon from "@mui/icons-material/Add";
import { TextField } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { alpha } from "@mui/material/styles";
import * as React from "react";

export default function AddScoreDialog({
  addScore,
  teamNumber,
  disabled,
  teamKey = "team1",
  teamLabel,
}) {
  const [open, setOpen] = React.useState(false);
  const [score, setScore] = React.useState("");
  const displayToast = useToast();
  const { t, teamName } = useTranslation();
  const label = teamLabel || teamName(teamNumber);

  const handleClickOpen = () => {
    setScore("");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleAddScore = () => {
    if (score === "" || Number(score) === 0 || Number.isNaN(Number(score))) {
      displayToast(t("toastEnterPoints"), "error");
      return;
    }
    addScore(score, teamNumber);
    setOpen(false);
  };

  // Enter should submit: scoring is repetitive and the keyboard is already up.
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddScore();
    }
  };

  return (
    <React.Fragment>
      <Button
        fullWidth
        size="medium"
        onClick={handleClickOpen}
        variant="outlined"
        disabled={disabled}
        startIcon={<AddIcon sx={{ fontSize: 20 }} />}
        sx={{
          minHeight: 44,
          py: 1.25,
          color: (theme) => theme.palette[teamKey].dark,
          borderColor: (theme) => alpha(theme.palette[teamKey].main, 0.4),
          "&:hover": {
            borderColor: (theme) => theme.palette[teamKey].main,
            backgroundColor: (theme) =>
              alpha(theme.palette[teamKey].main, 0.07),
          },
        }}
      >
        {t("add")}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        aria-labelledby="add-score-title"
      >
        <DialogTitle id="add-score-title">
          {t("addPointsTitle", { team: label })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: 14 }}>
            {t("addPointsBody")}
          </DialogContentText>
          <TextField
            autoFocus
            label={t("points")}
            fullWidth
            value={score}
            onChange={(e) => setScore(e.target.value)}
            onKeyDown={handleKeyDown}
            type="number"
            InputLabelProps={{ shrink: true }}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            {t("cancel")}
          </Button>
          <Button onClick={handleAddScore} variant="contained">
            {t("addPoints")}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
