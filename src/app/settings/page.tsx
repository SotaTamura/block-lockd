"use client";

import { useAuth, usePopup, useSettings } from "../context";
import { Checkbox, LeftSvg, VolumeSvg, MuteSvg, UpSvg, DownSvg, Loading } from "../components";
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
    const { user, logout, changeData, signinBySession } = useAuth();
    const { showAlert, showConfirm } = usePopup();
    const { settings, setLang, setBgm, setSfx, setFont } = useSettings();
    const { lang, bgm, sfx, font } = settings;
    const t = (str: TranslatableString) => translate(str, lang);
    const [name, setName] = useState(user?.name || "");
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const handleDeleteData = () => {
        showConfirm(t("本当にデータを削除しますか？"), async () => {
            setIsProcessing(true);
            await logout();
            setIsProcessing(false);
            router.push("/");
        });
    };

    const handleUpdateName = async () => {
        if (!name) {
            showAlert(t("ニックネームを入力してください"));
            return;
        }
        setIsProcessing(true);
        if (user?.id === "guest") {
            await signinBySession(name);
        } else {
            await changeData({ name });
        }
        setIsProcessing(false);
    };

    return (
        <div className="h-svh flex flex-col">
            {isProcessing && <Loading />}
            <div className="btn back" onClick={router.back}>
                <LeftSvg />
            </div>
            <div className="flex flex-col items-center grow overflow-y-auto py-10">
                <div
                    className="bg-[#aaa] bg-opacity-75 border-[#333] flex flex-col gap-6"
                    style={{
                        padding: "4dvmin",
                        borderWidth: "1dvmin",
                        width: "min(90vw, 500px)",
                        maxWidth: "500px",
                    }}>
                    <h1 className="font-bold text-center border-b border-gray-600 mb-4 pb-1" style={{ fontSize: "9dvmin", marginBottom: "1dvmin" }}>
                        {t("設定")}
                    </h1>
                    {user && (
                        <SettingsSection title={t("ユーザー情報")}>
                            <div className="flex flex-col gap-6 py-4 w-full">
                                <div className="flex flex-col gap-2 w-full">
                                    <label className="text-left font-bold opacity-70" style={{ fontSize: "4dvmin" }}>
                                        {t("ニックネームを入力してください")}
                                    </label>
                                    <div className="flex gap-2 w-full">
                                        <input
                                            type="text"
                                            className="grow min-w-0 px-4 py-2 text-black rounded border-2 border-[#333] bg-white"
                                            style={{ fontSize: "5dvmin" }}
                                            placeholder={t("ニックネームを入力してください")}
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <button onClick={handleUpdateName} className="miniBtn px-4 py-2 font-bold shrink-0" style={{ fontSize: "4dvmin" }}>
                                            {user.id === "guest" ? t("スタート") : t("更新する")}
                                        </button>
                                    </div>
                                </div>
                                {user.id !== "guest" && (
                                    <button className="miniBtn w-full font-bold text-white bg-red-600 hover:bg-red-700 transition-colors border-red-800" style={{ padding: "2dvmin", fontSize: "5dvmin", marginTop: "2dvmin" }} onClick={handleDeleteData}>
                                        {t("データ削除")}
                                    </button>
                                )}
                            </div>
                        </SettingsSection>
                    )}
                    <SettingsSection title={t("オーディオ")}>
                        <button onClick={() => setBgm(!bgm, "/menu.mp3")} className="flex items-center cursor-pointer hover:bg-black/10 p-2 rounded -mx-2 w-full text-left gap-2">
                            {bgm ? <VolumeSvg /> : <MuteSvg />}
                            <span style={{ fontSize: "5dvmin" }}>{t("音楽")}</span>
                        </button>
                        <button onClick={() => setSfx(!sfx)} className="flex items-center cursor-pointer hover:bg-black/10 p-2 rounded -mx-2 w-full text-left gap-2">
                            {sfx ? <VolumeSvg /> : <MuteSvg />}
                            <span style={{ fontSize: "5dvmin" }}>{t("効果音")}</span>
                        </button>
                    </SettingsSection>
                    <SettingsSection title={t("言語")}>
                        <div className="flex flex-col gap-2">
                            {[
                                ["ja", "日本語"],
                                ["us", "English(US)"],
                                ["gb", "English(UK)"],
                                ["cn", "中文（简体字）"],
                                ["tw", "中文（繁體字）"],
                            ].map((l) => (
                                <Checkbox key={l[0]} id={l[0]} checked={l[0] === lang} onChange={() => setLang(l[0] as Language)} className="flex items-center cursor-pointer hover:bg-black/10 p-2 rounded -mx-2">
                                    <span style={{ fontSize: "5dvmin" }}>{l[1]}</span>
                                </Checkbox>
                            ))}
                        </div>
                    </SettingsSection>
                    <SettingsSection title={t("表示")}>
                        <Checkbox id={"makinas"} checked={font} onChange={() => setFont(!font)} className="flex items-center cursor-pointer hover:bg-black/10 p-2 rounded -mx-2">
                            <span style={{ fontSize: "5dvmin" }}>{t("フォント")}</span>
                        </Checkbox>
                    </SettingsSection>
                </div>
            </div>
        </div>
    );
}
