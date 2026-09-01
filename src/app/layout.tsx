import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Block Lockd",
    description: "Block Lockd is an action puzzle game where you control a character and aim to escape each stage.",
    appleWebApp: {
        title: "Block Lockd",
    },
};

import { PopupProvider, SettingsProvider, StageProvider } from "@/app/context";
import App from "@/app/app";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body>
                <PopupProvider>
                    <SettingsProvider>
                        <StageProvider>
                            <App>{children}</App>
                        </StageProvider>
                    </SettingsProvider>
                </PopupProvider>
            </body>
        </html>
    );
}
