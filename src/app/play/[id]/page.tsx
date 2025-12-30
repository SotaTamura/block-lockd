"use client";

import { Application, isMobile, Ticker } from "pixi.js";
import { use, useEffect, useRef, useState } from "react";
import { RESOLUTION, STEP } from "@/constants";
import Link from "next/link";
import { loadStage, update } from "@/game/main";
import { useAuth } from "@/app/context";
import { ArrowButton, Loading, MenuSvg, NextSvg, RestartSvg } from "@/app/components";
import { HINTS, STAGES } from "@/game/stages";
import { GlitchFilter } from "pixi-filters";

export default function Game({ params }: { params: Promise<{ id: string }> }) {
    const id = Number(use(params).id);
    const cnvWrapperRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
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
        <div className="gameScreen backGround">
            <div id="cnvWrapper" ref={cnvWrapperRef}></div>
            {isLoading && <Loading />}
            <div className="stageNum">{id}</div>
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
                    className="popup hint"
                    onClick={() => {
                        setIsHintShowed(false);
                    }}>
                    <div className="popupTitle">
                        hint
                        <div
                            className="close-button"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent closing the popup when clicking the button
                                setIsHintShowed(false);
                            }}>
                            &times;
                        </div>
                    </div>
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
