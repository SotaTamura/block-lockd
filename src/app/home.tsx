"use client";

import { useAuth, usePopup, useSettings } from "@/app/context";
import Link from "next/link";
import { WrenchSvg, RightSvg, WorldSvg, GearSvg } from "./components";
import { useEffect, useState, useRef } from "react";
import { TranslatableString, translate } from "./translate";
import Image from "next/image";

export default function Home({ id }: { id: string | undefined }) {
    const { user, loginBySession, signinBySession, setGuest } = useAuth();
    const { showAlert } = usePopup();
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
            if (localStorage.getItem("guest") === "1") {
                if (!user || user.id !== "guest") {
                    setGuest();
                }
                setIsLoading(false);
                return;
            }
            if (id && (!user || user.id !== id)) {
                await loginBySession(id);
            }
            setIsLoading(false);
        })();
    }, [id, loginBySession, user, setGuest]);

    const handleStart = async () => {
        if (!name) showAlert(t("ニックネームを入力してください"));
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
            <div className="flex flex-col items-center justify-center h-full overflow-y-auto gap-8 relative">
                <div
                    className="bg-[#aaa] bg-opacity-75 border-[#333] flex flex-col gap-6 p-8"
                    style={{
                        borderWidth: "1vmin",
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
                <Link href="/terms" className="absolute bottom-4 text-gray-600 underline text-sm hover:text-gray-800 transition-colors">
                    {t("利用規約")}
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-y-auto pb-10 relative">
                <div className="bg-amber-400 text-xl font-bold border-4 border-double border-black text-center p-10">
                    <div className="text-black">Unityに移行しました！</div>
                    <div>
                        <a className="text-blue-500 underline" href="https://unityroom.com/games/block-lockd">
                            https://unityroom.com/games/block-lockd
                        </a>
                    </div>
                    <div className="text-black">
                        X:{" "}
                        <a className="text-blue-500 underline" href="https://x.com/appleS000da2">
                            https://x.com/appleS000da2
                        </a>
                    </div>
                </div>
                <div className="loginBtn">
                    <p>{user?.name || t("ゲスト")}</p>
                </div>
                <Image src={"/logo.png"} className="mt-[20vh] h-[24vmin] m-auto" alt="logo" width={500} height={500} style={{ width: "auto", imageRendering: "pixelated" }} unoptimized />
                <div className="grid grid-cols-2 gap-2 w-[50vmin] h-[50vmin] m-auto mt-[8vh]">
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
                        <div
                            onClick={() => {
                                showAlert(t("ステージを作成するには、「設定」からニックネームを入力してください。"));
                            }}
                            className="btn home-btn flex flex-col items-center w-full h-full py-2 cursor-pointer">
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
                <div className="flex justify-center w-full mt-20 gap-7">
                    <Link href="/terms" className="text-gray-300 underline">
                        {t("利用規約")}
                    </Link>
                    <Link href="/credits" className="text-gray-300 underline">
                        {t("クレジット")}
                    </Link>
                </div>
            </div>
        </>
    );
}
