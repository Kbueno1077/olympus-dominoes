import { Icon } from "@iconify/react";
import {
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    Typography,
} from "@mui/material";
import AddScoreDialog from "../../components/Dialogs/AddScoreDialog/AddScoreDialog";

export default function NoteMaker({
    isGameStarted,
    completedGames,
    currentGame,
    gameMode,
    playersAmount,
    whoWon,
    handleWhoWon,
    handleUpateScores,
    handleNextGame,
    maxPoints,
}) {
    return (
        <>
            <Card elevation={10} sx={{ width: "100%", padding: "15px" }}>
                <Typography variant="h6" sx={{ color: "#56616A" }}>
                    Game {completedGames.length + 1}
                </Typography>

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
                    <h4 style={{ color: "#56616A", fontWeight: "bold" }}>
                        Team 1
                    </h4>
                    <h4 style={{ color: "#56616A", fontWeight: "bold" }}>
                        Team 2
                    </h4>
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
                    gap="15px"
                >
                    {/**TEAM 1 WRITABLE */}
                    <Box sx={{ width: "100%" }}>
                        {currentGame.t1Datas.map((data, index) => {
                            if (index === 0)
                                return (
                                    <h4
                                        style={{
                                            color: "gray",
                                            fontStyle: "italic",
                                            textAlign: "center",
                                            margin: "5px 0 5px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {`x    -    ${data}`}
                                    </h4>
                                );
                            else
                                return (
                                    <h4
                                        style={{
                                            color: "gray",
                                            fontStyle: "italic",
                                            textAlign: "center",
                                            margin: "5px 0 5px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {`${currentGame.t1Datas[index]}    `}-
                                        {`    ${
                                            currentGame.t1Datas
                                                .slice(0, index)
                                                .reduce((a, b) => a + b, 0) +
                                            data
                                        }`}
                                    </h4>
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
                                    onChange={() => {
                                        if (whoWon === "Team 1")
                                            handleWhoWon("");
                                        else handleWhoWon("Team 1");
                                    }}
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
                        {currentGame.t2Datas.map((data, index) => {
                            if (index === 0)
                                return (
                                    <h4
                                        style={{
                                            color: "gray",
                                            fontStyle: "italic",
                                            textAlign: "center",
                                            margin: "5px 0 5px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {`x    -    ${data}`}
                                    </h4>
                                );
                            else
                                return (
                                    <h4
                                        style={{
                                            color: "gray",
                                            fontStyle: "italic",
                                            textAlign: "center",
                                            margin: "5px 0 5px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {`${currentGame.t2Datas[index]}    `}-
                                        {`    ${
                                            currentGame.t2Datas
                                                .slice(0, index)
                                                .reduce((a, b) => a + b, 0) +
                                            data
                                        }`}
                                    </h4>
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
                                    onChange={() => {
                                        if (whoWon === "Team 2")
                                            handleWhoWon("");
                                        else handleWhoWon("Team 2");
                                    }}
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
                            gap="15px"
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
                                <h4
                                    style={{
                                        color: "#56616A",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Team 3
                                </h4>
                                {playersAmount === 4 && (
                                    <h4
                                        style={{
                                            color: "#56616A",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Team 4
                                    </h4>
                                )}
                            </div>

                            <Box sx={{ width: "100%" }}>
                                {currentGame.t3Datas.map((data, index) => {
                                    if (index === 0)
                                        return (
                                            <h4
                                                style={{
                                                    color: "gray",
                                                    fontStyle: "italic",
                                                    textAlign: "center",
                                                    margin: "5px 0 5px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {`x    -    ${data}`}
                                            </h4>
                                        );
                                    else
                                        return (
                                            <h4
                                                style={{
                                                    color: "gray",
                                                    fontStyle: "italic",
                                                    textAlign: "center",
                                                    margin: "5px 0 5px",
                                                }}
                                            >
                                                {`${currentGame.t3Datas[index]}    `}
                                                -
                                                {`    ${
                                                    currentGame.t3Datas
                                                        .slice(0, index)
                                                        .reduce(
                                                            (a, b) => a + b,
                                                            0
                                                        ) + data
                                                }`}
                                            </h4>
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
                                            onChange={() => {
                                                if (whoWon === "Team 3")
                                                    handleWhoWon("");
                                                else handleWhoWon("Team 3");
                                            }}
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
                                    {currentGame.t4Datas.map((data, index) => {
                                        if (index === 0)
                                            return (
                                                <h4
                                                    style={{
                                                        color: "gray",
                                                        fontStyle: "italic",
                                                        textAlign: "center",
                                                        margin: "5px 0 5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {`x    -    ${data}`}
                                                </h4>
                                            );
                                        else
                                            return (
                                                <h4
                                                    style={{
                                                        color: "gray",
                                                        fontStyle: "italic",
                                                        textAlign: "center",
                                                        margin: "5px 0 5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {`${currentGame.t4Datas[index]}    `}
                                                    -
                                                    {`    ${
                                                        currentGame.t4Datas
                                                            .slice(0, index)
                                                            .reduce(
                                                                (a, b) => a + b,
                                                                0
                                                            ) + data
                                                    }`}
                                                </h4>
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
                                                onChange={() => {
                                                    if (whoWon === "Team 4")
                                                        handleWhoWon("");
                                                    else handleWhoWon("Team 4");
                                                }}
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

            {isGameStarted && (
                <Card
                    elevation={10}
                    sx={{ maxWidth: "950px", width: "100%", padding: "15px" }}
                >
                    <Box display="flex" justifyContent="flex-end">
                        <Button onClick={handleNextGame}>Next Game</Button>
                    </Box>
                </Card>
            )}
        </>
    );
}
