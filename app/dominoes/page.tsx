"use client";

import { Container } from "@mui/material";
import NewMatch from "../../modules/NewMatch/newMatch";

export default function Dashboard({}) {
    return (
        <Container maxWidth="xl" sx={{ padding: "0 10px 0" }}>
            <div style={{ paddingTop: "40px", paddingBottom: "40px" }}>
                <NewMatch />
            </div>
        </Container>
    );
}
