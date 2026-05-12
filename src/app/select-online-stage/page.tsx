"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox, LeftSvg, MagnifyingGlassSvg, PlayButton } from "../components";
import { useAuth, usePopup, useSettings, useStage } from "../context";
import { playBgm } from "@/game/base";
import { TranslatableString, translate } from "../translate";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

export default function Lobby() {
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
    const [isShowOnlyCompleted, setIsShowOnlyCompleted] = useState(false);
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    const fetchStages = useCallback(
        async (nextOffset: number, append: boolean, query: string) => {
            // project://src/app/api/stage/route.ts
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(nextOffset),
            });
            if (query) params.set("query", query);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage?${params.toString()}`);
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
        playBgm(`/menu.mp3`);
        (async () => {
            setIsLoading(true);
            try {
                setOffset(0);
                setHasMore(true);
                await fetchStages(0, false, "");
            } catch (error) {
                showAlert(String(error));
                setStages([]);
                setHasMore(false);
            }
            setIsLoading(false);
        })();
    }, [fetchStages, showAlert, setStages]);

    const handleLoadMore = async () => {
        if (isLoading || isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            await fetchStages(offset, true, searchedQuery);
        } catch (error) {
            showAlert(String(error));
        }
        setIsLoadingMore(false);
    };

    const handleSearch = async () => {
        if (isLoading || isLoadingMore) return;
        const query = searchInput.trim();
        setSearchedQuery(query);
        setIsLoading(true);
        try {
            setOffset(0);
            setHasMore(true);
            await fetchStages(0, false, query);
        } catch (error) {
            showAlert(String(error));
            setStages([]);
            setHasMore(false);
        }
        setIsLoading(false);
    };

    const displayedStages = isShowOnlyCompleted ? stages.filter((s) => user?.completedOnlineStageIds.includes(s.id)) : stages;

    return (
        <main className="editor-layout text-center">
            <div className="[grid-area:header] flex justify-between items-center px-[2dvmin]">
                <div className="btn back w-[18dvmin] h-[12dvmin]" onClick={router.back}>
                    <LeftSvg />
                </div>
            </div>
            <div className="[grid-area:title] flex justify-center items-center">
                <h1 className="text-[length:10dvmin]">{t("オンラインステージ")}</h1>
            </div>
            <div className="[grid-area:new-link] flex flex-col gap-2 px-4">
                <div className="w-svw flex justify-center items-center gap-2">
                    <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-[70%] max-w-120 px-4 py-2 bg-white text-black border-2 border-gray-600 focus:outline-none focus:border-gray-500 text-[16px]" />
                    <button onClick={handleSearch} disabled={isLoading || isLoadingMore} className="btn w-[20%] max-w-50 h-12 text-black text-2xl">
                        <MagnifyingGlassSvg />
                    </button>
                </div>
                {user && (
                    <div className="w-svw text-right">
                        <Checkbox id="showCompleted" checked={isShowOnlyCompleted} onChange={() => setIsShowOnlyCompleted(!isShowOnlyCompleted)}>
                            <span>{t("クリア済ステージのみ表示")}</span>
                        </Checkbox>
                    </div>
                )}
            </div>
            <div className="[grid-area:list] bg-[#333] overflow-y-auto py-[2dvmin]">
                <div className="flex flex-col items-center gap-[2dvmin]">
                    {isLoading ? (
                        <div className="text-[length:5dvmin]">Loading...</div>
                    ) : (
                        displayedStages.map((stage) => (
                            <div key={stage.id} className="w-[90%] max-w-200 bg-[#4a4a4a] p-[2dvmin] border-[3px] border-[#222] text-left">
                                <div className="flex justify-between items-center mb-[1.5dvmin]">
                                    <h2 className="text-[length:5dvmin] font-semibold">
                                        <span>{stage.title}</span>
                                        <span className="text-[#ddd] m-[2dvmin] text-[length:3dvmin]">by: {stage.creatorName}</span>
                                    </h2>
                                    <PlayButton i={stage.id} isCompleted={user?.completedOnlineStageIds.includes(stage.id) || false} />
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
