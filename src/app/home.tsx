"use client";

import { useSettings } from "@/app/context";
import Link from "next/link";
import { WrenchSvg, RightSvg, WorldSvg, GearSvg } from "./components";
import { TranslatableString, translate } from "./translate";
import Image from "next/image";

export default function Home() {
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    return (
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
    );
}
