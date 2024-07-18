"use client";

import { Icon } from "@iconify/react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    TextField,
    Card,
    Typography,
} from "@mui/material";
import React from "react";

function OptionalDescription({ matchDescription, setMatchDescription }) {
    return (
        <Card
            elevation={10}
            sx={{
                width: "100%",
                padding: "15px",
            }}
        >
            <Accordion>
                <AccordionSummary
                    expandIcon={<Icon icon="eva:arrow-ios-downward-outline" />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography
                        color={"primary"}
                        sx={{
                            fontWeight: 700,
                        }}
                    >
                        Optional Description
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField
                        id="outlined-multiline-flexible"
                        label="Description, something worthy of recall"
                        multiline
                        fullWidth
                        value={matchDescription}
                        onChange={(e) => setMatchDescription(e.target.value)}
                        maxRows={4}
                        minRows={4}
                    />
                </AccordionDetails>
            </Accordion>
        </Card>
    );
}

export default OptionalDescription;
