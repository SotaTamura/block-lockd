"use client";

import { Application, isMobile } from "pixi.js";
import { use, useEffect, useRef, useState } from "react";
import { RESOLUTION, StageType, STEP } from "@/constants";
import Link from "next/link";
import { loadStage, update } from "@/game/main";
import { useAuth } from "@/app/context";
import { ArrowButton, LeftSvg, Loading, RestartSvg } from "@/app/components";
import { getStage } from "@/app/fetch";
import { glitch } from "@/game/base";

export default function Game({ params }: { params: Promise<{ id: string }> }) {
    const id = Number(use(params).id);
    const cnvWrapperRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const { user, changeUserData } = useAuth();
    const [restarter, setRestarter] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const stageRef = useRef<StageType | null>(null);
    let loopId: number;

    useEffect(() => {
        setIsComplete(false);
        setIsLoading(true);
        const app = new Application();
        appRef.current = app;
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
            if (!stageRef.current) stageRef.current = await getStage(id);
            if (!stageRef.current) return;
            await loadStage(stageRef.current.code, app);
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
                        if (user && !user.completedOnlineStageIds.includes(id)) changeUserData({ completedOnlineStageIds: [...user.completedOnlineStageIds, id] });
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
        <div className="gameScreen backGround">
            <div id="cnvWrapper" ref={cnvWrapperRef}></div>
            {isLoading && <Loading />}
            <div
                className="btn restart"
                onClick={(e) => {
                    e.preventDefault();
                    if (!appRef.current) return;
                    glitch(appRef.current, 300);
                    setTimeout(() => setRestarter(restarter + 1), 300);
                }}>
                <RestartSvg />
            </div>
            <Link href={`/online-stage/${id}/overview`} className="btn menu">
                <LeftSvg />
            </Link>
            <div className="guides"></div>
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
                    <Link href={`/online-stage/${id}/overview`} className="btn next">
                        <LeftSvg />
                    </Link>
                </div>
            )}
        </div>
    );
}
