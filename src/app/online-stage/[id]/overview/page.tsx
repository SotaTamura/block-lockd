"use client";

import { RightSvg, LeftSvg, Loading } from "@/app/components";
import { getStage, throwError } from "@/app/fetch";
import { StageType } from "@/constants";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function Overview({ params }: { params: Promise<{ id: number }> }) {
    const { id } = use(params);
    const [stage, setStage] = useState<StageType | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setStage(await getStage(id));
            } catch (err) {
                throwError(err);
            }
        })();
    }, [id]);

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
