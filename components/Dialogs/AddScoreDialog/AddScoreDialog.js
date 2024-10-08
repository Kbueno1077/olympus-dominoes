"use client";

import { TextField } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";
import useToast from "@/hooks/useToast";

export default function AddScoreDialog({ addScore, teamNumber, disabled }) {
    const [open, setOpen] = React.useState(false);
    const [score, setScore] = React.useState("");
    const displayToast = useToast();

    const handleClickOpen = () => {
        setScore("");
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAddScore = () => {
        if (score === "" || score === "0") {
            displayToast(
                `More than 1 Team has more or equal amount of points than the Max allowed \n
         or the input value has errors`,
                "error"
            );
            return;
        }
        addScore(score, teamNumber);
        setOpen(false);
    };

    return (
        <React.Fragment>
            <Button
                fullWidth
                onClick={handleClickOpen}
                variant="contained"
                disabled={disabled}
                color="primary"
                className="w-full border-none rounded-md "
            >
                Add Score
            </Button>

            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Add points to this team
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <div className="mt-2">
                            <TextField
                                label="Points"
                                fullWidth
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                type="number"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                inputProps={{
                                    pattern: "[0-9]*",
                                    type: "number",
                                    min: 1,
                                }}
                                variant="outlined"
                            />
                        </div>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} className="mr-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddScore}
                        autoFocus
                        variant="contained"
                        className="border-none rounded-md"
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
