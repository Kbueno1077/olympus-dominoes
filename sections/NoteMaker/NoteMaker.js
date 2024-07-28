import { currentGameRecoil, gameEditionModeRecoil } from "@/recoil/recoilState";
import { Icon } from "@iconify/react";
import {
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    IconButton,
    Typography,
} from "@mui/material";
import { useRecoilState } from "recoil";
import AddScoreDialog from "../../components/Dialogs/AddScoreDialog/AddScoreDialog";
import NoteHand from "./NoteHand";

export default function NoteMaker({
    isGameStarted,
    completedGames,
    gameMode,
    playersAmount,
    whoWon,

    handleUpateScores,
    maxPoints,
}) {
    const [gameEditionMode, setGameEditionMode] = useRecoilState(
        gameEditionModeRecoil
    );
    const [currentGame, setCurrentGame] = useRecoilState(currentGameRecoil);

    const handleRemoveDataFromGame = (teamNumber, index) => {
        const newCurrentGame = { ...currentGame };
        const teamDatasName = `t${teamNumber}Datas`;
        const teamTotalsName = `t${teamNumber}TotalPoints`;

        const newTeamTotalPoints =
            newCurrentGame[teamTotalsName] -
            newCurrentGame[teamDatasName][index];

        let frontPart = newCurrentGame[teamDatasName].slice(0, index);
        let lastPart = newCurrentGame[teamDatasName].slice(index + 1);
        const newTeamDatas = [...frontPart, ...lastPart];

        newCurrentGame[teamTotalsName] = newTeamTotalPoints;
        newCurrentGame[teamDatasName] = newTeamDatas;

        setCurrentGame(newCurrentGame);
    };

    return (
        <>
            <Card elevation={10} sx={{ width: "100%", padding: "16px" }}>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" sx={{ color: "#56616A" }}>
                        Game {completedGames.length + 1}
                    </Typography>

                    {!gameEditionMode ? (
                        <IconButton
                            color="primary"
                            onClick={() => {
                                setGameEditionMode(true);
                            }}
                        >
                            <Icon
                                sx={{
                                    fontSize: "22px",
                                }}
                                icon="ic:baseline-edit"
                            />
                        </IconButton>
                    ) : (
                        <IconButton
                            onClick={() => {
                                setGameEditionMode(false);
                            }}
                        >
                            <Icon
                                sx={{
                                    fontSize: "22px",
                                }}
                                icon="ic:baseline-edit-off"
                            />
                        </IconButton>
                    )}
                </Box>

                <div
                    style={{
                        width: "100%",
                        position: "absolute",
                        display: "flex",
                        justifyContent: "space-evenly",
                        gap: "50px",
                        left: "0",
                    }}
                >
                    <Typography
                        variant="h6"
                        style={{ color: "#56616A", fontWeight: "bold" }}
                    >
                        Team 1
                    </Typography>
                    <Typography
                        variant="h6"
                        style={{ color: "#56616A", fontWeight: "bold" }}
                    >
                        Team 2
                    </Typography>
                </div>

                <Box sx={{ margin: "50px auto 0", width: "90%" }}>
                    <Divider />
                    <Divider />
                </Box>

                <Box
                    display="flex"
                    justifyContent="space-evenly"
                    mt={2}
                    px={2}
                    gap="16px"
                >
                    {/**TEAM 1 WRITABLE */}
                    <Box sx={{ width: "100%" }}>
                        {currentGame.t1Datas.map((hand, index) => {
                            return (
                                <NoteHand
                                    key={`${hand} + ${index}`}
                                    gameEditionMode={gameEditionMode}
                                    handleRemoveDataFromGame={
                                        handleRemoveDataFromGame
                                    }
                                    index={index}
                                    teamDatas={currentGame.t1Datas}
                                    teamNumber={1}
                                />
                            );
                        })}

                        <AddScoreDialog
                            addScore={handleUpateScores}
                            disabled={currentGame.t1TotalPoints >= maxPoints}
                            teamNumber={1}
                        />

                        <Box
                            display="flex"
                            justifyContent="flex-end items-end"
                            sx={{ marginTop: "20px", alignSelf: "flex-end" }}
                        >
                            <Typography
                                sx={{ fontStyle: "italic", color: "gray" }}
                            >
                                <Checkbox
                                    disabled={!isGameStarted}
                                    style={{ color: "#FFB636" }}
                                    icon={
                                        <Icon
                                            style={{
                                                fontSize: "22px",
                                                color: "gray",
                                            }}
                                            icon="ant-design:trophy-outlined"
                                        />
                                    }
                                    checkedIcon={
                                        <Icon
                                            style={{
                                                fontSize: "22px",
                                                color: "#FFB636",
                                            }}
                                            icon="ant-design:trophy-outlined"
                                        />
                                    }
                                    sx={{ marginTop: "-2px" }}
                                    checked={whoWon === "Team 1"}
                                />
                                Total:{" "}
                                {currentGame.t1TotalPoints < maxPoints ? (
                                    currentGame.t1TotalPoints
                                ) : (
                                    <>
                                        <span>{currentGame.t1TotalPoints}</span>
                                        <Typography
                                            variant="h6"
                                            sx={{ color: "#FFB636" }}
                                        >
                                            Overflow
                                        </Typography>
                                    </>
                                )}
                            </Typography>
                        </Box>
                    </Box>

                    {/**MIDDLE LINE */}
                    <Box
                        sx={{ border: "1px solid #E5E8EB", marginTop: "-55px" }}
                    />

                    {/**TEAM 2 or 3/4 WRITABLE */}
                    <Box
                        sx={{
                            width: "100%",
                        }}
                    >
                        {currentGame.t2Datas.map((hand, index) => {
                            return (
                                <NoteHand
                                    key={`${hand} + ${index}`}
                                    gameEditionMode={gameEditionMode}
                                    handleRemoveDataFromGame={
                                        handleRemoveDataFromGame
                                    }
                                    index={index}
                                    teamDatas={currentGame.t2Datas}
                                    teamNumber={2}
                                />
                            );
                        })}

                        <AddScoreDialog
                            addScore={handleUpateScores}
                            disabled={currentGame.t2TotalPoints >= maxPoints}
                            teamNumber={2}
                        />

                        <Box
                            display="flex"
                            justifyContent="flex-end"
                            sx={{ marginTop: "20px", alignSelf: "flex-end" }}
                        >
                            <Typography
                                sx={{
                                    fontStyle: "italic",
                                    color: "gray",
                                    marginRight: "25px",
                                }}
                            >
                                <Checkbox
                                    disabled={!isGameStarted}
                                    style={{ color: "#FFB636" }}
                                    icon={
                                        <Icon
                                            style={{
                                                fontSize: "22px",
                                                color: "gray",
                                            }}
                                            icon="ant-design:trophy-outlined"
                                        />
                                    }
                                    checkedIcon={
                                        <Icon
                                            style={{
                                                fontSize: "22px",
                                                color: "#FFB636",
                                            }}
                                            icon="ant-design:trophy-outlined"
                                        />
                                    }
                                    sx={{ marginTop: "-2px" }}
                                    checked={whoWon === "Team 2"}
                                />
                                Total:{" "}
                                {currentGame.t2TotalPoints < maxPoints ? (
                                    currentGame.t2TotalPoints
                                ) : (
                                    <>
                                        <span>{currentGame.t2TotalPoints}</span>
                                        <Typography
                                            variant="h6"
                                            sx={{ color: "#FFB636" }}
                                        >
                                            Overflow
                                        </Typography>
                                    </>
                                )}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/**WHEN IS MORE THAN 2 AND FREE FOR ALL */}
                {/**TEAM 3 WRITABLE */}
                {playersAmount > 2 && gameMode?.label === "Free For All" && (
                    <>
                        <Box sx={{ margin: "80px auto 0", width: "90%" }}>
                            <Divider />
                            <Divider />
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-evenly"
                            mt={2}
                            px={2}
                            gap="16px"
                        >
                            <div
                                style={{
                                    width: "100%",
                                    position: "absolute",
                                    display: "flex",
                                    justifyContent:
                                        playersAmount === 4
                                            ? "space-evenly"
                                            : "center",
                                    gap: "50px",
                                    left: "0",
                                    top: "225px",
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    style={{
                                        color: "#56616A",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Team 3
                                </Typography>
                                {playersAmount === 4 && (
                                    <Typography
                                        variant="h6"
                                        style={{
                                            color: "#56616A",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Team 4
                                    </Typography>
                                )}
                            </div>

                            <Box sx={{ width: "100%" }}>
                                {currentGame.t3Datas.map((hand, index) => {
                                    return (
                                        <NoteHand
                                            key={`${hand} + ${index}`}
                                            gameEditionMode={gameEditionMode}
                                            handleRemoveDataFromGame={
                                                handleRemoveDataFromGame
                                            }
                                            index={index}
                                            teamDatas={currentGame.t3Datas}
                                            teamNumber={3}
                                        />
                                    );
                                })}

                                <AddScoreDialog
                                    addScore={handleUpateScores}
                                    disabled={
                                        currentGame.t3TotalPoints >= maxPoints
                                    }
                                    teamNumber={3}
                                />

                                <Box
                                    display="flex"
                                    justifyContent="flex-end items-end"
                                    sx={{
                                        marginTop: "20px",
                                        alignSelf: "flex-end",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontStyle: "italic",
                                            color: "gray",
                                        }}
                                    >
                                        <Checkbox
                                            disabled={!isGameStarted}
                                            style={{ color: "#FFB636" }}
                                            icon={
                                                <Icon
                                                    style={{
                                                        fontSize: "22px",
                                                        color: "gray",
                                                    }}
                                                    icon="ant-design:trophy-outlined"
                                                />
                                            }
                                            checkedIcon={
                                                <Icon
                                                    style={{
                                                        fontSize: "22px",
                                                        color: "#FFB636",
                                                    }}
                                                    icon="ant-design:trophy-outlined"
                                                />
                                            }
                                            sx={{ marginTop: "-2px" }}
                                            checked={whoWon === "Team 3"}
                                        />
                                        Total:{" "}
                                        {currentGame.t3TotalPoints <
                                        maxPoints ? (
                                            currentGame.t3TotalPoints
                                        ) : (
                                            <>
                                                <span>
                                                    {currentGame.t3TotalPoints}
                                                </span>
                                                <Typography
                                                    variant="h6"
                                                    sx={{ color: "#FFB636" }}
                                                >
                                                    Overflow
                                                </Typography>
                                            </>
                                        )}
                                    </Typography>
                                </Box>
                            </Box>

                            {/**MIDDLE LINE */}
                            <Box
                                sx={{
                                    border: `${
                                        playersAmount === 4
                                            ? "1px solid #E5E8EB"
                                            : "none"
                                    }`,
                                    marginTop: "-55px",
                                }}
                            />

                            {/**TEAM 4 WRITABLE */}
                            {playersAmount === 4 ? (
                                <Box
                                    sx={{
                                        width: "100%",
                                    }}
                                >
                                    {currentGame.t4Datas.map((hand, index) => {
                                        return (
                                            <NoteHand
                                                key={`${hand} + ${index}`}
                                                gameEditionMode={
                                                    gameEditionMode
                                                }
                                                handleRemoveDataFromGame={
                                                    handleRemoveDataFromGame
                                                }
                                                index={index}
                                                teamDatas={currentGame.t4Datas}
                                                teamNumber={4}
                                            />
                                        );
                                    })}

                                    <AddScoreDialog
                                        addScore={handleUpateScores}
                                        disabled={
                                            currentGame.t4TotalPoints >=
                                            maxPoints
                                        }
                                        teamNumber={4}
                                    />

                                    <Box
                                        display="flex"
                                        justifyContent="flex-end"
                                        sx={{
                                            marginTop: "20px",
                                            alignSelf: "flex-end",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontStyle: "italic",
                                                color: "gray",
                                                marginRight: "25px",
                                            }}
                                        >
                                            <Checkbox
                                                disabled={!isGameStarted}
                                                style={{ color: "#FFB636" }}
                                                icon={
                                                    <Icon
                                                        style={{
                                                            fontSize: "22px",
                                                            color: "gray",
                                                        }}
                                                        icon="ant-design:trophy-outlined"
                                                    />
                                                }
                                                checkedIcon={
                                                    <Icon
                                                        style={{
                                                            fontSize: "22px",
                                                            color: "#FFB636",
                                                        }}
                                                        icon="ant-design:trophy-outlined"
                                                    />
                                                }
                                                sx={{ marginTop: "-2px" }}
                                                checked={whoWon === "Team 4"}
                                            />
                                            Total:{" "}
                                            {currentGame.t4TotalPoints <
                                            maxPoints ? (
                                                currentGame.t4TotalPoints
                                            ) : (
                                                <>
                                                    <span>
                                                        {
                                                            currentGame.t4TotalPoints
                                                        }
                                                    </span>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            color: "#FFB636",
                                                        }}
                                                    >
                                                        Overflow
                                                    </Typography>
                                                </>
                                            )}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                ""
                            )}
                        </Box>
                    </>
                )}
            </Card>
        </>
    );
}
