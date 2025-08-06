import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    icons: {
        icon: "/favicon.ico",
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
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={GeistSans.className}>
            <body className="bg-background text-foreground">
                <main className="min-h-screen flex flex-col items-center">
                    <Providers>{children}</Providers>
                </main>
            </body>
        </html>
    );
}
