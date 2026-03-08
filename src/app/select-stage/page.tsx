"use client";

import { useAuth, useSettings } from "@/app/context";
import Link from "next/link";
import { LeftSvg } from "../components";
import { STAGES } from "@/game/stages";
import { useEffect, useRef } from "react";
import { playBgm } from "@/game/base";
import { TranslatableString, translate } from "../translate";

function StageButton({ i, isCompleted, title, difficulty }: { i: number; isCompleted: boolean; title: string; difficulty: number }) {
    return (
        <Link href={`/play/${i}`} className={`btn w-[80svmin] max-w-150 h-[14svmin] m-[1%] flex items-stretch p-0 gap-0 justify-start overflow-hidden touch-pan-y ${isCompleted ? "completedBtn" : ""}`}>
            <div className={`text-[length:8svmin] font-bold text-white min-w-[18svmin] max-w-[18svmin] shrink-0 flex items-center justify-center static top-auto left-auto right-auto ${isCompleted ? "bg-[#060]" : "bg-[#666]"}`}>{i}</div>
            <div className="grow flex flex-col justify-center items-start px-5 gap-2">
                <div className={`text-[length:4.5svmin] text-left overflow-hidden text-ellipsis whitespace-nowrap w-full leading-tight ${isCompleted ? "text-white" : "text-[#4b4b4b]"}`}>{title}</div>
                <div className="text-[length:3.5svmin] text-left leading-tight">
                    {Array.from({ length: difficulty }, (_, k) => (
                        <span key={k} className={isCompleted ? "text-white" : "text-[#888]"}>
                            ★
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
}

export default function SelectStage() {
    const { user } = useAuth();
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);
    const stageWrapperRef = useRef<HTMLDivElement>(null);
    const stageButtonRefs = useRef<{ [key: number]: HTMLAnchorElement | null }>({});

    useEffect(() => {
        playBgm("/menu.mp3");
    }, []);

    const totalStages = Object.keys(STAGES).length;
    const rangeSize = 10;
    const ranges = Array.from({ length: Math.ceil(totalStages / rangeSize) }, (_, i) => {
        const start = i * rangeSize + 1;
        const end = Math.min((i + 1) * rangeSize, totalStages);
        const stagesInRange = Array.from({ length: end - start + 1 }, (_, j) => start + j);
        const completedInRange = stagesInRange.filter((stageId) => user?.completedStageIds.includes(stageId)).length;
        const completionRate = (completedInRange / stagesInRange.length) * 100;
        return { start, end, label: `${start}~${end}`, completionRate, completedInRange, total: stagesInRange.length };
    });

    const scrollToStage = (stageNumber: number) => {
        const buttonElement = stageButtonRefs.current[stageNumber];
        if (buttonElement && stageWrapperRef.current) {
            const container = stageWrapperRef.current;
            const button = buttonElement;
            const containerRect = container.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();

            // Calculate the position to scroll to center the button
            const scrollTop = container.scrollTop + buttonRect.top - containerRect.top;

            container.scrollTo({
                top: scrollTop,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="stageSelectScreen backGround">
            <Link className="btn back" href={"/"}>
                <LeftSvg />
            </Link>
            <div className="selectStageText text-[length:10dvmin]">{t("ステージを選択")}</div>
            <div className="m-auto jump w-4/5 overflow-x-auto overflow-y-hidden px-4 bg-gray-500/50 h-fit border-4 border-double" style={{ scrollbarWidth: "thin" }}>
                <div className="flex gap-2 min-w-max justify-center py-2">
                    {ranges.map((range) => (
                        <button
                            key={range.start}
                            onClick={() => scrollToStage(range.start)}
                            className="w-[20svmin] btn px-[2svmin] text-[length:3.5svmin] whitespace-nowrap bg-[#444] hover:bg-[#555] transition-colors flex flex-col items-center gap-[1svmin] touch-pan-x">
                            <span className="text-[#333]">{range.label}</span>
                            <div className="w-full h-1.5 bg-[#222] overflow-hidden">
                                <div className="h-full bg-linear-to-r from-green-500 to-green-400 transition-all duration-300" style={{ width: `${range.completionRate}%` }} />
                            </div>
                            <span className="text-[length:2.5svmin] opacity-80 text-[#333]">
                                {range.completedInRange}/{range.total}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="stageWrapperContainer" ref={stageWrapperRef}>
                <div className="stageWrapper">
                    {Array.from({ length: totalStages }, (_, k) => (
                        <div
                            key={k + 1}
                            ref={(el) => {
                                if (el) stageButtonRefs.current[k + 1] = el.firstChild as HTMLAnchorElement;
                            }}>
                            <StageButton i={k + 1} isCompleted={user?.completedStageIds.includes(k + 1) || false} title={t(STAGES[k + 1].title as TranslatableString)} difficulty={STAGES[k + 1].difficulty} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
