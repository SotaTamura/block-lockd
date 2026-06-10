"use client";

import { RightSvg, LeftSvg, Loading } from "@/app/components";
import { useSettings } from "@/app/context";
import { TranslatableString, translate } from "@/app/translate";
import { StageType, transformCode } from "@/constants";
import { playBgm } from "@/game/base";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function Overview({ params }: { params: Promise<{ id: number }> }) {
    const id = Number(use(params).id);
    const router = useRouter();
    const [stage, setStage] = useState<StageType | null>(null);
    const [transformedCode, setTransformedCode] = useState<string>("");
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    useEffect(() => {
        playBgm("/menu.mp3");
        const fetchStage = async () => {
            try {
                // project://src/app/api/stage/[id]/route.ts
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setStage(data.stage);
                    if (data.stage.code) {
                        const code = await transformCode(data.stage.code);
                        setTransformedCode(code);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch stage:", error);
            }
        };
        fetchStage();
    }, [id]);

    const handleCopy = () => {
        navigator.clipboard.writeText(transformedCode);
        alert(t("コピーしました"));
    };

    return (
        <main className="text-center">
            {!stage && <Loading />}
            <div className="[grid-area:header] flex justify-between items-center px-[2dvmin]">
                <div className="btn back w-[18dvmin] h-[12dvmin]" onClick={router.back}>
                    <LeftSvg />
                </div>
            </div>
            <div className="[grid-area:title] flex justify-center items-center">
                <h1 className="text-[length:10dvmin]">{stage?.title}</h1>
            </div>
            <h2 className="text-[length:5dvmin] font-semibold mb-[1.5dvmin]">
                <span className="text-[#ddd] m-[2dvmin] text-[length:5dvmin]">by: {stage?.creatorName}</span>
            </h2>
            <div className="text-[length:5dvmin]">
                <p className="text-[#ccc] mb-[1dvmin]">
                    {t("作成")}: {stage?.createdAt ? new Date(stage.createdAt).toLocaleDateString() : ""}
                </p>
                <p className="text-[#ccc] mb-[1dvmin]">
                    {t("更新")}: {stage?.updatedAt ? new Date(stage.updatedAt).toLocaleDateString() : ""}
                </p>
                <p className="whitespace-pre-wrap">{stage?.description}</p>
            </div>
            {transformedCode && (
                <>
                    <div className="text-2xl mt-20">{t("Unity用「おまじない」")}</div>
                    <div className="flex justify-center items-center gap-[2dvmin] mt-[4dvmin]">
                        <input className="bg-[#222] text-white px-[2dvmin] py-[1dvmin] rounded-[1dvmin] text-[length:3dvmin] w-[40dvmin] outline-none" value={transformedCode} readOnly />
                        <div className="btn w-[12dvmin] h-[8dvmin] text-[length:3dvmin] flex justify-center items-center text-black" onClick={handleCopy}>
                            Copy
                        </div>
                    </div>
                </>
            )}
            <div className="flex justify-center mt-[10dvmin]">
                <Link href={`/online-stage/${id}/play`} className="btn w-[24dvmin] h-[18dvmin]">
                    <RightSvg />
                </Link>
            </div>
        </main>
    );
}
