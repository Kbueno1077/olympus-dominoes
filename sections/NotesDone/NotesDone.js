"use client";

import { Box, Card, Divider, Typography } from "@mui/material";
import ConfirmDeleteMatch from "../../components2/Dialogs/ConfirmDialog/ConfirmDeleteMatch";
import Note from "../../components2/Notes/Note";
import styles from "./notesDone.module.css";

export default function NotesDone({
    completedGames,
    removeGame,
    gameMode,
    playersAmount,
    isEditable,
}) {
    return (
        <>
            {completedGames.map((game, i) => (
                <Card key={game.id} elevation={10} className={styles.card}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems={"center"}
                    >
                        <Typography variant="h6">Game {i + 1}</Typography>
                        {isEditable && (
                            <ConfirmDeleteMatch
                                onCofirm={removeGame}
                                index={i}
                            />
                        )}
                    </Box>

                    <Box className={styles.dividerBox}>
                        <Divider />
                        <Divider />
                    </Box>

                    <Box
                        display="flex"
                        justifyContent="space-evenly"
                        mt={0.7}
                        gap="25px"
                        style={{ width: "100%" }}
                    >
                        <Note
                            datas={game.t1Datas}
                            winner={game.winner}
                            team="Team 1"
                        />

                        <Box className={styles.dividerLine} />

                        <Note
                            datas={game.t2Datas}
                            winner={game.winner}
                            team="Team 2"
                        />
                    </Box>

                    {playersAmount > 2 &&
                        gameMode?.label === "Free For All" && (
                            <>
                                <Box className={styles.dividerBox2}>
                                    <Divider />
                                    <Divider />
                                </Box>

                                <Box
                                    display="flex"
                                    justifyContent="space-evenly"
                                    mt={0.7}
                                    gap="25px"
                                    style={{ width: "100%" }}
                                >
                                    <Note
                                        datas={game.t3Datas}
                                        winner={game.winner}
                                        team="Team 3"
                                    />

                                    {playersAmount === 4 ? (
                                        <>
                                            <Box
                                                className={styles.dividerLine}
                                            />
                                            <Note
                                                datas={game.t4Datas}
                                                winner={game.winner}
                                                team="Team 4"
                                            />
                                        </>
                                    ) : null}
                                </Box>
                            </>
                        )}
                </Card>
            ))}
        </>
    );
}
