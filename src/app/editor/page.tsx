"use client";

import { useAuth } from "@/app/context";
import { StageType } from "@/constants";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getStagesByUser } from "../fetch";
import { useRouter } from "next/navigation";
import { LeftSvg, Loading, PencilSvg, PlayButton } from "../components";

export default function MyLobby() {
    const router = useRouter();
    const { user } = useAuth();
    const [stages, setStages] = useState<StageType[]>([]);

    useEffect(() => {
        if (!user) {
            router.push("/auth/login");
            router.refresh();
        } else {
            (async () => {
                setStages(await getStagesByUser(user.id));
            })();
        }
    }, [user, router]);

    return (
        <main className="editor-layout text-center">
            {!stages.length && <Loading />}
            <div className="[grid-area:header] flex justify-between items-center px-[2dvmin]">
                <Link href={"/"} className="btn back w-[18dvmin] h-full">
                    <LeftSvg />
                </Link>
            </div>

            <div className="[grid-area:title] flex justify-center items-center">
                <h1 className="text-[length:10dvmin]">マイステージ</h1>
            </div>

            <div className="[grid-area:new-link] flex justify-center items-center">
                <Link href={"/editor/add"} className="completedBtn w-[10dvmin] h-[10dvmin]">
                    <div className="text-[length:8dvmin] leading-[8dvmin]">+</div>
                </Link>
            </div>

            <div className="[grid-area:list] bg-[#333] overflow-y-auto py-[2dvmin]">
                <div className="flex flex-col items-center gap-[2dvmin]">
                    {stages.map((stage: StageType) => (
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
                    ))}
                </div>
            </div>
        </main>
    );
}
