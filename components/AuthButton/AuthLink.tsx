"use client";

import { useTheme } from "@mui/material";
import Link from "next/link";
import React from "react";

function AuthLink() {
    const theme = useTheme();

    return (
        <Link
            href="/login"
            className={`py-2 px-3 flex rounded-md no-underline `}
            style={{
                color: theme.palette.primary.main,
                border: `1px solid ${theme.palette.primary.main}`,
            }}
        >
            Login
        </Link>
    );
}

export default AuthLink;
