"use client";

import { usePopup, useSettings } from "../context";
import { Checkbox, LeftSvg, VolumeSvg, MuteSvg, UpSvg, DownSvg } from "../components";
import { TranslatableString, translate } from "../translate";
import { Language } from "@/constants";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

function SettingsSection({ title, children }: { title: ReactNode; children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <section>
            <button onClick={() => setIsOpen(!isOpen)} className="font-bold border-b border-gray-600 mb-4 pb-1 w-full text-left flex justify-between items-center" style={{ fontSize: "6dvmin" }}>
                {title}
                <div style={{ width: "4dvmin", height: "4dvmin" }}>{isOpen ? <UpSvg /> : <DownSvg />}</div>
            </button>
            {isOpen && children}
        </section>
    );
}

export default function Settings() {
    const { settings, setLang, setBgm, setSfx, setFont } = useSettings();
    const { lang, bgm, sfx, font } = settings;
    const { showConfirm } = usePopup();
    const t = (str: TranslatableString) => translate(str, lang);
    const router = useRouter();

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
                        width: "min(90vw, 500px)",
                        maxWidth: "500px",
                    }}>
                    <h1 className="font-bold text-center border-b-2 border-[#444] mb-4 pb-2 text-[#222] drop-shadow-sm" style={{ fontSize: "9dvmin" }}>
                        {t("設定")}
                    </h1>
                    <button
                        className="btn yellowBtn w-full py-3 px-4 text-center font-bold text-black"
                        style={{ fontSize: "5dvmin" }}
                        onClick={() =>
                            showConfirm(
                                <div className="text-center">
                                    <p>{t("フル版へ移動しますか？(完全無料)")}</p>
                                </div>,
                                () => {
                                    window.location.href = "https://cube-escape.vercel.app";
                                },
                            )
                        }>
                        {t("フル版へ移動 >>>")}
                    </button>
                    <SettingsSection title={<span className="text-[#333]">{t("オーディオ")}</span>}>
                        <div className="flex flex-col gap-2 py-2">
                            <button onClick={() => setBgm(!bgm, "/menu.mp3")} className="flex items-center cursor-pointer bg-black/5 hover:bg-black/15 p-3 w-full text-left gap-3 transition-colors border border-black/10">
                                <div className="text-[#333]">{bgm ? <VolumeSvg /> : <MuteSvg />}</div>
                                <span className="text-[#222]" style={{ fontSize: "5dvmin" }}>
                                    {t("音楽")}
                                </span>
                            </button>
                            <button onClick={() => setSfx(!sfx)} className="flex items-center cursor-pointer bg-black/5 hover:bg-black/15 p-3 w-full text-left gap-3 transition-colors border border-black/10">
                                <div className="text-[#333]">{sfx ? <VolumeSvg /> : <MuteSvg />}</div>
                                <span className="text-[#222]" style={{ fontSize: "5dvmin" }}>
                                    {t("効果音")}
                                </span>
                            </button>
                        </div>
                    </SettingsSection>
                    <SettingsSection title={<span className="text-[#333]">{t("言語")}</span>}>
                        <div className="flex flex-col gap-2 py-2">
                            {[
                                ["ja", "日本語"],
                                ["us", "English(US)"],
                                ["gb", "English(UK)"],
                                ["cn", "中文（简体字）"],
                                ["tw", "中文（繁體字）"],
                            ].map((l) => (
                                <Checkbox key={l[0]} id={l[0]} checked={l[0] === lang} onChange={() => setLang(l[0] as Language)} className="flex items-center cursor-pointer bg-black/5 hover:bg-black/15 p-3 w-full transition-colors border border-black/10">
                                    <span className="text-[#222]" style={{ fontSize: "5dvmin" }}>
                                        {l[1]}
                                    </span>
                                </Checkbox>
                            ))}
                        </div>
                    </SettingsSection>
                    <SettingsSection title={<span className="text-[#333]">{t("表示")}</span>}>
                        <div className="py-2">
                            <Checkbox id={"makinas"} checked={font} onChange={() => setFont(!font)} className="flex items-center cursor-pointer bg-black/5 hover:bg-black/15 p-3 w-full transition-colors border border-black/10">
                                <span className="text-[#222]" style={{ fontSize: "5dvmin" }}>
                                    {t("フォント")}
                                </span>
                            </Checkbox>
                        </div>
                    </SettingsSection>
                </div>
            </div>
        </div>
    );
}
