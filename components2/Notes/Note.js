"use client";

import React from "react";

function Note({ winner, datas, team }) {
    return (
        <div style={{ textAlign: "center" }}>
            {datas.map((data, index) => {
                if (index === 0)
                    return (
                        <h4
                            style={{
                                color: "gray",
                                fontStyle: "italic",
                                fontWeight: "bold",
                                margin: "5px 0 5px",
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
                                fontWeight: "bold",
                                margin: "5px 0 5px",
                            }}
                        >
                            {datas[index] < 0 && (
                                <p style={{ color: "#00AB55" }}>Overflown by</p>
                            )}
                            {`${datas[index]}    `}-
                            {`    ${
                                datas
                                    .slice(0, index)
                                    .reduce((a, b) => a + b, 0) + data
                            }`}
                        </h4>
                    );
            })}

            {winner === team && (
                <h4
                    style={{
                        color: "#00AB55",
                        fontStyle: "italic",
                        fontWeight: "bold",
                        margin: "5px 0 5px",
                    }}
                >
                    Winner
                </h4>
            )}

            {datas.length === 0 && winner !== team && (
                <h4
                    style={{
                        color: "#FF4842",
                        fontStyle: "italic",
                        fontWeight: "bold",
                        margin: "5px 0 5px",
                    }}
                >
                    Pollo
                </h4>
            )}
            {datas.length === 1 && winner !== team && (
                <h4
                    style={{
                        color: "#FF4842",
                        fontStyle: "italic",
                        fontWeight: "bold",
                        margin: "5px 0 5px",
                    }}
                >
                    Zapato
                </h4>
            )}
        </div>
    );
}

export default Note;
