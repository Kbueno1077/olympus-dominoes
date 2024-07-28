"use client";

import { Box, Card, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

interface AllPlayersProps {
    data: any[];
}

function AllPlayers({ data }: AllPlayersProps) {
    const [filter, setFilter] = useState("");

    const searchPlayer = (player: string) => {
        return data.filter((item) => item.name.includes(player));
    };

    return (
        <Card elevation={10} sx={{ width: "100%", padding: "16px" }}>
            <Typography
                color={"primary"}
                sx={{
                    fontWeight: "bold",
                    fontSize: "30px",
                    marginBottom: "24px",
                }}
            >
                All Players
            </Typography>

            <Box sx={{ marginBottom: "24px" }}>
                <TextField
                    fullWidth
                    label="Search Player"
                    variant="outlined"
                    onChange={(e) => setFilter(e.target.value)}
                />
            </Box>

            <Box
                sx={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginTop: "24px",
                }}
            >
                {data
                    .filter((item) => item.name.includes(filter))
                    .map((player) => (
                        <Card
                            elevation={10}
                            sx={{
                                width: "150px",
                                padding: "16px",
                                border: `2px solid ${player.color}`,
                            }}
                            key={player.name}
                        >
                            <div>
                                <Typography
                                    sx={{
                                        fontWeight: "bold",
                                        fontSize: "20px",
                                        color: player.color,
                                    }}
                                >
                                    {player.name}
                                </Typography>
                            </div>
                        </Card>
                    ))}
            </Box>
        </Card>
    );
}

export default AllPlayers;
