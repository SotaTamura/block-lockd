"use client";

import { useAuth } from "@/app/context";
import { deleteStage, getStage, putStage, throwError } from "@/app/fetch";
import { StageType } from "@/constants";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useRef, useState } from "react";

export default function EditStage({ params }: { params: Promise<{ id: number }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const titleRef = useRef<HTMLInputElement | null>(null);
    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const codeRef = useRef<HTMLTextAreaElement | null>(null);
    const [stage, setStage] = useState<StageType | null>(null);

    const handleSubmit = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!stage) return;
        if (!codeRef.current?.value) {
            window.alert("ステージに何も設置されていません。");
        } else {
            putStage({ ...stage, title: titleRef.current?.value || "無題", description: descriptionRef.current?.value || "", code: codeRef.current.value });
            router.push("/editor");
            router.refresh();
        }
    };
    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (user && window.confirm("本当にこのステージを削除しますか？")) {
            const res = await deleteStage(id);
            if (res.ok) {
                window.alert("ステージを削除しました。");
                router.push("/editor");
                router.refresh();
            } else {
                const data = await res.json();
                window.alert(data.message);
            }
        }
    };
    useEffect(() => {
        if (!user) {
            router.push("/auth/login");
            router.refresh();
        } else {
            (async () => {
                try {
                    const stageData = await getStage(id);
                    if (stageData && stageData.creatorId !== user.id) {
                        router.push("/auth/login");
                        router.refresh();
                    }
                    setStage(stageData);
                    if (titleRef.current && descriptionRef.current && codeRef.current && stageData) {
                        titleRef.current.value = stageData.title;
                        descriptionRef.current.value = stageData.description;
                        codeRef.current.value = stageData.code;
                    }
                } catch (err) {
                    throwError(err);
                }
            })();
        }
    }, [id]);

    return (
        <>
            <div className="w-full m-auto flex my-4">
                <div className="flex flex-col justify-center items-center m-auto">
                    <p className="text-2xl font-bold p-3">編集</p>
                    <form>
                        <input ref={titleRef} placeholder="タイトルを入力" type="text" className="rounded-md px-4 w-full py-2 my-2" />
                        <textarea ref={descriptionRef} placeholder="記事詳細を入力" className="rounded-md px-4 py-2 w-full my-2"></textarea>
                        <textarea ref={codeRef} placeholder="コードを入力" className="rounded-md px-4 py-2 w-full my-2"></textarea>
                        <button onClick={handleSubmit} className="font-semibold px-4 py-2 shadow-xl bg-slate-200 rounded-lg m-auto hover:bg-slate-100">
                            更新
                        </button>
                        <button onClick={handleDelete} className="ml-2 font-semibold px-4 py-2 shadow-xl bg-red-400 rounded-lg m-auto hover:bg-slate-100">
                            削除
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
