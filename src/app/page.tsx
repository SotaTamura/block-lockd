"use client";

import { useSettings, usePopup } from "@/app/context";
import Link from "next/link";
import { WrenchSvg, RightSvg, WorldSvg, GearSvg } from "./components";
import { TranslatableString, translate } from "./translate";
import Image from "next/image";

export default function Home() {
    const {
        settings: { lang },
    } = useSettings();
    const { showConfirm } = usePopup();
    const t = (str: TranslatableString) => translate(str, lang);

    const showFullVersionPopup = () => {
        showConfirm(
            <div className="text-center">
                <p>{t("フル版へ移動しますか？(完全無料)")}</p>
            </div>,
            () => {
                window.location.href = "https://cube-escape.vercel.app";
            },
        );
    };

    return (
        <div className="h-full overflow-y-auto pb-10 relative">
            <button onClick={showFullVersionPopup} className="btn yellowBtn absolute top-4 right-4 px-4 py-2 font-bold text-black z-10" style={{ fontSize: "3.5dvmin" }}>
                {t("フル版へ移動 >>>")}
            </button>
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
                <button onClick={showFullVersionPopup} className="btn home-btn flex flex-col items-center w-full h-full py-2">
                    <div className="grow flex items-center justify-center w-full">
                        <div className="w-[70%] h-[70%] flex justify-center items-center">
                            <WrenchSvg />
                        </div>
                    </div>
                    <div className="whitespace-nowrap mb-1 text-black" style={{ fontSize: "3.5dvmin" }}>
                        {t("作成する")}
                    </div>
                </button>
                <button onClick={showFullVersionPopup} className="btn home-btn flex flex-col items-center w-full h-full py-2">
                    <div className="grow flex items-center justify-center w-full">
                        <div className="w-[70%] h-[70%] flex justify-center items-center">
                            <WorldSvg />
                        </div>
                    </div>
                    <div className="whitespace-nowrap mb-1 text-black" style={{ fontSize: "3.5dvmin" }}>
                        {t("オンライン")}
                    </div>
                </button>
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
