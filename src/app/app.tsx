"use client";

import { useEffect, useState } from "react";
import { onLoad } from "@/game/base";
import { Loading } from "./components";

export default function App({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);

    // 上方向へのスクロールを制限する処理
    const blockScrollUp = () => {
        if (document.documentElement.scrollTop <= 1) {
            document.documentElement.style.overscrollBehavior = "none";
        } else {
            document.documentElement.style.overscrollBehavior = "auto";
        }
    };

    useEffect(() => {
        (async () => {
            window.addEventListener("scroll", blockScrollUp);
            blockScrollUp();
            await onLoad();
            setIsLoading(false);
        })();
    }, []);

    if (isLoading) {
        return <Loading />;
    }

    return <>{children}</>;
}
