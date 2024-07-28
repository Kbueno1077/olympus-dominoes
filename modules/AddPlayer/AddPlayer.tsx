"use client";

import { Box, Button, Card, Stack, TextField, Typography } from "@mui/material";
import React from "react";

function AddPlayer() {
    const [name, setName] = React.useState("");
    const [color, setColor] = React.useState("#e66465");

    const submitPlayer = () => {
        console.log("🚀 ~ AddPlayer ~ submitPlayer:", name, color);
    };

    return (
        <Card elevation={10} sx={{ width: "100%", padding: "16px" }}>
            <Typography
                color={"primary"}
                sx={{
                    fontWeight: "bold",
                    fontSize: "30px",
                    marginBottom: "16px",
                }}
            >
                Add Player
            </Typography>

            <Stack gap="24px">
                <Box>
                    <TextField
                        fullWidth
                        label="Player Name"
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </Box>
                <Box>
                    <input
                        type="color"
                        id="PlayerColor"
                        name="PlayerColor"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                    {/**@ts-ignore */}
                    <label style={{ marginLeft: "10px" }} for="PlayerColor">
                        Pick the Player Color
                    </label>
                </Box>
                <Box>
                    <Button
                        size="large"
                        fullWidth
                        variant="contained"
                        disabled={!name}
                    >
                        Add Player
                    </Button>
                </Box>{" "}
            </Stack>
        </Card>
    );
}

export default AddPlayer;
