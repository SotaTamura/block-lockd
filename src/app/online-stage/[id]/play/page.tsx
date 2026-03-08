"use client";

import { Application, isMobile } from "pixi.js";
import { use, useEffect, useRef, useState } from "react";
import { RESOLUTION, StageType } from "@/constants";
import Link from "next/link";
import { loadStage, update } from "@/game/main";
import { useAuth, usePopup, useSettings, useStage } from "@/app/context";
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
    const { showAlert, showPopup, hidePopup } = usePopup();
    const { setStages, getStageById } = useStage();
    const [restarter, setRestarter] = useState(0);
    const prevIdRef = useRef(id);
    const [isLoading, setIsLoading] = useState(true);
    const stageRef = useRef<StageType | null>(null);
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
        playSfx("/restart.mp3", null);
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
            const stageFromContext = getStageById(id);
            if (stageFromContext && stageFromContext.code) {
                stageRef.current = stageFromContext;
            } else {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        stageRef.current = data.stage;
                        // Update context
                        if (stageRef.current) {
                            setStages((prevStages) => prevStages.map((s) => (s.id === id ? stageRef.current! : s)));
                        }
                    }
                } catch (error) {
                    showAlert(String(error));
                }
            }
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
                while (accumulator >= stepRef.current) {
                    update(
                        async () => {
                            if (user && !user.completedOnlineStageIds.includes(id)) changeData({ completedOnlineStageIds: [...user.completedOnlineStageIds, id] });
                            showPopup({
                                children: (
                                    <>
                                        <div className="popupTitle mb-4">stage complete!</div>
                                        <div className="flex flex-row justify-center gap-8">
                                            <div
                                                onClick={() => {
                                                    hidePopup();
                                                    router.back();
                                                }}
                                                className="btn next mt-0 w-[18svmin] h-[18svmin] max-w-20 max-h-20">
                                                <LeftSvg />
                                            </div>
                                            <RestartButton className="next mt-0 w-[18svmin] h-[18svmin] max-w-20 max-h-20" onClick={hidePopup} />
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
            <div className="options">
                <Link href={"/settings"} className="btn">
                    <GearSvg />
                </Link>
                <div className="btn" onClick={router.back}>
                    <LeftSvg />
                </div>
                <RestartButton />
            </div>
            <div className="guides">
                <Checkbox id="hitbox" checked={showHitbox} onChange={() => setShowHitbox(!showHitbox)}>
                    {t("当たり判定")}
                </Checkbox>
                <label htmlFor="speed" className="guide">
                    {t("速度")}
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
