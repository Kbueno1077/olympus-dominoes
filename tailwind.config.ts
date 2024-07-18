import { error } from "console";

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: "rgb(var(--primary))",
                secondary: "rgb(var(--secondary))",
                error: "rgb(var(--error))",
                text: "rgb(var(--text))",
            },
        },
    },
    plugins: [],
};
