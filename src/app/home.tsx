"use client";

import { useAuth, useSettings } from "@/app/context";
import Link from "next/link";
import { WrenchSvg, RightSvg, WorldSvg, GearSvg } from "./components";
import { useEffect, useState, useRef } from "react";
import { TranslatableString, translate } from "./translate";

export default function Home({ id }: { id: string | undefined }) {
    const { user, loginBySession, signinBySession, setGuest } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [name, setName] = useState("");
    const isLoginProcessing = useRef(false);
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    useEffect(() => {
        (async () => {
            if (isLoginProcessing.current) return;
            if (id && (!user || user.id !== id)) {
                await loginBySession(id);
            }
            setIsLoading(false);
        })();
    }, [id, loginBySession]);

    const handleStart = async () => {
        if (!name) alert(t("ニックネームを入力してください"));
        else {
            isLoginProcessing.current = true;
            setIsLoading(true);
            await signinBySession(name);
            isLoginProcessing.current = false;
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="loginBtn">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh gap-8">
                <div
                    className="bg-[#aaa] bg-opacity-75 border-[#333] flex flex-col gap-6 p-8"
                    style={{
                        borderWidth: "1dvmin",
                        width: "min(90vw, 400px)",
                    }}>
                    <input
                        type="text"
                        className="px-4 py-3 text-black rounded border-2 border-[#333] bg-white text-xl w-full text-center"
                        placeholder={t("ニックネームを入力してください")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    />
                    <div onClick={handleStart} className="btn home-btn py-3 text-2xl text-black font-bold cursor-pointer">
                        {t("スタート")}
                    </div>
                    <div onClick={setGuest} className="btn home-btn py-3 text-2xl text-black font-bold cursor-pointer">
                        {t("スキップ")}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="loginBtn">
                <p>{user?.name || t("ゲスト")}</p>
            </div>
            <img src={"/logo.png"} className="mt-[20dvh] h-[24dvmin] m-auto" />
            <div className="grid grid-cols-2 gap-2 w-[50dvmin] h-[50dvmin] m-auto mt-[8dvh]">
                <Link className="btn home-btn flex flex-col items-center w-full h-full py-2" href={"/select-stage"}>
                    <div className="grow flex items-center justify-center w-full">
                        <div className="w-[70%] h-[70%] flex justify-center items-center">
                            <RightSvg />
                        </div>
                    </div>
                    <div className="whitespace-nowrap mb-1 text-black" style={{ fontSize: "3.5dvmin" }}>
                        {t("プレイ")}
                    </div>
                </Link>
                <Link className="btn home-btn flex flex-col items-center w-full h-full py-2" href={"/settings"}>
                    <div className="grow flex items-center justify-center w-full">
                        <div className="w-[70%] h-[70%] flex justify-center items-center">
                            <GearSvg />
                        </div>
                    </div>
                    <div className="whitespace-nowrap mb-1 text-black" style={{ fontSize: "3.5dvmin" }}>
                        {t("設定")}
                    </div>
                </Link>
                {user.id === "guest" ? (
                    <div className="btn home-btn flex flex-col items-center w-full h-full py-2 opacity-50 cursor-not-allowed">
                        <div className="grow flex items-center justify-center w-full">
                            <div className="w-[70%] h-[70%] flex justify-center items-center">
                                <WrenchSvg />
                            </div>
                        </div>
                        <div className="whitespace-nowrap mb-1 text-black" style={{ fontSize: "3.5dvmin" }}>
                            {t("作成する")}
                        </div>
                    </div>
                ) : (
                    <Link href={"/editor"} className="btn home-btn flex flex-col items-center w-full h-full py-2">
                        <div className="grow flex items-center justify-center w-full">
                            <div className="w-[70%] h-[70%] flex justify-center items-center">
                                <WrenchSvg />
                            </div>
                        </div>
                        <div className="whitespace-nowrap mb-1 text-black" style={{ fontSize: "3.5dvmin" }}>
                            {t("作成する")}
                        </div>
                    </Link>
                )}
                <Link href={"/select-online-stage"} className="btn home-btn flex flex-col items-center w-full h-full py-2">
                    <div className="grow flex items-center justify-center w-full">
                        <div className="w-[70%] h-[70%] flex justify-center items-center">
                            <WorldSvg />
                        </div>
                    </div>
                    <div className="whitespace-nowrap mb-1 text-black" style={{ fontSize: "3.5dvmin" }}>
                        {t("オンライン")}
                    </div>
                </Link>
            </div>
        </div>
    );
}
