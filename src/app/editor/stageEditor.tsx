"use client";

import { useAuth, useSettings } from "@/app/context";
import { useRouter } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowButton, BucketSvg, Checkbox, CheckSvg, EraserSvg, LeftSvg, MoveSvg, PencilSvg, ResizeSvg, RestartSvg, RestartSvgWhite, RotateRightSvg, Toggle, TrashSvg } from "@/app/components";
import { Direction, MAP_BLOCK_LEN, RESOLUTION, STEP, UNIT, colorMap, π, StageType, convertBase, parseBase, PROPS_LEN } from "@/constants";
import { loadStage, update } from "@/game/main";
import { Application, Container, Graphics, isMobile, Sprite, Texture, Rectangle, FederatedPointerEvent, BitmapText, Cursor } from "pixi.js";
import { getRotatedTexture, glitch, playSfx, stopBgm } from "@/game/base";
import { gunzipSync, gzipSync } from "zlib";
import { TranslatableString, translate } from "../translate";
import Image from "next/image";

type TextureName = "player0" | "block" | "block_deactivated" | "ladder" | "key" | "oneway" | "portal_front0" | "lever_off" | "pushblock" | "button_off" | "moveblock_off" | "moveblock_on";
type EditorTool = "pencil" | "eraser" | "move" | "resize" | "color" | "rotate";
const textureMap: Record<number, TextureName> = {
    1: "player0",
    2: "block",
    3: "block_deactivated",
    4: "ladder",
    5: "key",
    6: "oneway",
    7: "portal_front0",
    8: "lever_off",
    9: "pushblock",
    10: "button_off",
    11: "moveblock_off",
    12: "moveblock_on",
};
export const nameStateMap: Record<number, { name: string; state: string }> = {
    1: { name: "player", state: "static" },
    2: { name: "block", state: "default" },
    3: { name: "block", state: "deactivated" },
    4: { name: "ladder", state: "default" },
    5: { name: "key", state: "default" },
    6: { name: "oneway", state: "default" },
    7: { name: "portal", state: "static" },
    8: { name: "lever", state: "off" },
    9: { name: "pushBlock", state: "default" },
    10: { name: "button", state: "off" },
    11: { name: "moveBlock", state: "off" },
    12: { name: "moveBlock", state: "on" },
};
const toolMap: Record<string, EditorTool> = {
    t: "pencil",
    x: "eraser",
    m: "move",
    s: "resize",
    c: "color",
    r: "rotate",
};
export class EditorObj {
    gid: number;
    x: number;
    y: number;
    w: number;
    h: number;
    ang: Direction;
    color: number;
    tag: string;
    sprite: Sprite;
    container: Container;
    resizeDot: Graphics;
    counterpart?: EditorObj;
    constructor(
        gid: number,
        x: number,
        y: number,
        w: number,
        h: number,
        ang: Direction,
        color: number,
        tag: string,
        onContainerClick: (e: FederatedPointerEvent, obj: EditorObj) => void,
        onContainerHover: (obj: EditorObj) => void,
        onResizeDotClick: (obj: EditorObj) => void,
        currentSelectedTool: EditorTool,
    ) {
        this.gid = gid;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.ang = ang;
        this.color = color;
        this.tag = tag;
        this.sprite = new Sprite({
            texture: getRotatedTexture(nameStateMap[gid].name, nameStateMap[gid].state, 0, ang) as Texture,
            x: 0,
            y: 0,
            width: w * UNIT,
            height: h * UNIT,
            tint: colorMap[color],
        });
        let initialCursor: Cursor = "pointer";
        if (currentSelectedTool === "move") {
            initialCursor = "move";
        } else if (currentSelectedTool === "pencil") {
            initialCursor = "crosshair";
        } else if (
            (currentSelectedTool === "color" && !["block", "block_deactivated", "key", "oneway", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[gid])) ||
            (currentSelectedTool === "rotate" && !["oneway", "portal_front0", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[gid]))
        ) {
            initialCursor = "not-allowed";
        }
        this.container = new Container({
            x: x * UNIT,
            y: y * UNIT,
            eventMode: "static",
            cursor: initialCursor,
            hitArea: new Rectangle(0, 0, w * UNIT, h * UNIT),
            onpointerdown: (e) => {
                onContainerClick(e, this);
            },
            onpointerover: () => {
                onContainerHover(this);
            },
        });
        this.container.addChild(this.sprite);
        this.resizeDot = new Graphics({
            x: w * UNIT,
            y: h * UNIT,
            eventMode: "static",
            cursor: "nwse-resize",
            visible: false,
            onpointerdown: () => {
                onResizeDotClick(this);
            },
        })
            .moveTo(0, 0)
            .arc(0, 0, UNIT, π, (3 / 2) * π)
            .closePath()
            .fill({ color: 0xff0000, alpha: 0.5 });
        if (this.tag) {
            const portalText = new BitmapText({
                text: this.tag,
                x: (w / 2) * UNIT,
                y: (h / 2) * UNIT,
                style: {
                    fontFamily: ["Makinas", "sans-serif"],
                    fontSize: (3 / 4) * UNIT,
                    fill: 0x000000,
                    stroke: { color: 0xffffff, width: 10, join: "round" },
                    align: "center",
                },
            });
            portalText.anchor.set(0.5);
            this.container.addChild(portalText);
        }
        this.container.addChild(this.resizeDot);
    }
}

