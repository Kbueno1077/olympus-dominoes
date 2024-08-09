"use client";

import useToast from "@/hooks/useToast";
import { createClient } from "@/utils/supabase/client";
import { Box, Button, Card, Stack, TextField, Typography } from "@mui/material";
import React from "react";

function AddPlayer() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [name, setName] = React.useState("");
    const displayToast = useToast();

    const submitPlayer = async () => {
        setIsLoading(true);
        const supabase = createClient();

        const { error, status, statusText } = await supabase
            .from("players")
            .insert({ name });

        if (status === 201) {
            console.log("🚀 ~ submitPlayer ~ statusText:", statusText);
            displayToast("Player added successfully", "success");
        }

        if (error) {
            console.log("🚀 ~ submitPlayer ~ error:", error);
            displayToast(error.message, "error");
        }

        setIsLoading(false);
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
                    <Button
                        size="large"
                        fullWidth
                        variant="contained"
                        disabled={!name}
                        onClick={submitPlayer}
                    >
                        {isLoading ? "Loading..." : "Add Player"}
                    </Button>
                </Box>{" "}
            </Stack>
        </Card>
    );
}

export default AddPlayer;
