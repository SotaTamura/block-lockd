"use client";

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
        <div className="w-full m-auto flex my-4">
            <Link href={"/online-stages"} className="w-20 text-center rounded-md p-2 m-auto bg-slate-300 font-semibold">
                戻る
            </Link>
            <div className="flex flex-col justify-center items-center m-auto">
                <div>{stage?.title}</div>
                <div>{stage?.creatorName}</div>
                <div>{stage?.description}</div>
                <div>{stage?.code}</div>
            </div>
        </div>
    );
}
