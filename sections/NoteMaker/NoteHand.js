"use client";
import React from "react";
import ConfirmDeleteHand from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteHand";
import { Typography } from "@mui/material";

export default function NoteHand({
    gameEditionMode,
    handleRemoveDataFromGame,
    index,
    teamDatas,
    teamNumber,
}) {
    if (gameEditionMode && index === 0) {
        return (
            <ConfirmDeleteHand
                onCofirm={() => handleRemoveDataFromGame(teamNumber, index)}
                teamDatas={teamDatas}
                index={index}
                isFirst={true}
            />
        );
    }

    if (gameEditionMode && index !== 0) {
        return (
            <ConfirmDeleteHand
                onCofirm={() => handleRemoveDataFromGame(teamNumber, index)}
                teamDatas={teamDatas}
                index={index}
                isFirst={false}
            />
        );
    }

    if (index === 0) {
        return (
            <Typography
                variant="h6"
                sx={{
                    color: "gray",
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "0 20px 0",
                    margin: "5px 0 5px",
                    fontWeight: "bold",
                }}
            >
                {`x    -    ${teamDatas[0]}`}
            </Typography>
        );
    }

    return (
        <Typography
            variant="h6"
            sx={{
                color: "gray",
                fontStyle: "italic",
                textAlign: "center",
                padding: "0 20px 0",
                margin: "5px 0 5px",
                fontWeight: "bold",
            }}
        >
            {`${teamDatas[index]}    `}-
            {`    ${
                teamDatas.slice(0, index).reduce((a, b) => a + b, 0) +
                teamDatas[index]
            }`}
        </Typography>
    );
}
