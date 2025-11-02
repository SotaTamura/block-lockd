"use client";

import { Application, Container } from "pixi.js";
import { use, useEffect, useRef, useState } from "react";
import { RESOLUTION, STAGE_LEN, STEP } from "@/constants";
import Link from "next/link";
import { hint, loadStage, update } from "@/game/main";
import { useAuth } from "@/app/context";
import { ArrowButton, Checkbox, MenuSvg, NextSvg, RestartSvg } from "@/app/components";

export let app: Application; // pixiアプリケーション
export let debugContainer: Container;

export default function Game({ params }: { params: Promise<{ id: string }> }) {
    const id = Number(use(params).id);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const { user, changeUserData } = useAuth();
    const [restarter, setRestarter] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isHintShowed, setIsHintShowed] = useState(false);
    const [isDebugShowed, setIsDebugShowed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hintText, setHintText] = useState("");
    const isMobile = window.ontouchstart !== undefined && navigator.maxTouchPoints > 0; // タッチ端末判定
    let loopId: number;

    useEffect(() => {
        setIsComplete(false);
        setIsHintShowed(false);
        setIsLoading(true);
        app = new Application();
        let $can: HTMLCanvasElement;
        (async () => {
            // pixiアプリケーション作成
            await app.init({
                backgroundAlpha: 0,
                width: RESOLUTION,
                height: RESOLUTION,
                antialias: false,
            });
            $can = app.canvas;
            $can.id = "main";
            canvasWrapperRef.current?.appendChild($can);
            debugContainer = new Container();
            debugContainer.width = app.screen.width;
            debugContainer.height = app.screen.height;
            debugContainer.zIndex = 100;
            debugContainer.visible = isDebugShowed;
            app.stage.addChild(debugContainer);
            await loadStage(id);
            setHintText(hint);
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
                    });
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

    useEffect(() => {
        if (debugContainer) {
            debugContainer.visible = isDebugShowed;
        }
    }, [isDebugShowed]);

    return (
        <div className="gameScreen backGround" ref={canvasWrapperRef}>
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
                <Checkbox
                    id="debug"
                    checked={isDebugShowed}
                    onChange={() => {
                        setIsDebugShowed(!isDebugShowed);
                    }}
                    children={<span>当たり判定</span>}
                />
            </div>
            {isHintShowed && (
                <div
                    className="popup"
                    onClick={() => {
                        setIsHintShowed(false);
                    }}>
                    <div className="popupTitle">hint</div>
                    <div className="hintText">{hintText}</div>
                </div>
            )}
            {isMobile && (
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
                    {id === STAGE_LEN ? (
                        <Link href={"/select-stage"} className="btn next">
                            <MenuSvg />
                        </Link>
                    ) : (
                        <Link href={`/game/${id + 1}`} className="btn next">
                            <NextSvg />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
