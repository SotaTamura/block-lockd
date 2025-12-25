"use client";

import { Application, isMobile } from "pixi.js";
import { use, useEffect, useRef, useState } from "react";
import { RESOLUTION, STEP } from "@/constants";
import Link from "next/link";
import { loadStage, update } from "@/game/main";
import { useAuth } from "@/app/context";
import { ArrowButton, MenuSvg, NextSvg, RestartSvg } from "@/app/components";
import { HINTS, STAGES } from "@/game/stages";

export default function Game({ params }: { params: Promise<{ id: string }> }) {
    const id = Number(use(params).id);
    const cnvWrapperRef = useRef<HTMLDivElement>(null);
    const { user, changeUserData } = useAuth();
    const [restarter, setRestarter] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isHintShowed, setIsHintShowed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    let loopId: number;

    useEffect(() => {
        setIsComplete(false);
        setIsHintShowed(false);
        setIsLoading(true);
        const app = new Application();
        let $cnv: HTMLCanvasElement;
        (async () => {
            // pixiアプリケーション作成
            await app.init({
                backgroundAlpha: 0,
                width: RESOLUTION,
                height: RESOLUTION,
                antialias: false,
            });
            $cnv = app.canvas;
            $cnv.id = "main";
            cnvWrapperRef.current?.appendChild($cnv);
            await loadStage(STAGES[id - 1], app);
            setIsLoading(false);
            // 更新
            let prevTime: number | undefined;
            let accumulator = 0;
            let dt: number;
            const gameLoop = (timestamp: DOMHighResTimeStamp) => {
                if (prevTime !== undefined) {
                    dt = Math.min(timestamp - prevTime, 100);
                }
                accumulator += dt ? dt : 0;
                while (accumulator >= STEP) {
                    update(async () => {
                        if (user) changeUserData({ completedStageIds: [...user.completedStageIds, id] });
                        setIsComplete(true);
                    }, app);
                    accumulator -= STEP;
                }
                prevTime = timestamp;
                loopId = requestAnimationFrame(gameLoop);
            };
            requestAnimationFrame(gameLoop);
        })();
        return () => {
            window.cancelAnimationFrame(loopId);
            app.destroy(true, { children: true });
        };
    }, [id, restarter]);

    return (
        <div className="gameScreen backGround" ref={cnvWrapperRef}>
            {isLoading && <div className="loadingStage">Loading...</div>}
            <div className="stageNum">{id}</div>
            <div
                className="btn restart"
                onClick={(e) => {
                    setRestarter(restarter + 1);
                    e.preventDefault();
                }}>
                <RestartSvg />
            </div>
            <Link href={"/select-stage"} className="btn menu">
                <MenuSvg />
            </Link>
            <div className="guides">
                <div
                    className="miniBtn guide"
                    onClick={(e) => {
                        setIsHintShowed(true);
                        e.preventDefault();
                    }}>
                    ヒント
                </div>
            </div>
            {isHintShowed && (
                <div
                    className="popup"
                    onClick={() => {
                        setIsHintShowed(false);
                    }}>
                    <div className="popupTitle">hint</div>
                    <div className="hintText">{HINTS[id - 1]}</div>
                </div>
            )}
            {isMobile.any && (
                <div className="controlBtns">
                    <ArrowButton eventName="u" />
                    <ArrowButton eventName="d" />
                    <ArrowButton eventName="l" />
                    <ArrowButton eventName="r" />
                </div>
            )}
            {isComplete && (
                <div className="popup">
                    <div className="popupTitle">stage complete!</div>
                    {id === STAGES.length ? (
                        <Link href={"/select-stage"} className="btn next">
                            <MenuSvg />
                        </Link>
                    ) : (
                        <Link href={`/play/${id + 1}`} className="btn next">
                            <NextSvg />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
