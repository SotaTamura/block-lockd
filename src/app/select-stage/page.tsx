"use client";

import { STAGE_LEN } from "@/constants";
import { useAuth } from "@/app/context";
import Link from "next/link";
import { LeftSvg, StageButton } from "../components";

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
                    {process.env.NODE_ENV === "development" && <StageButton i={0} key={0} isCompleted={user?.completedStageIds.includes(0) || false} />}
                    {Array.from({ length: STAGE_LEN }, (_, k) => (
                        <StageButton i={k + 1} key={k + 1} isCompleted={user?.completedStageIds.includes(k + 1) || false} />
                    ))}
                </div>
            </div>
        </div>
    );
}
