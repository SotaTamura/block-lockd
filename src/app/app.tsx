"use client";

import { useEffect, useState } from "react";
import { onLoad } from "@/game/base";
import { Loading, Popup } from "./components";
import { Language } from "@/constants";
import { usePopup, useSettings } from "./context";
export default function App({ children }: { children: React.ReactNode }) {
    const { settings, setLang, setFont } = useSettings();
    const { popupData } = usePopup();
    const [isInitLoading, setIsInitLoading] = useState(true);

    // 上方向へのスクロールを制限する処理
    const blockScrollUp = () => {
        if (document.documentElement.scrollTop <= 1) {
            document.documentElement.style.overscrollBehavior = "none";
        } else {
            document.documentElement.style.overscrollBehavior = "auto";
        }
    };

    useEffect(() => {
        if (settings.font) {
            document.body.classList.add("makinas-font");
        } else {
            document.body.classList.remove("makinas-font");
        }
    }, [settings.font]);

    useEffect(() => {
        const htmlLang = settings.lang === "cn" ? "zh-Hans" : settings.lang === "tw" ? "zh-Hant" : settings.lang === "ja" ? "ja" : "en";
        document.documentElement.lang = htmlLang;

        document.body.classList.remove("font-cn", "font-tw", "font-ja", "font-us", "font-gb");
        document.body.classList.add(`font-${settings.lang}`);
    }, [settings.lang]);

    useEffect(() => {
        // 言語
        let lang: Language = "ja";
        if (typeof window !== "undefined") {
            const storageLang = localStorage.getItem("la");
            if (storageLang) lang = storageLang as Language;
            else {
                const value = navigator.language.toLowerCase().replace("_", "-");
                const parts = value.split("-");
                const langRaw = parts[0];
                const region = parts[1] ?? "";
                const script = parts[1] === "hans" || parts[1] === "hant" ? parts[1] : parts[2];
                if (langRaw === "ja") lang = "ja";
                else if (langRaw === "en") lang = region === "gb" ? "gb" : "us";
                else if (langRaw === "zh") lang = region === "tw" || region === "hk" || script === "hant" ? "tw" : "cn";
                else lang = "us";
            }
        }
        setLang(lang);
        // フォント
        let font = true;
        if (typeof window !== "undefined") {
            const storageFont = localStorage.getItem("font");
            if (storageFont) font = Boolean(Number(storageFont));
        }
        setFont(font);
        (async () => {
            window.addEventListener("scroll", blockScrollUp);
            blockScrollUp();
            await onLoad();
            setIsInitLoading(false);
        })();
    }, []);
    return (
        <div suppressHydrationWarning className="h-full w-full">
            {isInitLoading ? <Loading /> : null}
            {popupData && (
                <Popup onOk={popupData.onOk} onCancel={popupData.onCancel}>
                    {popupData.children}
                </Popup>
            )}
            {children}
        </div>
    );
}
