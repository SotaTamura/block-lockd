"use client";

import { useSettings } from "../context";
import { LeftSvg } from "../components";
import { TranslatableString, translate } from "../translate";
import { useEffect } from "react";
import { playBgm } from "@/game/base";
import { useRouter } from "next/navigation";

export default function Credits() {
    const { settings } = useSettings();
    const { lang } = settings;
    const t = (str: TranslatableString) => translate(str, lang);
    const router = useRouter();

    useEffect(() => {
        playBgm("/menu.mp3");
    }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="btn back" onClick={router.back}>
                <LeftSvg />
            </div>
            <div className="flex flex-col items-center grow overflow-y-auto py-10 px-4">
                <div
                    className="bg-[#bbb] border-2 border-[#333] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.4)]"
                    style={{
                        padding: "5dvmin",
                        width: "min(95vw, 600px)",
                        maxWidth: "600px",
                    }}>
                    <h1 className="font-bold text-center border-b-2 border-[#444] mb-4 pb-2 text-[#222] drop-shadow-sm" style={{ fontSize: "9dvmin" }}>
                        {t("クレジット")}
                    </h1>
                    <div className="flex flex-col gap-8 text-left" style={{ fontSize: "4.5dvmin" }}>
                        <div className="bg-black/5 p-4 border border-black/10">
                            <div className="font-bold text-[#444] opacity-70 mb-2 text-[length:4dvmin] border-b border-black/10 pb-1">{t("フォント")}</div>
                            <div className="flex flex-col gap-1">
                                <div className="font-bold text-[#222]">マキナス 4 Square</div>
                                <div className="text-[length:3.5dvmin] text-[#444]">by もじワク研究</div>
                                <a href="https://moji-waku.com/makinas/" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline opacity-80 text-[length:3.8dvmin] break-all mt-1">
                                    https://moji-waku.com/makinas/
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
