"use client";

import { RightSvg, LeftSvg, Loading } from "@/app/components";
import { useStage } from "@/app/context";
import { StageType } from "@/constants";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function Overview({ params }: { params: Promise<{ id: number }> }) {
    const id = Number(use(params).id);
    const [stage, setStage] = useState<StageType | null>(null);
    const { getStageById } = useStage();

    useEffect(() => {
        const stageFromContext = getStageById(id);
        if (stageFromContext) setStage(stageFromContext);
    }, [id, getStageById]);

    return (
        <main className="text-center">
            {!stage && <Loading />}
            <div className="[grid-area:header] flex justify-between items-center px-[2dvmin]">
                <Link href={"/select-online-stage"} className="btn back w-[18dvmin] h-[12dvmin]">
                    <LeftSvg />
                </Link>
            </div>
            <div className="[grid-area:title] flex justify-center items-center">
                <h1 className="text-[length:10dvmin]">{stage?.title}</h1>
            </div>
            <h2 className="text-[length:5dvmin] font-semibold mb-[1.5dvmin]">
                <span className="text-[#ddd] m-[2dvmin] text-[length:5dvmin]">by: {stage?.creatorName}</span>
            </h2>
            <div className="text-[length:5dvmin]">
                <p className="text-[#ccc] mb-[1dvmin]">作成：{stage?.createdAt ? new Date(stage.createdAt).toLocaleDateString() : ""}</p>
                <p className="text-[#ccc] mb-[1dvmin]">更新：{stage?.updatedAt ? new Date(stage.updatedAt).toLocaleDateString() : ""}</p>
                <p>{stage?.description}</p>
            </div>
            <div className="flex justify-center mt-[10dvmin]">
                <Link href={`/online-stage/${id}/play`} className="btn w-[24dvmin] h-[18dvmin]">
                    <RightSvg />
                </Link>
            </div>
        </main>
    );
}
