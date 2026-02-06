import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Block Lockd",
    description: "A puzzle x action game.",
    appleWebApp: {
        title: "Block Lockd",
    },
};

import { AuthProvider, SettingsProvider, StageProvider } from "@/app/context";
import App from "@/app/app";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body>
                <AuthProvider>
                    <SettingsProvider>
                        <StageProvider>
                            <App>{children}</App>
                        </StageProvider>
                    </SettingsProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
