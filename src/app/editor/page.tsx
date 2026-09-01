"use client";

import { useSettings, useStage } from "@/app/context";
import { StageType } from "@/constants";
import Link from "next/link";
import { useEffect } from "react";
import { LeftSvg, PlayButton } from "../components";
import { playBgm } from "@/game/base";
import { TranslatableString, translate } from "../translate";

export default function MyLobby() {
    const { stages } = useStage();
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    useEffect(() => {
        playBgm("/menu.mp3");
    }, []);

    return (
        <main className="editor-layout text-center">
            <div className="[grid-area:header] flex justify-between items-center px-[2dvmin]">
                <Link className="btn back w-[18dvmin] h-full" href={"/"}>
                    <LeftSvg />
                </Link>
            </div>

            <div className="[grid-area:title] flex justify-center items-center">
                <h1 className="text-[length:10dvmin]">{t("マイステージ")}</h1>
            </div>

            <div className="[grid-area:list] bg-[#333] overflow-y-auto py-[2dvmin]">
                <div className="flex flex-col items-center gap-[2dvmin]">
                    {stages.length === 0 ? (
                        <div className="text-[length:4dvmin] text-gray-400 py-8">No stages</div>
                    ) : (
                        stages.map((stage: StageType) => (
                            <div key={stage.id} className="w-[90%] max-w-200 bg-[#4a4a4a] p-[2dvmin] border-[3px] border-[#222] text-left">
                                <div className="flex justify-between items-center mb-[1.5dvmin]">
                                    <div className="text-[length:3dvmin]">
                                        <h2 className="text-[length:5dvmin] font-semibold">{stage.title}</h2>
                                    </div>
                                    <div className="flex flex-row gap-2">
                                        <PlayButton i={stage.id} isCompleted={false} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
