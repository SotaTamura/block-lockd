"use client";

import { StageType } from "@/constants";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAllStages } from "../fetch";
import { LeftSvg, PlayButton } from "../components";
import { useAuth } from "../context";

export default function Lobby() {
    const { user } = useAuth();
    const [stages, setStages] = useState<StageType[]>([]);

    useEffect(() => {
        (async () => {
            setStages(await getAllStages());
        })();
    }, []);

    return (
        <main className="backGround editor-layout text-center">
            <div className="[grid-area:header] flex justify-between items-center px-[2dvmin]">
                <Link href={"/"} className="btn back w-[18dvmin] h-[12dvmin]">
                    <LeftSvg />
                </Link>
            </div>

            <div className="[grid-area:title] flex justify-center items-center">
                <h1 className="text-[length:10dvmin]">オンラインステージ</h1>
            </div>

            <div className="[grid-area:list] bg-[#333] overflow-y-auto py-[2dvmin]">
                <div className="flex flex-col items-center gap-[2dvmin]">
                    {stages.map((stage: StageType) => (
                        <div key={stage.id} className="w-[90%] max-w-200 bg-[#4a4a4a] p-[2dvmin] border-[3px] border-[#222] text-left">
                            <div className="flex justify-between items-center mb-[1.5dvmin]">
                                <h2 className="text-[length:5dvmin] font-semibold">
                                    <span>{stage.title}</span>
                                    <span className="text-[#ddd] m-[2dvmin] text-[length:3dvmin]">by: {stage.creatorName}</span>
                                </h2>
                                <PlayButton i={stage.id} isCompleted={user?.completedOnlineStageIds.includes(stage.id) || false} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
