"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Checkbox, LeftSvg, PlayButton } from "../components";
import { useAuth, useSettings, useStage } from "../context";
import { playBgm } from "@/game/base";
import { TranslatableString, translate } from "../translate";

export default function Lobby() {
    const { user } = useAuth();
    const { stages, setStages } = useStage();
    const [isLoading, setIsLoading] = useState(false);
    const [isShowOnlyCompleted, setIsShowOnlyCompleted] = useState(false);
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    useEffect(() => {
        playBgm(`/menu.mp3`);
        (async () => {
            setIsLoading(true);
            try {
                // project://src/app/api/stage/route.ts
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage`, {
                    cache: "no-store",
                });
                if (!res.ok) setStages([]);
                setStages(((await res.json()).stages || []).reverse());
            } catch (error) {
                alert(error);
                setStages([]);
            }
            setIsLoading(false);
        })();
    }, [setStages]);

    return (
        <main className="editor-layout text-center">
            <div className="[grid-area:header] flex justify-between items-center px-[2dvmin]">
                <Link href={"/"} className="btn back w-[18dvmin] h-[12dvmin]">
                    <LeftSvg />
                </Link>
            </div>
            <div className="[grid-area:title] flex justify-center items-center">
                <h1 className="text-[length:10dvmin]">{t("オンラインステージ")}</h1>
            </div>
            {user && (
                <div className="w-svw text-right">
                    <Checkbox id="showCompleted" checked={isShowOnlyCompleted} onChange={() => setIsShowOnlyCompleted(!isShowOnlyCompleted)} children={<span>{t("クリア済ステージのみ表示")}</span>} />
                </div>
            )}
            <div className="[grid-area:list] bg-[#333] overflow-y-auto py-[2dvmin]">
                <div className="flex flex-col items-center gap-[2dvmin]">
                    {isLoading ? (
                        <div className="text-[length:5dvmin]">Loading...</div>
                    ) : (
                        (isShowOnlyCompleted ? stages.filter((s) => user?.completedOnlineStageIds.includes(s.id)) : stages).map((stage) => (
                            <div key={stage.id} className="w-[90%] max-w-200 bg-[#4a4a4a] p-[2dvmin] border-[3px] border-[#222] text-left">
                                <div className="flex justify-between items-center mb-[1.5dvmin]">
                                    <h2 className="text-[length:5dvmin] font-semibold">
                                        <span>{stage.title}</span>
                                        <span className="text-[#ddd] m-[2dvmin] text-[length:3dvmin]">by: {stage.creatorName}</span>
                                    </h2>
                                    <PlayButton i={stage.id} isCompleted={user?.completedOnlineStageIds.includes(stage.id) || false} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
