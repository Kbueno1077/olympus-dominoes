"use client";

import { Box, Card, Divider, Typography } from "@mui/material";
import ConfirmDeleteGame from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteGame";
import Note from "@/components/Notes/Note";
import styles from "./notesDone.module.css";
import { useRecoilState, useRecoilValue } from "recoil";
import {
    completedGamesRecoil,
    gameModeRecoil,
    playersAmountRecoil,
} from "@/recoil/recoilState";

export default function NotesDone() {
    const [completedGames, setCompletedGame] =
        useRecoilState(completedGamesRecoil);

    const playersAmount = useRecoilValue(playersAmountRecoil);
    const gameMode = useRecoilValue(gameModeRecoil);

    const removeGame = (index) => {
        const removedGame = completedGames.filter((_, i) => i !== index);
        setCompletedGame(removedGame);
    };

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

                        <ConfirmDeleteGame onCofirm={removeGame} index={i} />
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
                        className="w-full"
                    >
                        <Note
                            hands={game.t1Datas}
                            winner={game.winner}
                            team="Team 1"
                        />

                        <Box className={styles.dividerLine} />

                        <Note
                            hands={game.t2Datas}
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
                                    className="w-full"
                                >
                                    <Note
                                        hands={game.t3Datas}
                                        winner={game.winner}
                                        team="Team 3"
                                    />

                                    {playersAmount === 4 ? (
                                        <>
                                            <Box
                                                className={styles.dividerLine}
                                            />
                                            <Note
                                                hands={game.t4Datas}
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
