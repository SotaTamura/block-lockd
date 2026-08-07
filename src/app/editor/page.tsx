"use client";

import { useAuth, usePopup, useSettings, useStage } from "@/app/context";
import { StageType } from "@/constants";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LeftSvg, MagnifyingGlassSvg, PlayButton } from "../components";
import { playBgm } from "@/game/base";
import { TranslatableString, translate } from "../translate";

const PAGE_SIZE = 10;

export default function MyLobby() {
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = usePopup();
    const { stages, setStages } = useStage();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [searchedQuery, setSearchedQuery] = useState("");
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    const fetchStages = useCallback(
        async (userId: string, nextOffset: number, append: boolean, query: string) => {
            // project://src/app/api/stage/user/[id]/route.ts
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(nextOffset),
            });
            if (query) params.set("query", query);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/user/${userId}?${params.toString()}`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Failed to fetch stages.");
            const data = await res.json();
            const fetchedStages = data.stages || [];
            setStages((prev) => (append ? [...prev, ...fetchedStages] : fetchedStages));
            setOffset(nextOffset + fetchedStages.length);
            setHasMore(Boolean(data.hasMore));
        },
        [setStages],
    );

    useEffect(() => {
        playBgm("/menu.mp3");
        if (!user) {
            router.push("/");
        } else {
            (async () => {
                setIsLoading(true);
                try {
                    setOffset(0);
                    setHasMore(true);
                    await fetchStages(user.id, 0, false, "");
                } catch (error) {
                    showAlert(String(error));
                    setStages([]);
                    setHasMore(false);
                }
                setIsLoading(false);
            })();
        }
    }, [fetchStages, user, router, setStages, showAlert]);

    const handleLoadMore = async () => {
        if (!user || isLoading || isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            await fetchStages(user.id, offset, true, searchedQuery);
        } catch (error) {
            showAlert(String(error));
        }
        setIsLoadingMore(false);
    };

    const handleSearch = async () => {
        if (!user || isLoading || isLoadingMore) return;
        const query = searchInput.trim();
        setSearchedQuery(query);
        setIsLoading(true);
        try {
            setOffset(0);
            setHasMore(true);
            await fetchStages(user.id, 0, false, query);
        } catch (error) {
            showAlert(String(error));
            setStages([]);
            setHasMore(false);
        }
        setIsLoading(false);
    };

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

            <div className="[grid-area:new-link] flex flex-col justify-center px-4">
                <div className="w-svw flex justify-center items-center gap-2">
                    <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-[70%] max-w-120 px-4 py-2 bg-white text-black border-2 border-gray-600 focus:outline-none focus:border-gray-500 text-[16px]" />
                    <button onClick={handleSearch} disabled={isLoading || isLoadingMore} className="btn w-[20%] max-w-50 h-12 text-black text-2xl">
                        <MagnifyingGlassSvg />
                    </button>
                </div>
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
                                        <PlayButton i={stage.id} isCompleted={user?.completedOnlineStageIds.includes(stage.id) || false} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {!isLoading && hasMore && (
                        <button disabled={isLoadingMore} onClick={handleLoadMore} className="btn w-[40%] h-[12dvmin] text-[length:5dvmin] text-black">
                            {isLoadingMore ? "Loading..." : t("さらに読み込む")}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
