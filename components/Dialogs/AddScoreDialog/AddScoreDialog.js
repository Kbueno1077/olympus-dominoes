"use client";

import useToast from "@/hooks/useToast";
import { useTranslation } from "@/i18n/useTranslation";
import { FONT_HAND } from "@/muiTheme/typography";
import { Button, TextField, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { alpha } from "@mui/material/styles";
import * as React from "react";

export default function AddScoreDialog({
  addScore,
  teamNumber,
  teamKey = "team1",
  teamLabel,
}) {
  const [open, setOpen] = React.useState(false);
  const [score, setScore] = React.useState("");
  const inputRef = React.useRef(null);
  const displayToast = useToast();
  const { t, teamName } = useTranslation();
  const label = teamLabel || teamName(teamNumber);

  const focusAndSelect = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  };

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
        disableRipple
        onClick={handleClickOpen}
        aria-label={t("addPointsTitle", { team: label })}
        sx={{
          minHeight: 30,
          minWidth: 0,
          py: 0.4,
          borderRadius: 0,
          borderBottom: "1px dashed",
          borderColor: "divider",
          color: (theme) => alpha(theme.palette[teamKey].main, 0.72),
          fontFamily: FONT_HAND,
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: 0,
          "&:hover": {
            backgroundColor: (theme) =>
              alpha(theme.palette[teamKey].main, 0.06),
            borderBottom: "1px dashed",
            borderColor: (theme) => theme.palette[teamKey].main,
            color: (theme) => theme.palette[teamKey].dark,
          },
        }}
      >
        +
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        aria-labelledby="add-score-title"
        TransitionProps={{ onEntered: focusAndSelect }}
      >
        <DialogTitle id="add-score-title" sx={{ pb: 0.5 }}>
          {t("addPointsTitle", { team: label })}
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary", mb: 1.5 }}
          >
            {t("addPointsBody")}
          </Typography>
          <TextField
            inputRef={inputRef}
            fullWidth
            variant="standard"
            value={score}
            onChange={(e) =>
              setScore(e.target.value.replace(/[^\d]/g, ""))
            }
            onFocus={(e) => e.target.select()}
            onKeyDown={handleKeyDown}
            type="text"
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              "aria-label": t("points"),
            }}
            sx={{
              "& .MuiInputBase-input": {
                fontFamily: FONT_HAND,
                fontSize: 36,
                fontWeight: 600,
                textAlign: "center",
                py: 0.75,
              },
            }}
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
