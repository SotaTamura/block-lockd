"use client";

import { useAuth, usePopup, useSettings, useStage } from "@/app/context";
import { StageType } from "@/constants";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeftSvg, PencilSvg, PlayButton } from "../components";
import { playBgm } from "@/game/base";
import { TranslatableString, translate } from "../translate";

export default function MyLobby() {
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = usePopup();
    const { stages, setStages } = useStage();
    const [isLoading, setIsLoading] = useState(false);
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    useEffect(() => {
        playBgm("/menu.mp3");
        if (!user) {
            router.push("/");
        } else {
            (async () => {
                setIsLoading(true);
                try {
                    // project://src/app/api/stage/user/[id]/route.ts
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/user/${user.id}`, {
                        cache: "no-store",
                    });
                    if (!res.ok) setStages([]);
                    setStages(((await res.json()).stages || []).reverse());
                } catch (error) {
                    showAlert(String(error));
                    setStages([]);
                }
                setIsLoading(false);
            })();
        }
    }, [user, router, setStages, showAlert]);

    return (
        <main className="editor-layout text-center">
            <div className="[grid-area:header] flex justify-between items-center px-[2dvmin]">
                <Link className="btn back w-[18dvmin] h-full" href={"/"}>
                    <LeftSvg />
                </Link>
            </div>

            <div className="[grid-area:title] flex justify-center items-center">
                <h1 className="text-[length:10dvmin]">{t("マイステージ")}</h1>
            </div>

            <div className="[grid-area:new-link] flex justify-center items-center">
                <Link href={"/editor/add"} className="completedBtn w-[10dvmin] h-[10dvmin]">
                    <div className="text-[length:8dvmin] leading-[8dvmin]">+</div>
                </Link>
            </div>

            <div className="[grid-area:list] bg-[#333] overflow-y-auto py-[2dvmin]">
                <div className="flex flex-col items-center gap-[2dvmin]">
                    {isLoading ? (
                        <div className="text-[length:5dvmin]">Loading...</div>
                    ) : (
                        stages.map((stage: StageType) => (
                            <div key={stage.id} className="w-[90%] max-w-200 bg-[#4a4a4a] p-[2dvmin] border-[3px] border-[#222] text-left">
                                <div className="flex justify-between items-center mb-[1.5dvmin]">
                                    <div className="text-[length:3dvmin]">
                                        <h2 className="text-[length:5dvmin] font-semibold">{stage.title}</h2>
                                    </div>
                                    <div className="flex flex-row gap-2">
                                        <Link href={`/editor/edit/${stage.id}`} className="btn text-[length:3dvmin] py-[1dvmin] px-[2dvmin] border-[3px]">
                                            <PencilSvg />
                                        </Link>
                                        <PlayButton i={stage.id} isCompleted={user?.completedOnlineStageIds.includes(stage.id) || false} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
