"use client";

import React from "react";

function Note({ winner, hands, team }) {
    return (
        <div style={{ textAlign: "center" }}>
            {hands.map((hand, index) => {
                if (index === 0)
                    return (
                        <h4 className="text-gray-500 font-italic font-bold my-2">
                            {`x    -    ${hand}`}
                        </h4>
                    );
                else
                    return (
                        <h4 className="text-gray-500 font-italic font-bold my-2">
                            {hands[index] < 0 && (
                                <p className="text-primary">Overflown by</p>
                            )}
                            <span>
                                {`${hands[index]}    `}-
                                {`    ${
                                    hands
                                        .slice(0, index)
                                        .reduce((a, b) => a + b, 0) + hand
                                }`}
                            </span>
                        </h4>
                    );
            })}

            {winner === team && (
                <h4 className="text-primary italic font-bold my-2">Winner</h4>
            )}

            {hands.length === 0 && winner !== team && (
                <h4 className="text-error italic font-bold my-2">Pollo</h4>
            )}
            {hands.length === 1 && winner !== team && (
                <h4 className="text-error italic font-bold my-2">Zapato</h4>
            )}
        </div>
    );
}

export default Note;
