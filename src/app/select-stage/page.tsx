"use client";

import { useAuth, useSettings } from "@/app/context";
import Link from "next/link";
import { LeftSvg } from "../components";
import { STAGES } from "@/game/stages";
import { useEffect } from "react";
import { playBgm } from "@/game/base";
import { TranslatableString, translate } from "../translate";

function StageButton({ i, isCompleted }: { i: number; isCompleted: boolean }) {
    return (
        <Link href={`/play/${i}`} className={`btn stage ${isCompleted ? "completedBtn" : ""}`}>
            <div>{i}</div>
        </Link>
    );
}

export default function SelectStage() {
    const { user } = useAuth();
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    useEffect(() => {
        playBgm("/menu.mp3");
    }, []);

    return (
        <div className="stageSelectScreen backGround">
            <Link className="btn back" href={"/"}>
                <LeftSvg />
            </Link>
            <div className="selectStageText text-[length:10dvmin]">{t("ステージを選択")}</div>
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
