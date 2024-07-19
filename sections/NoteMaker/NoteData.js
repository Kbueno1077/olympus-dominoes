"use client";
import React from "react";
import ConfirmDeleteData from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteData";

export default function NoteData({
    gameEditionMode,
    handleRemoveDataFromGame,
    index,
    teamDatas,
    teamNumber,
}) {
    if (gameEditionMode && index === 0) {
        return (
            <ConfirmDeleteData
                onCofirm={() => handleRemoveDataFromGame(teamNumber, index)}
                teamDatas={teamDatas}
                index={index}
                isFirst={true}
            />
        );
    }

    if (gameEditionMode && index !== 0) {
        return (
            <ConfirmDeleteData
                onCofirm={() => handleRemoveDataFromGame(teamNumber, index)}
                teamDatas={teamDatas}
                index={index}
                isFirst={false}
            />
        );
    }

    if (index === 0) {
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
                {`x    -    ${teamDatas[0]}`}
            </h4>
        );
    }

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
            {`${teamDatas[index]}    `}-
            {`    ${
                teamDatas.slice(0, index).reduce((a, b) => a + b, 0) +
                teamDatas[index]
            }`}
        </h4>
    );
}
