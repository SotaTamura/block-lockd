"use client";

import { useEffect, useState } from "react";
import { onLoad } from "@/game/base";
import { Loading } from "./components";

export default function App({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            await onLoad();
            setIsLoading(false);
        })();
    }, []);

    if (isLoading) {
        return <Loading />;
    }

    return <>{children}</>;
}
