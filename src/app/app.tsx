"use client";

import { useEffect, useState } from "react";
import { onLoad, playBgm } from "@/game/base";
import { Loading, MuteSvg, VolumeSvg } from "./components";
import { Language } from "@/constants";
import { useSettings } from "./context";

export default function App({ children }: { children: React.ReactNode }) {
    const { settings, setLang, setBgm, setSfx, setFont } = useSettings();
    const [isInitLoading, setIsInitLoading] = useState(true);
    const [isAudioLoading, setIsAudioLoading] = useState(true);
    const [isAudioSelected, setIsAudioSelected] = useState(false);

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
        <div suppressHydrationWarning>
            {isInitLoading || (isAudioLoading && <Loading />)}
            {!isAudioSelected && (
                <div className="absolute inset-0 z-50 flex items-center justify-center w-full h-full bg-[#333]">
                    <button
                        className="cursor-pointer m-5 bg-blue-300 rounded-4xl p-5"
                        onClick={async () => {
                            setIsAudioSelected(true);
                            await setBgm(true);
                            await setSfx(true);
                            setIsAudioLoading(false);
                            playBgm("/menu.mp3");
                        }}>
                        <VolumeSvg />
                    </button>
                    <button
                        className="cursor-pointer m-5 bg-blue-300 rounded-4xl p-5"
                        onClick={async () => {
                            setIsAudioSelected(true);
                            await setBgm(false);
                            await setSfx(false);
                            setIsAudioLoading(false);
                        }}>
                        <MuteSvg />
                    </button>
                </div>
            )}
            {children}
        </div>
    );
}
