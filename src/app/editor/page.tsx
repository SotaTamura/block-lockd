"use client";

import { useAuth } from "@/app/context";
import { StageType } from "@/constants";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getStagesByUser } from "../fetch";
import { useRouter } from "next/navigation";

export default function MyLobby() {
    const router = useRouter();
    const { user, logout } = useAuth();
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
    }, [user]);

    return (
        <main className="w-full h-full">
            {user ? (
                <div className="text-right my-5">
                    <p className="text-lg font-semibold">こんにちは、{user.name}さん</p>
                    <button onClick={logout} className="mt-2 md:w-1/6 sm:w-2/4 text-center rounded-md p-2 m-auto bg-red-500 text-white font-semibold">
                        ログアウト
                    </button>
                </div>
            ) : null}
            <div className="flex my-5">
                <Link href={"/"} className="w-20 text-center rounded-md p-2 m-auto bg-slate-300 font-semibold">
                    戻る
                </Link>
            </div>
            <div className="flex my-5">
                <Link href={"/editor/add"} className=" md:w-1/6 sm:w-2/4 text-center rounded-md p-2 m-auto bg-slate-300 font-semibold">
                    ブログ新規作成
                </Link>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
                {stages.map((stage: StageType) => (
                    <div key={stage.id} className="w-3/4 p-4 rounded-md mx-3 my-2 bg-slate-300 flex flex-col justify-center">
                        <div className="flex items-center my-3">
                            <div className="mr-auto">
                                <h2 className="mr-auto font-semibold">{stage.title}</h2>
                            </div>
                            <Link href={`/editor/edit/${stage.id}`} className="px-4 py-1 text-center text-xl bg-slate-900 rounded-md font-semibold text-slate-200">
                                編集
                            </Link>
                        </div>

                        <div className="mr-auto my-1">
                            <blockquote className="font-bold text-slate-700">{new Date(stage.date).toDateString()}</blockquote>
                        </div>

                        <div className="mr-auto my-1">
                            <h2>{stage.description}</h2>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
