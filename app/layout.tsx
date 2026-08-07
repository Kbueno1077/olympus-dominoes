import {
    DEFAULT_LANGUAGE,
    isSupportedLanguage,
    LANGUAGE_COOKIE,
} from "@/i18n/translations";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { Caveat } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";

// Used only for the scores pencilled onto the notepad, never for UI chrome.
const handwriting = Caveat({
    subsets: ["latin"],
    weight: ["500", "700"],
    display: "swap",
    variable: "--font-hand",
});

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    // app/icon.png + app/apple-icon.png are picked up by the App Router.
    // public/favicon.ico covers the hard-coded /favicon.ico browser request.
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon.png", type: "image/png", sizes: "48x48" },
        ],
        shortcut: "/favicon.ico",
    },
    metadataBase: new URL(defaultUrl),
    title: "Olympus Dominoes",
    description: "The fastest way to write dominoes scores",
};

export const viewport: Viewport = {
    initialScale: 1,
    maximumScale: 1,
    width: "device-width",
    themeColor: "#F1E7D6",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Read on the server so the first paint is already in the right language;
    // anything client-only here would break hydration on every reload.
    // Awaited because `cookies()` is async from Next 15 on; awaiting the
    // synchronous Next 14 return value is harmless.
    const cookieStore = await cookies();
    const stored = cookieStore.get(LANGUAGE_COOKIE)?.value;
    const language = isSupportedLanguage(stored) ? stored! : DEFAULT_LANGUAGE;

    // `variable` exposes Geist as --font-geist-sans, which globals.css and the
    // MUI typography config both read, so every layer uses one font file.
    return (
        <html
            lang={language}
            className={`${GeistSans.variable} ${handwriting.variable}`}
        >
            <body>
                <main className="h-full max-w-full overflow-hidden flex flex-col">
                    <Providers initialLanguage={language}>{children}</Providers>
                </main>
            </body>
        </html>
    );
}
