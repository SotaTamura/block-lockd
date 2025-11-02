import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Cube Escape",
    description: "A puzzle x action game.",
};

import { AuthProvider } from "@/app/context";
import App from "@/app/app";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body>
                <AuthProvider>
                    <App>{children}</App>
                </AuthProvider>
            </body>
        </html>
    );
}
