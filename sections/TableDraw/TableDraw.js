// material
import { Box, Card, Chip } from "@mui/material";

import Iconify from "../../components2/Iconify";

export default function TableDraw({
    gameMode,
    playersAmount,
    matchesDownBreakpoint,
}) {
    return (
        <>
            <Box mt={2}>
                <Card
                    sx={{
                        padding: "60px",
                    }}
                >
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            border: "1px solid black",
                            borderRadius: "5px",

                            ":after": {
                                content: '""',
                                display: "block",
                                paddingBottom: "100%",
                            },
                        }}
                    >
                        <Iconify
                            style={{
                                position: "absolute",
                                top: "32%",
                                left: "32%",
                                width: "40%",
                                height: "40%",

                                maxWidth: "150px",
                                maxHeight: "150px",
                            }}
                            icon="arcticons:dominos"
                        />

                        <Box
                            style={{
                                position: "absolute",
                                display: "flex",
                                gap: "5px",
                                alignItems: "center",
                                bottom: "15px",
                                left: "37%",
                            }}
                        >
                            {!matchesDownBreakpoint && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        width: "100px",
                                        height: "30px",
                                        border: "1px solid black",
                                    }}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
                                        (item) => (
                                            <Box
                                                key={item}
                                                sx={{
                                                    border: "1px solid black",
                                                    width: "10px",
                                                }}
                                            />
                                        )
                                    )}
                                </Box>
                            )}
                            <Chip color="team1" label={1} />
                        </Box>

                        {playersAmount > 2 && (
                            <Box
                                style={{
                                    position: "absolute",
                                    display: "flex",
                                    gap: "5px",
                                    flexDirection: "column",
                                    bottom: "37%",
                                    right: "15px",
                                }}
                            >
                                <Chip color={`team2`} label={2} />
                                {!matchesDownBreakpoint && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            width: "30px",
                                            height: "100px",
                                            border: "1px solid black",
                                        }}
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
                                            (item) => (
                                                <Box
                                                    key={item}
                                                    sx={{
                                                        border: "1px solid black",
                                                        height: "10px",
                                                    }}
                                                />
                                            )
                                        )}
                                    </Box>
                                )}
                            </Box>
                        )}

                        <Box
                            style={{
                                position: "absolute",
                                display: "flex",
                                gap: "5px",
                                alignItems: "center",
                                position: "absolute",
                                top: "15px",
                                right: "37%",
                            }}
                        >
                            <Chip
                                color={`${
                                    gameMode?.label === "2 vs 2"
                                        ? "team1"
                                        : gameMode?.label === "2 vs 1"
                                        ? "team1"
                                        : gameMode?.label === "1 vs 1"
                                        ? "team2"
                                        : "team3"
                                }`}
                                label={`${playersAmount === 2 ? "2" : "3"} `}
                            />
                            {!matchesDownBreakpoint && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        width: "100px",
                                        height: "30px",
                                        border: "1px solid black",
                                    }}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
                                        (item) => (
                                            <Box
                                                key={item}
                                                sx={{
                                                    border: "1px solid black",
                                                    width: "10px",
                                                }}
                                            />
                                        )
                                    )}
                                </Box>
                            )}
                        </Box>

                        {playersAmount > 3 && (
                            <Box
                                style={{
                                    position: "absolute",
                                    top: "37%",
                                    left: "15px",
                                    gap: "5px",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {!matchesDownBreakpoint && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            width: "30px",
                                            height: "100px",
                                            border: "1px solid black",
                                        }}
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
                                            (item) => (
                                                <Box
                                                    key={item}
                                                    sx={{
                                                        border: "1px solid black",
                                                        height: "10px",
                                                    }}
                                                />
                                            )
                                        )}
                                    </Box>
                                )}
                                <Chip
                                    color={`${
                                        gameMode?.label === "2 vs 2"
                                            ? "team2"
                                            : "team4"
                                    }`}
                                    label={4}
                                />
                            </Box>
                        )}
                    </Box>
                </Card>
            </Box>
        </>
    );
}
