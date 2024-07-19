import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";

export default function ConfirmDeleteHand({
    onCofirm,
    teamDatas,
    index,
    isFirst,
}) {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleConfirm = () => {
        onCofirm();
        setOpen(false);
    };

    return (
        <React.Fragment>
            {isFirst && (
                <Button
                    fullWidth
                    color="error"
                    variant="outlined"
                    onClick={handleClickOpen}
                    sx={{
                        color: "gray",
                        fontStyle: "italic",
                        textAlign: "center",
                        margin: "5px 0 5px",
                        fontWeight: "bold",
                    }}
                >
                    {`x    -    ${teamDatas[0]}`}
                </Button>
            )}

            {!isFirst && (
                <Button
                    fullWidth
                    color="error"
                    onClick={handleClickOpen}
                    variant="outlined"
                    sx={{
                        color: "gray",
                        fontStyle: "italic",
                        textAlign: "center",
                        margin: "5px 0 5px",
                        fontWeight: "bold",
                    }}
                >
                    {`${teamDatas[index]}    `}-
                    {`    ${
                        teamDatas.slice(0, index).reduce((a, b) => a + b, 0) +
                        teamDatas[index]
                    }`}
                </Button>
            )}

            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Are you sure you want to delete this Hand?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description"></DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleConfirm} autoFocus>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
