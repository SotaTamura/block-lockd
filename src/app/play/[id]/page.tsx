"use client";

import { Application, isMobile } from "pixi.js";
import { use, useEffect, useRef, useState } from "react";
import { RESOLUTION } from "@/constants";
import Link from "next/link";
import { loadStage, update } from "@/game/main";
import { usePopup, useSettings } from "@/app/context";
import { ArrowButton, Checkbox, GearSvg, Loading, MenuSvg, NextSvg, RestartSvg } from "@/app/components";
import { STAGES } from "@/game/stages";
import { BgmPath, glitch, playBgm, playSfx } from "@/game/base";
import { TranslatableString, translate } from "@/app/translate";

export default function Game({ params }: { params: Promise<{ id: string }> }) {
    const id = Number(use(params).id);
    const cnvWrapperRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const { showPopup, hidePopup } = usePopup();
    const [restarter, setRestarter] = useState(0);
    const prevIdRef = useRef(id);
    const [isLoading, setIsLoading] = useState(true);
    const [showHitbox, setShowHitbox] = useState(false);
    const showHitboxRef = useRef(false);
    const [step, setStep] = useState(1000 / 60);
    const stepRef = useRef(1000 / 60);
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);
    let loopId: number;

    const handleRestart = () => {
        if (!appRef.current) return;
        const $debug = document.getElementById("debug") as HTMLCanvasElement;
        if ($debug) {
            const ctx = $debug.getContext("2d");
            ctx?.clearRect(0, 0, $debug.width, $debug.height);
        }
        playSfx("/restart.mp3", null, 3);
        glitch(appRef.current, 300);
        setTimeout(() => setRestarter((prev) => prev + 1), 300);
    };

    const RestartButton = ({ className, onClick }: { className?: string; onClick?: () => void }) => (
        <div
            className={`btn ${className}`}
            onClick={(e) => {
                e.preventDefault();
                handleRestart();
                if (onClick) onClick();
            }}>
            <RestartSvg />
        </div>
    );

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
        stepRef.current = step;
    }, [step]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "r" || e.key === "R") handleRestart();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        playBgm(`/bgm${Math.floor(Math.random() * 7)}.mp3` as BgmPath);
    }, [id]);

    useEffect(() => {
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
            const skipFadeIn = id === prevIdRef.current && restarter > 0;
            prevIdRef.current = id;
            await loadStage(STAGES[id].code, app, skipFadeIn);
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
                while (accumulator >= stepRef.current) {
                    update(
                        async () => {
                            showPopup({
                                children: (
                                    <>
                                        <div className="popupTitle mb-4">stage complete!</div>
                                        <div className="flex flex-row justify-center gap-6">
                                            <Link href={"/select-stage"} onClick={hidePopup} className="btn next mt-0 w-[18svmin] h-[18svmin] max-w-20 max-h-20">
                                                <MenuSvg />
                                            </Link>
                                            <RestartButton className="next mt-0 w-[18svmin] h-[18svmin] max-w-20 max-h-20" onClick={hidePopup} />
                                            {id !== Object.keys(STAGES).length && (
                                                <Link href={`/play/${id + 1}`} onClick={hidePopup} className="btn next mt-0 w-[18svmin] h-[18svmin] max-w-20 max-h-20">
                                                    <NextSvg />
                                                </Link>
                                            )}
                                        </div>
                                    </>
                                ),
                            });
                        },
                        app,
                        showHitboxRef.current ? $debug : undefined,
                    );
                    accumulator -= stepRef.current;
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
    }, [id, restarter]);

    return (
        <div className="gameScreen backGround">
            <div id="cnvWrapper" ref={cnvWrapperRef}></div>
            {isLoading && <Loading />}
            <div className="stageNum">{id}</div>
            <div className="options">
                <Link href={"/settings"} className="btn">
                    <GearSvg />
                </Link>
                <Link href={"/select-stage"} className="btn">
                    <MenuSvg />
                </Link>
                <RestartButton />
            </div>
            <div className="guides">
                <div
                    className="miniBtn guide"
                    onClick={(e) => {
                        e.preventDefault();
                        showPopup({
                            children: (
                                <>
                                    <div className="popupTitle">hint</div>
                                    <div>{t(STAGES[id].hint as TranslatableString)}</div>
                                </>
                            ),
                            onOk: hidePopup,
                        });
                    }}>
                    {t("ヒント")}
                </div>
                <Checkbox id="hitbox" checked={showHitbox} onChange={() => setShowHitbox(!showHitbox)}>
                    {t("当たり判定")}
                </Checkbox>
                <label htmlFor="speed" className="guide">
                    {t("速度")}:
                    <select
                        id="speed"
                        value={step}
                        onChange={(e) => {
                            setStep(Number(e.target.value));
                            e.target.blur();
                        }}>
                        <option value={1000 / 30}>0.5x</option>
                        <option value={1000 / 45}>0.75x</option>
                        <option value={1000 / 60}>1x</option>
                        <option value={1000 / 75}>1.25x</option>
                        <option value={1000 / 90}>1.5x</option>
                        <option value={1000 / 120}>2x</option>
                    </select>
                </label>
            </div>
            {isMobile.any && (
                <div className="controlBtns">
                    <ArrowButton eventName="u" />
                    <ArrowButton eventName="d" />
                    <ArrowButton eventName="l" />
                    <ArrowButton eventName="r" />
                </div>
            )}
        </div>
    );
}
