"use client";

import { useAuth, useSettings } from "@/app/context";
import Link from "next/link";
import { WrenchSvg, RightSvg, WorldSvg, GearSvg } from "./components";
import { useEffect, useState } from "react";
import { TranslatableString, translate } from "./translate";

export default function Home({ id }: { id: string | undefined }) {
    const { user, loginBySession, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    useEffect(() => {
        (async () => {
            if (id && (!user || user.id !== id)) {
                await loginBySession(id);
            }
            setIsLoading(false);
        })();
    }, [id, loginBySession]);

    return (
        <div>
            {isLoading ? (
                <div className="loginBtn">Loading...</div>
            ) : user ? (
                <div className="loginBtn">
                    <p>{user.name}</p>
                    <div onClick={logout} className="miniBtn">
                        {t("ログアウト")}
                    </div>
                </div>
            ) : (
                <div className="flex my-5">
                    <Link href={"/auth/login"} className="miniBtn loginBtn">
                        {t("ログイン")}
                    </Link>
                </div>
            )}
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
                <Link href={user ? "/editor" : "/auth/login"} className="btn home-btn flex flex-col items-center w-full h-full py-2">
                    <div className="grow flex items-center justify-center w-full">
                        <div className="w-[70%] h-[70%] flex justify-center items-center">
                            <WrenchSvg />
                        </div>
                    </div>
                    <div className="whitespace-nowrap mb-1 text-black" style={{ fontSize: "3.5dvmin" }}>
                        {t("作成")}
                    </div>
                </Link>
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
