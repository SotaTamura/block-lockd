"use client";

import { Application, isMobile, Ticker } from "pixi.js";
import { use, useEffect, useRef, useState } from "react";
import { RESOLUTION, STEP } from "@/constants";
import Link from "next/link";
import { loadStage, update } from "@/game/main";
import { useAuth } from "@/app/context";
import { ArrowButton, LeftSvg, Loading, RestartSvg } from "@/app/components";
import { getStage } from "@/app/fetch";
import { GlitchFilter } from "pixi-filters";

export default function Game({ params }: { params: Promise<{ id: string }> }) {
    const id = Number(use(params).id);
    const cnvWrapperRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const { user, changeUserData } = useAuth();
    const [restarter, setRestarter] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
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
            const data = await getStage(id);
            if (!data) return;
            await loadStage(data.code, app);
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
                        if (user) changeUserData({ completedOnlineStageIds: [...user.completedOnlineStageIds, id] });
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
                    if (appRef.current) {
                        const glitchFilter = new GlitchFilter({
                            slices: 10,
                            offset: 10,
                            direction: 0,
                            fillMode: 0,
                            red: { x: 0, y: 0 },
                            blue: { x: 0, y: 0 },
                            green: { x: 0, y: 0 },
                        });
                        appRef.current.stage.filters = [glitchFilter];
                        let count = 0;
                        const ticker = (_ticker: Ticker) => {
                            if (count % 4 === 0) {
                                glitchFilter.seed = Math.random();
                                glitchFilter.offset = (Math.random() - 0.5) * 200;
                                glitchFilter.red = { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 };
                                glitchFilter.blue = { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 };
                                glitchFilter.green = { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 };
                            }
                            count++;
                        };
                        appRef.current.ticker.add(ticker);

                        setTimeout(() => {
                            if (appRef.current) {
                                appRef.current.ticker.remove(ticker);
                                appRef.current.stage.filters = [];
                            }
                            setRestarter(restarter + 1);
                        }, 300);
                    } else {
                        setRestarter(restarter + 1);
                    }
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