export default function StageEditor({ initData }: { initData?: StageType }) {
    const router = useRouter();
    const { user } = useAuth();
    const appRef = useRef<Application | null>(null);
    const cnvWrapperRef = useRef<HTMLDivElement>(null);
    const [cnvSize, setCnvSize] = useState(0);
    const gameLoopId = useRef<number | null>(null);
    const [restarter, setRestarter] = useState(0);
    const [title, setTitle] = useState(initData?.title || "");
    const [description, setDescription] = useState(initData?.description || "");
    const [tab, setTab] = useState<"overview" | "stage" | "test">("overview");
    const [selectedObj, setSelectedObj] = useState<TextureName>("player0");
    const [selectedTool, setSelectedTool] = useState<EditorTool>("pencil");
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedSnap, setSelectedSnap] = useState<1 | 0.5>(1);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);
    const [editorObjs, setEditorObjs] = useState<EditorObj[]>([]);
    const [access, setAccess] = useState(2); //0: public, 1: private, 2: unverified
    const [showHitbox, setShowHitbox] = useState(false);
    const showHitboxRef = useRef(false);
    const {
        settings: { lang },
    } = useSettings();
    const t = (str: TranslatableString) => translate(str, lang);

    useEffect(() => {
        showHitboxRef.current = showHitbox;
        const $main = document.getElementById("main") as HTMLCanvasElement;
        if ($main) {
            $main.style.opacity = showHitbox && tab === "test" ? "0.2" : "1";
        }
        if (!showHitbox || tab !== "test") {
            const $debug = document.getElementById("debug") as HTMLCanvasElement;
            if ($debug) {
                const ctx = $debug.getContext("2d");
                ctx?.clearRect(0, 0, $debug.width, $debug.height);
            }
        }
    }, [showHitbox, tab]);

    const addObj = (app: Application, x: number, y: number) => {
        if (selectedObj === "portal_front0") {
            let n = 0;
            const portalNums = editorObjs.filter((o) => o.tag).map((p) => parseBase(p.tag, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
            while (true) {
                if (!portalNums.includes(n)) break;
                n++;
            }
            const tag = convertBase(n, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
            const portal1 = new EditorObj(7, x, y, 1, 1, "u", 0, tag, handleContainerClick, handleContainerHover, handleResizeDotClick, selectedTool);
            const portal2 = new EditorObj(7, x, y + 1, 1, 1, "d", 0, tag, handleContainerClick, handleContainerHover, handleResizeDotClick, selectedTool);
            portal1.counterpart = portal2;
            portal2.counterpart = portal1;
            const newObjs = [portal1, portal2];
            setEditorObjs((prev) => {
                const next = [...prev];
                let i = next.length;
                while (i > 0 && ["player0", "pushblock", "moveblock_off", "moveblock_on"].includes(textureMap[next[i - 1].gid])) i--;
                next.splice(i, 0, ...newObjs);
                return next;
            });
        } else {
            const newObj = new EditorObj(Number(Object.keys(textureMap).find((k) => textureMap[Number(k)] === selectedObj)), x, y, 1, 1, "u", 0, "", handleContainerClick, handleContainerHover, handleResizeDotClick, selectedTool);
            setEditorObjs((prev) => {
                const next = [...prev];
                let i = next.length;
                while (i > 0 && ["player0", "pushblock", "moveblock_off", "moveblock_on"].includes(textureMap[next[i - 1].gid])) i--;
                next.splice(i, 0, newObj);
                return next;
            });
        }
        setAccess(2);
    };

    const clearResizeDot = () => {
        editorObjs.forEach((o) => (o.resizeDot.visible = false));
    };

    const handleResizeDotClick = (obj: EditorObj) => {
        const stage = appRef.current?.stage;
        if (!stage) return;
        const onDrag = (e: FederatedPointerEvent) => {
            const snapRatio = selectedSnap;
            const snapUnit = UNIT * snapRatio;
            const cursorPxPos = e.getLocalPosition(stage);
            const newW = Math.max(snapRatio, Math.round(cursorPxPos.x / snapUnit) * snapRatio - obj.x);
            const newH = Math.max(snapRatio, Math.round(cursorPxPos.y / snapUnit) * snapRatio - obj.y);
            const resize = (obj: EditorObj) => {
                obj.w = newW;
                obj.h = newH;
                obj.sprite.width = newW * UNIT;
                obj.sprite.height = newH * UNIT;
                if (obj.container.hitArea instanceof Rectangle) {
                    obj.container.hitArea.width = newW * UNIT;
                    obj.container.hitArea.height = newH * UNIT;
                }
                obj.resizeDot.x = newW * UNIT;
                obj.resizeDot.y = newH * UNIT;
                const portalText = obj.container.children.find((c) => c instanceof BitmapText);
                if (portalText) {
                    portalText.x = (newW * UNIT) / 2;
                    portalText.y = (newH * UNIT) / 2;
                }
            };
            resize(obj);
            if (obj.counterpart) resize(obj.counterpart);
        };
        const onDragEnd = () => {
            stage.off("pointermove", onDrag);
            stage.off("pointerup", onDragEnd);
            stage.off("pointerupoutside", onDragEnd);
        };

        stage.on("pointermove", onDrag);
        stage.on("pointerup", onDragEnd);
        stage.on("pointerupoutside", onDragEnd);
    };

    const handleContainerClick = (e: FederatedPointerEvent, obj: EditorObj) => {
        if (!appRef.current) return;
        if (selectedTool === "pencil") {
            const pos = e.getLocalPosition(appRef.current.stage);
            addObj(appRef.current, Math.floor(pos.x / UNIT), Math.floor(pos.y / UNIT));
        } else if (selectedTool === "eraser") {
            setEditorObjs((prev) => prev.filter((o) => o !== obj && o !== obj.counterpart));
        } else if (selectedTool === "move") {
            const stage = appRef.current.stage;
            const onDrag = (e: FederatedPointerEvent) => {
                const snapUnit = UNIT * selectedSnap;
                const newPoint = e.getLocalPosition(stage);
                const newX = Math.round((newPoint.x - (obj.w * UNIT) / 2) / snapUnit) * snapUnit;
                const newY = Math.round((newPoint.y - (obj.h * UNIT) / 2) / snapUnit) * snapUnit;
                obj.container.x = newX;
                obj.container.y = newY;
                obj.x = newX / UNIT;
                obj.y = newY / UNIT;
            };
            const onDragEnd = () => {
                stage.off("pointermove", onDrag);
                stage.off("pointerup", onDragEnd);
                stage.off("pointerupoutside", onDragEnd);
            };
            stage.on("pointermove", onDrag);
            stage.on("pointerup", onDragEnd);
            stage.on("pointerupoutside", onDragEnd);
        } else if (selectedTool === "resize") {
            clearResizeDot();
            obj.resizeDot.visible = true;
        } else if (selectedTool === "color") {
            if (["block", "block_deactivated", "key", "oneway", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[obj.gid])) {
                obj.sprite.tint = colorMap[selectedColor] || "#ffffff";
                obj.color = selectedColor;
            }
        } else if (selectedTool === "rotate") {
            if (["oneway", "portal_front0", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[obj.gid])) {
                const rotateObj = (obj: EditorObj) => {
                    obj.sprite.texture = getRotatedTexture(nameStateMap[obj.gid].name, nameStateMap[obj.gid].state, (obj.container.children[0] as Sprite).texture.rotate, 90) as Texture;
                    if (obj.ang === "u") obj.ang = "r";
                    else if (obj.ang === "r") obj.ang = "d";
                    else if (obj.ang === "d") obj.ang = "l";
                    else if (obj.ang === "l") obj.ang = "u";
                };
                rotateObj(obj);
                if (obj.counterpart) rotateObj(obj.counterpart);
            }
        }
        setAccess(2);
    };
    const handleContainerHover = (obj: EditorObj) => {
        if (selectedTool === "resize") {
            clearResizeDot();
            obj.resizeDot.visible = true;
        }
    };

    const handleTileClick = (x: number, y: number) => {
        if (!appRef.current) return;
        if (selectedTool === "pencil") {
            addObj(appRef.current, x, y);
        }
    };

    // Init App
    useEffect(() => {
        stopBgm();

        if (initData) {
            setAccess(initData.access);
            const loadedObjs = gunzipSync(Buffer.from(initData.code, "base64"))
                .toString("utf-8")
                .split(";")
                .map((o) => {
                    const [base64Mask, joinedMaskedProps] = o.split(":");
                    const mask = parseBase(base64Mask, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_");
                    const maskedProps = joinedMaskedProps.split(",");
                    let maskedPropIndex = 0;
                    const propStrs: (string | null)[] = new Array(PROPS_LEN).fill(null);
                    for (let i = 0; i < PROPS_LEN; i++) {
                        if (mask & (1 << i)) {
                            const propStr = maskedProps[maskedPropIndex++];
                            propStrs[i] = propStr;
                        }
                    }
                    const [gid, x, y, w, h, ang, color, tag] = [
                        Number(propStrs[0]),
                        Number(propStrs[1]),
                        Number(propStrs[2] || 1),
                        Number(propStrs[3] || 1),
                        Number(propStrs[4] || 1),
                        (["u", "r", "d", "l"] as Direction[])[Number(propStrs[5] || 0)],
                        Number(propStrs[6] || 0),
                        propStrs[7] || "",
                    ];
                    return new EditorObj(gid, x, y, w, h, ang, color, tag, handleContainerClick, handleContainerHover, handleResizeDotClick, selectedTool);
                });
            const portals = loadedObjs.filter((o) => o.tag);
            portals.forEach((p) => (p.counterpart = loadedObjs.find((p2) => p2.tag === p.tag && p2 !== p)));
            setEditorObjs(loadedObjs);
        }

        const switchToolByKey = (e: KeyboardEvent) => {
            if (!Object.keys(toolMap).includes(e.key)) return;
            setSelectedTool(toolMap[e.key]);
            clearResizeDot();
        };
        document.addEventListener("keydown", switchToolByKey);

        const $wrapper = cnvWrapperRef.current;
        if (!$wrapper) return;
        const app = new Application();
        appRef.current = app;
        let $debug: HTMLCanvasElement;
        (async () => {
            setIsLoading(true);
            await app.init({
                backgroundAlpha: 0,
                width: RESOLUTION,
                height: RESOLUTION,
                antialias: false,
            });
            const $cnv = app.canvas;
            $cnv.id = "main";
            $debug = document.createElement("canvas");
            $debug.id = "debug";
            $debug.width = RESOLUTION;
            $debug.height = RESOLUTION;
            $wrapper.appendChild($cnv);
            $wrapper.appendChild($debug);
            $cnv.style.opacity = showHitboxRef.current && tab === "test" ? "0.2" : "1";
            setIsAppReady(true);
            setIsLoading(false);
        })();
        return () => {
            document.removeEventListener("keydown", switchToolByKey);
            const currentApp = appRef.current;
            if (currentApp) {
                currentApp.destroy(true, { children: true, texture: false, textureSource: false });
                appRef.current = null;
            }
            $debug?.remove();
        };
    }, []);

    // Scene manager
    useEffect(() => {
        if (!isAppReady || tab === "overview") return;
        const app = appRef.current;
        if (!app) return;

        // Clear the stage
        app.stage.removeChildren();

        // Clear debug canvas if not in test tab
        if (tab !== "test") {
            const $debug = document.getElementById("debug") as HTMLCanvasElement;
            if ($debug) {
                const ctx = $debug.getContext("2d");
                ctx?.clearRect(0, 0, $debug.width, $debug.height);
            }
        }

        let isMounted = true;

        if (tab === "stage") {
            app.stage.eventMode = "static";
            app.stage.hitArea = app.screen;
            // Build editor scene
            for (let y = 0; y < MAP_BLOCK_LEN; y++) {
                for (let x = 0; x < MAP_BLOCK_LEN; x++) {
                    const tile = new Container({
                        x: x * UNIT,
                        y: y * UNIT,
                        eventMode: "static",
                        hitArea: new Rectangle(0, 0, UNIT, UNIT),
                        cursor: "crosshair",
                        onpointerdown: () => {
                            handleTileClick(x, y);
                        },
                    });
                    tile.addChild(new Graphics().rect(0, 0, UNIT, UNIT).stroke({ color: 0x4b4b4b, width: 2 }));
                    app.stage.addChild(tile);
                }
            }
            editorObjs.forEach((o) => {
                // Update cursors based on tool
                if (selectedTool === "move") {
                    o.container.cursor = "move";
                } else if (selectedTool === "pencil") {
                    o.container.cursor = "crosshair";
                } else if (selectedTool === "color") {
                    if (["block", "block_deactivated", "key", "oneway", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[o.gid])) {
                        o.container.cursor = "pointer";
                    } else {
                        o.container.cursor = "not-allowed";
                    }
                } else if (selectedTool === "rotate") {
                    if (["oneway", "portal_front0", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[o.gid])) {
                        o.container.cursor = "pointer";
                    } else {
                        o.container.cursor = "not-allowed";
                    }
                } else {
                    o.container.cursor = "pointer";
                }

                // Refresh handlers
                o.container.onpointerdown = (e) => handleContainerClick(e, o);
                o.container.onpointerover = () => handleContainerHover(o);
                o.resizeDot.onpointerdown = () => handleResizeDotClick(o);

                app.stage.addChild(o.container);
            });
            app.renderer.render(app.stage);
        } else if (tab === "test") {
            app.stage.eventMode = "auto";
            app.stage.hitArea = null;
            // Build test scene
            setIsComplete(false);
            setIsLoading(true);
            loadStage(editorObjs, app, true)
                .then(() => {
                    if (!isMounted) return;
                    setIsLoading(false);
                    app.renderer.render(app.stage);
                    let prevTime: number | undefined;
                    let accumulator = 0;
                    let dt: number;
                    const gameLoop = (timestamp: DOMHighResTimeStamp) => {
                        if (prevTime !== undefined) {
                            dt = Math.min(timestamp - prevTime, 100);
                        }
                        accumulator += dt ? dt : 0;
                        while (accumulator >= STEP) {
                            const $debug = document.getElementById("debug") as HTMLCanvasElement;
                            update(
                                async () => {
                                    setIsComplete(true);
                                    if (access === 2) setAccess(1);
                                },
                                app,
                                showHitboxRef.current && $debug ? $debug : undefined,
                            );
                            accumulator -= STEP;
                        }
                        prevTime = timestamp;
                        gameLoopId.current = requestAnimationFrame(gameLoop);
                    };
                    gameLoopId.current = requestAnimationFrame(gameLoop);
                })
                .catch((err) => {
                    console.error("Failed to load stage:", err);
                    setIsLoading(false);
                });
        }

        return () => {
            isMounted = false;
            if (gameLoopId.current) {
                cancelAnimationFrame(gameLoopId.current);
                gameLoopId.current = null;
            }
        };
    }, [tab, isAppReady, restarter, editorObjs, selectedTool, selectedColor, selectedSnap, selectedObj]);

    useEffect(() => {
        if (isAppReady && appRef.current && cnvSize > 0) {
            const $cnv = appRef.current.canvas;
            $cnv.style.width = `${cnvSize}px`;
            $cnv.style.height = `${cnvSize}px`;
            const $debug = document.getElementById("debug");
            if ($debug) {
                $debug.style.width = `${cnvSize}px`;
                $debug.style.height = `${cnvSize}px`;
            }
        }
    }, [cnvSize, isAppReady]);

    useLayoutEffect(() => {
        if (!cnvWrapperRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const { inlineSize: parentW, blockSize: parentH } = entries[0].contentBoxSize[0];
            const size = Math.min(parentW, parentH);
            setCnvSize(size);
        });
        observer.observe(cnvWrapperRef.current);
        return () => {
            observer.disconnect();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent, checkChange: boolean) => {
        e.preventDefault();
        if (!user) {
            router.push("/");
        } else {
            const code = gzipSync(
                editorObjs
                    .map((o) => {
                        const props = [o.gid, o.x, o.y, o.w === 1 ? null : o.w, o.h === 1 ? null : o.h, o.ang === "u" ? null : ["u", "r", "d", "l"].indexOf(o.ang), o.color === 0 ? null : o.color, o.tag === "" ? null : o.tag];
                        let mask = 0;
                        const maskedProps: (string | number)[] = [];
                        for (let i = 0; i < props.length; i++) {
                            const prop = props[i];
                            if (prop !== null) {
                                mask |= 1 << i;
                                maskedProps.push(prop);
                            }
                        }
                        const base64Mask = convertBase(mask, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_");
                        return base64Mask + ":" + maskedProps.join(",");
                    })
                    .join(";"),
            ).toString("base64");
            if (!code) {
                window.alert(t("ステージに何も設置されていません。"));
            } else {
                const newData = {
                    title: title || t("無題"),
                    description: description || "",
                    code: code,
                    access: access,
                };
                if ((checkChange && (initData?.title !== title || initData.description !== description || initData.code !== code) && window.confirm(t("変更を保存しますか？"))) || !checkChange) {
                    setIsLoading(true);
                    if (initData) {
                        // project://src/app/api/stage/[id]/route.ts
                        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/${initData.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: initData.id, ...newData }),
                        });
                    } else {
                        //project://src/app/api/stage/route.ts
                        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ creatorId: user.id, ...newData }),
                        });
                    }
                    setIsLoading(false);
                }
                router.back();
            }
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (user && window.confirm(t("本当にこのステージを削除しますか？"))) {
            setIsLoading(true);
            // project://src/app/api/stage/[id]/route.ts
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/${initData?.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                window.alert(t("ステージを削除しました。"));
                router.push("/editor");
            } else {
                const data = await res.json();
                window.alert(data.message);
            }
            setIsLoading(false);
        }
    };

    const handleRestartTest = () => {
        if (!appRef.current) return;
        const $debug = document.getElementById("debug") as HTMLCanvasElement;
        if ($debug) {
            const ctx = $debug.getContext("2d");
            ctx?.clearRect(0, 0, $debug.width, $debug.height);
        }
        glitch(appRef.current, 300);
        playSfx("/restart.mp3", null);
        setTimeout(() => setRestarter(restarter + 1), 300);
    };

    return (
        <main id="stage-editor-main" className="text-center relative h-full">
            <div className="[grid-area:header] flex justify-between items-center px-[2svmin] fixed w-full z-30">
                <div
                    className="btn back w-[25%] h-15"
                    onClick={(e) => {
                        if (tab !== "overview") {
                            setTab("overview");
                        } else {
                            handleSubmit(e, true);
                        }
                    }}>
                    <LeftSvg />
                </div>
                <span className={`${tab !== "overview" ? "unselected-tab" : ""} w-[25%] h-15 leading-15 text-xl cursor-pointer`} onClick={() => setTab("overview")}>
                    {t("概要")}
                </span>
                <span className={`${tab !== "stage" ? "unselected-tab" : ""} w-[25%] h-15 leading-15 text-xl cursor-pointer`} onClick={() => setTab("stage")}>
                    {t("ステージ")}
                </span>
                <span
                    className={`${tab !== "test" ? "unselected-tab" : ""} w-[25%] h-15 flex justify-center items-center text-xl cursor-pointer`}
                    onClick={() => {
                        if (tab === "test") {
                            handleRestartTest();
                        } else {
                            setTab("test");
                        }
                    }}>
                    {tab !== "test" ? t("テスト") : <RestartSvgWhite />}
                </span>
            </div>
            {/* 概要 */}
            <div className={`absolute inset-0 overflow-y-auto ${tab === "overview" ? "opacity-100 z-20" : "opacity-0 pointer-events-none z-0"}`}>
                <div className="flex justify-center items-center">
                    <h1 className="text-[length:10svmin] mt-[15svmin]">{t(initData ? "ステージ編集" : "新規作成")}</h1>
                </div>
                <form
                    onSubmit={(e) => {
                        handleSubmit(e, false);
                    }}
                    className="flex flex-col justify-center items-center m-auto">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("タイトルを入力")}
                        type="text"
                        className="px-4 w-[80svw] max-w-md py-2 my-2 bg-white text-black placeholder-gray-400 border-2 border-gray-600 focus:outline-none focus:border-gray-500 text-[16px]"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("説明を入力")}
                        className="px-4 py-2 w-[80svw] max-w-md my-2 h-[20svh] bg-white text-black placeholder-gray-400 border-2 border-gray-600 focus:outline-none focus:border-gray-500 text-[16px]"></textarea>
                    <div className="m-2">
                        <Toggle
                            id="access"
                            checked={access === 0}
                            disabled={access === 2}
                            onChange={() => {
                                setAccess(1 - access);
                            }}>
                            <span>{t("公開")}</span>
                        </Toggle>
                    </div>
                    {access === 2 && <div>{t("ステージを公開するには、ステージをクリアしてください。")}</div>}
                    <div className="flex flex-row gap-1">
                        <button className="btn completedBtn font-semibold px-4 py-2 shadow-xl bg-slate-200 m-auto hover:bg-slate-100 text-gray-800 w-[10svh] max-w-md">
                            <CheckSvg />
                        </button>
                        {initData && (
                            <button onClick={handleDelete} className="btn dangerBtn font-semibold px-4 py-2 shadow-xl bg-slate-200 m-auto hover:bg-slate-100 text-gray-800 w-[10svh] max-md">
                                <TrashSvg />
                            </button>
                        )}
                    </div>
                </form>
            </div>
            {/* Canvas Area */}
            <div className={`${tab === "test" ? "testScreen" : "editorScreen"} ${tab !== "overview" ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"}`}>
                <div id="cnvWrapper" ref={cnvWrapperRef}></div>
                {/* ステージ */}
                {tab === "stage" && (
                    <>
                        <div className="objs">
                            {selectedTool === "pencil" &&
                                Object.values(textureMap).map((obj, i) => (
                                    <Image
                                        key={i}
                                        className={`objImg ${obj === selectedObj ? "selected" : ""} cursor-pointer`}
                                        src={`/${obj}.png`}
                                        onClick={() => setSelectedObj(obj)}
                                        alt={obj}
                                        width={500}
                                        height={500}
                                        style={{ width: "auto", imageRendering: "pixelated" }}
                                        unoptimized
                                    />
                                ))}
                            {selectedTool === "color" &&
                                Object.values(colorMap).map((color, i) => <div key={i} className={`objImg ${i === selectedColor ? "selected" : ""} cursor-pointer`} style={{ backgroundColor: color || "#ffffff" }} onClick={() => setSelectedColor(i)}></div>)}
                            {(selectedTool === "resize" || selectedTool === "move") && (
                                <>
                                    <div>{t("スナップ：")}</div>
                                    {[1, 0.5].map((n, i) => (
                                        <div key={i}>
                                            <Checkbox
                                                id={`${n}`}
                                                checked={selectedSnap === n}
                                                onChange={() => {
                                                    setSelectedSnap(n as 1 | 0.5);
                                                }}>
                                                <span>{n}</span>
                                            </Checkbox>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                        <div className="tools">
                            {Object.entries(toolMap).map(([key, tool], i) => (
                                <div key={i} className="flex flex-row">
                                    {!isMobile.any && <span className="h-13.75 align-top text-gray-800 m-2 text-2xl">{key}</span>}
                                    <span
                                        className={`toolImg ${selectedTool === tool ? "selected" : ""} cursor-pointer`}
                                        onClick={() => {
                                            setSelectedTool(tool);
                                            clearResizeDot();
                                        }}>
                                        {[<PencilSvg key={i} />, <EraserSvg key={i} />, <MoveSvg key={i} />, <ResizeSvg key={i} />, <BucketSvg key={i} />, <RotateRightSvg key={i} />][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {/* テスト */}
                {tab === "test" && (
                    <>
                        {isLoading && <div className="loadingStage">Loading...</div>}
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
                                <div className="btn next" onClick={handleRestartTest}>
                                    <RestartSvg />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
