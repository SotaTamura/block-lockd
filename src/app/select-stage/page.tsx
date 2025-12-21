"use client";

import { useAuth } from "@/app/context";
import Link from "next/link";
import { LeftSvg, StageButton } from "../components";
import { STAGES } from "@/game/stages";

export default function SelectStage() {
    const { user } = useAuth();

    return (
        <div className="stageSelectScreen backGround">
            <Link className="btn back" href={"/"}>
                <LeftSvg />
            </Link>
            <div className="selectStageText text-[length:10dvmin]">ステージを選択</div>
            <div className="stageWrapperContainer">
                <div className="stageWrapper">
                    {Array.from({ length: Object.keys(STAGES).length }, (_, k) => (
                        <StageButton i={k + 1} key={k + 1} isCompleted={user?.completedStageIds.includes(k + 1) || false} />
                    ))}
                </div>
            </div>
        </div>
    );
}
