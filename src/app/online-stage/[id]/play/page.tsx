"use client";

import { Application, isMobile } from "pixi.js";
import { use, useEffect, useRef, useState } from "react";
import { RESOLUTION, StageType, STEP } from "@/constants";
import Link from "next/link";
import { loadStage, update } from "@/game/main";
import { useAuth, useSettings, useStage } from "@/app/context";
import { ArrowButton, Checkbox, GearSvg, LeftSvg, Loading, RestartSvg } from "@/app/components";
import { BgmPath, glitch, playBgm, playSfx } from "@/game/base";
import { TranslatableString, translate } from "@/app/translate";
import { useRouter } from "next/navigation";

export default function Game({ params }: { params: Promise<{ id: string }> }) {
    const id = Number(use(params).id);
    const router = useRouter();
    const cnvWrapperRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const { user, changeData } = useAuth();
    const { getStageById } = useStage();
    const [restarter, setRestarter] = useState(0);
    const prevIdRef = useRef(id);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const stageRef = useRef<StageType | null>(null);
    const [showHitbox, setShowHitbox] = useState(false);
    const showHitboxRef = useRef(false);
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);
    let loopId: number;

    useEffect(() => {
        showHitboxRef.current = showHitbox;
        const $main = document.getElementById("main") as HTMLCanvasElement;
        if ($main) {
            $main.style.opacity = showHitbox ? "0.2" : "1";
        }
        if (!showHitbox) {
            const $debug = document.getElementById("debug") as HTMLCanvasElement;
            if ($debug) {
                const ctx = $debug.getContext("2d");
                ctx?.clearRect(0, 0, $debug.width, $debug.height);
            }
        }
    }, [showHitbox]);

    useEffect(() => {
        playBgm(`/bgm${Math.floor(Math.random() * 7)}.mp3` as BgmPath);
    }, [id]);
    useEffect(() => {
        setIsComplete(false);
        setIsLoading(true);
        const app = new Application();
        appRef.current = app;
        let $cnv: HTMLCanvasElement;
        let $debug: HTMLCanvasElement;
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
            $debug = document.createElement("canvas");
            $debug.id = "debug";
            $debug.width = RESOLUTION;
            $debug.height = RESOLUTION;
            cnvWrapperRef.current?.appendChild($cnv);
            cnvWrapperRef.current?.appendChild($debug);
            $cnv.style.opacity = showHitboxRef.current ? "0.2" : "1";
            const stageFromContext = getStageById(id);
            if (stageFromContext) stageRef.current = stageFromContext;
            if (!stageRef.current) return;
            const skipFadeIn = id === prevIdRef.current && restarter > 0;
            prevIdRef.current = id;
            await loadStage(stageRef.current.code, app, skipFadeIn);
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
                    update(
                        async () => {
                            if (user && !user.completedOnlineStageIds.includes(id)) changeData({ completedOnlineStageIds: [...user.completedOnlineStageIds, id] });
                            setIsComplete(true);
                        },
                        app,
                        showHitboxRef.current ? $debug : undefined,
                    );
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
            $debug?.remove();
        };
    }, [id, restarter, getStageById, changeData]);

    return (
        <div className="gameScreen backGround">
            <div id="cnvWrapper" ref={cnvWrapperRef}></div>
            {isLoading && <Loading />}
            <Link href={"/settings"} className="btn settings">
                <GearSvg />
            </Link>
            <div
                className="btn restart"
                onClick={(e) => {
                    e.preventDefault();
                    if (!appRef.current) return;
                    const $debug = document.getElementById("debug") as HTMLCanvasElement;
                    if ($debug) {
                        const ctx = $debug.getContext("2d");
                        ctx?.clearRect(0, 0, $debug.width, $debug.height);
                    }
                    playSfx("/restart.mp3", null);
                    glitch(appRef.current, 300);
                    setTimeout(() => setRestarter(restarter + 1), 300);
                }}>
                <RestartSvg />
            </div>
            <div className="btn menu" onClick={router.back}>
                <LeftSvg />
            </div>
            <div className="guides">
                <Checkbox id="hitbox" checked={showHitbox} onChange={() => setShowHitbox(!showHitbox)}>
                    {t("当たり判定")}
                </Checkbox>
            </div>
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
                    <div className="btn next" onClick={router.back}>
                        <LeftSvg />
                    </div>
                </div>
            )}
        </div>
    );
}
