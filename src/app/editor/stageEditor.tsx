"use client";

import { useAuth } from "@/app/context";
import { useRouter } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowButton, BucketSvg, Checkbox, CheckSvg, EraserSvg, LeftSvg, MoveSvg, PencilSvg, ResizeSvg, RestartSvg, RestartSvgWhite, RotateRightSvg, Toggle, TrashSvg } from "@/app/components";
import { Angle, MAP_BLOCK_LEN, TextureName, RESOLUTION, STEP, UNIT, textureMap, colorMap, nameStateMap, π, StageType, convertBase, parseBase, PROPS_LEN, EditorTool, toolMap } from "@/constants";
import { loadStage, update } from "@/game/main";
import { Application, Container, Graphics, isMobile, Sprite, Texture, Rectangle, FederatedPointerEvent, BitmapText, Cursor, Ticker } from "pixi.js";
import { getRotatedTexture } from "@/game/base";
import { deleteStage, postStage, putStage } from "../fetch";
import { gunzipSync, gzipSync } from "zlib";
import { GlitchFilter } from "pixi-filters";

export class EditorObj {
    gid: number;
    x: number;
    y: number;
    w: number;
    h: number;
    ang: Angle;
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
        ang: Angle,
        color: number,
        tag: string,
        onContainerClick: (e: FederatedPointerEvent, obj: EditorObj) => void,
        onContainerHover: (obj: EditorObj) => void,
        onResizeDotClick: (obj: EditorObj) => void,
        currentSelectedTool: EditorTool
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
            (currentSelectedTool === "rotate" && !["oneway", "portal_front", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[gid]))
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
    const selectedObjRef = useRef(selectedObj);
    const [selectedTool, setSelectedTool] = useState<EditorTool>("pencil");
    const selectedToolRef = useRef(selectedTool);
    const [selectedColor, setSelectedColor] = useState(0);
    const selectedColorRef = useRef(selectedColor);
    const [selectedSnap, setSelectedSnap] = useState<1 | 0.5>(1);
    const selectedSnapRef = useRef(selectedSnap);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);
    const editorObjsRef = useRef<EditorObj[]>([]);
    const [access, setAccess] = useState(2); //0: public, 1: private, 2: unverified
    const accessRef = useRef(access);

    const addObj = (app: Application, x: number, y: number) => {
        if (selectedObjRef.current === "portal_front") {
            let n = 0;
            const portalNums = editorObjsRef.current.filter((o) => o.tag).map((p) => parseBase(p.tag, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
            while (true) {
                if (!portalNums.includes(n)) break;
                n++;
            }
            const tag = convertBase(n, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
            const portal1 = new EditorObj(7, x, y, 1, 1, 0 as Angle, 0, tag, handleContainerClick, handleContainerHover, handleResizeDotClick, selectedToolRef.current);
            const portal2 = new EditorObj(7, x, y + 1, 1, 1, 180 as Angle, 0, tag, handleContainerClick, handleContainerHover, handleResizeDotClick, selectedToolRef.current);
            portal1.counterpart = portal2;
            portal2.counterpart = portal1;
            const newObjs = [portal1, portal2];
            app.stage.addChild(...newObjs.map((o) => o.container));
            let i = editorObjsRef.current.length;
            while (i > 0 && ["player0", "pushblock", "moveblock_off", "moveblock_on"].includes(textureMap[editorObjsRef.current[i - 1].gid])) i--;
            editorObjsRef.current.splice(i, 0, ...newObjs);
        } else {
            const newObj = new EditorObj(
                Number(Object.keys(textureMap).find((k) => textureMap[Number(k)] === selectedObjRef.current)),
                x,
                y,
                1,
                1,
                0 as Angle,
                0,
                "",
                handleContainerClick,
                handleContainerHover,
                handleResizeDotClick,
                selectedToolRef.current
            );
            app.stage.addChild(newObj.container);
            let i = editorObjsRef.current.length;
            while (i > 0 && ["player0", "pushblock", "moveblock_off", "moveblock_on"].includes(textureMap[editorObjsRef.current[i - 1].gid])) i--;
            editorObjsRef.current.splice(i, 0, newObj);
        }
        setAccess(2);
    };

    const clearResizeDot = () => {
        editorObjsRef.current.forEach((o) => (o.resizeDot.visible = false));
    };

    const handleResizeDotClick = (obj: EditorObj) => {
        const stage = appRef.current?.stage;
        if (!stage) return;
        const onDrag = (e: FederatedPointerEvent) => {
            const snapRatio = selectedSnapRef.current;
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
        if (selectedToolRef.current === "pencil") {
            const pos = e.getLocalPosition(appRef.current.stage);
            addObj(appRef.current, Math.floor(pos.x / UNIT), Math.floor(pos.y / UNIT));
        } else if (selectedToolRef.current === "eraser") {
            const eraseObj = (obj: EditorObj) => {
                obj.container.destroy();
                editorObjsRef.current = editorObjsRef.current.filter((o) => o !== obj);
            };
            eraseObj(obj);
            if (obj.counterpart) eraseObj(obj.counterpart);
        } else if (selectedToolRef.current === "move") {
            const stage = appRef.current.stage;
            const onDrag = (e: FederatedPointerEvent) => {
                const snapUnit = UNIT * selectedSnapRef.current;
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
        } else if (selectedToolRef.current === "resize") {
            clearResizeDot();
            obj.resizeDot.visible = true;
        } else if (selectedToolRef.current === "color") {
            if (["block", "block_deactivated", "key", "oneway", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[obj.gid])) {
                obj.sprite.tint = colorMap[selectedColorRef.current] || "#ffffff";
                obj.color = selectedColorRef.current;
            }
        } else if (selectedToolRef.current === "rotate") {
            if (["oneway", "portal_front", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[obj.gid])) {
                const rotateObj = (obj: EditorObj) => {
                    obj.sprite.texture = getRotatedTexture(nameStateMap[obj.gid].name, nameStateMap[obj.gid].state, (obj.container.children[0] as Sprite).texture.rotate, 90) as Texture;
                    if (obj.ang === 0) obj.ang = 90;
                    else if (obj.ang === 90) obj.ang = 180;
                    else if (obj.ang === 180) obj.ang = -90;
                    else if (obj.ang === -90) obj.ang = 0;
                };
                rotateObj(obj);
                if (obj.counterpart) rotateObj(obj.counterpart);
            }
        }
        setAccess(2);
    };
    const handleContainerHover = (obj: EditorObj) => {
        if (selectedToolRef.current === "resize") {
            clearResizeDot();
            obj.resizeDot.visible = true;
        }
    };

    useEffect(() => {
        selectedObjRef.current = selectedObj;
    }, [selectedObj]);
    useEffect(() => {
        selectedToolRef.current = selectedTool;
        editorObjsRef.current.forEach((obj) => {
            if (selectedTool === "move") {
                obj.container.cursor = "move";
            } else if (selectedTool === "pencil") {
                obj.container.cursor = "crosshair";
            } else if (selectedTool === "color") {
                if (["block", "block_deactivated", "key", "oneway", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[obj.gid])) {
                    obj.container.cursor = "pointer";
                } else {
                    obj.container.cursor = "not-allowed";
                }
            } else if (selectedTool === "rotate") {
                if (["oneway", "portal_front", "lever_off", "button_off", "moveblock_off", "moveblock_on"].includes(textureMap[obj.gid])) {
                    obj.container.cursor = "pointer";
                } else {
                    obj.container.cursor = "not-allowed";
                }
            } else {
                obj.container.cursor = "pointer"; // Default cursor for other tools
            }
        });
    }, [selectedTool]);
    useEffect(() => {
        selectedColorRef.current = selectedColor;
    }, [selectedColor]);
    useEffect(() => {
        selectedSnapRef.current = selectedSnap;
    }, [selectedSnap]);
    useEffect(() => {
        accessRef.current = access;
    }, [access]);

    useEffect(() => {
        if (!user) {
            router.push("/auth/login");
            router.refresh();
        }
    }, [user, router]);

    const handleTileClick = (x: number, y: number) => {
        if (!appRef.current) return;
        if (selectedToolRef.current === "pencil") {
            addObj(appRef.current, x, y);
        }
    };

    // Init App
    useEffect(() => {
        if (initData) {
            setAccess(initData.access);
            editorObjsRef.current = gunzipSync(Buffer.from(initData.code, "base64"))
                .toString("utf-8")
                .split(";")
                .map((o) => {
                    const [base64Mask, joinedMaskedProps] = o.split(":");
                    let mask = parseBase(base64Mask, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_");
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
                        [0, 90, 180, -90][Number(propStrs[5] || 0)] as Angle,
                        Number(propStrs[6] || 0),
                        propStrs[7] || "",
                    ];
                    return new EditorObj(gid, x, y, w, h, ang, color, tag, handleContainerClick, handleContainerHover, handleResizeDotClick, selectedToolRef.current);
                });
            const portals = editorObjsRef.current.filter((o) => o.tag);
            portals.forEach((p) => (p.counterpart = editorObjsRef.current.find((p2) => p2.tag === p.tag && p2 !== p)));
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
            $wrapper.appendChild($cnv);
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
        };
    }, []);

    // Scene manager
    useEffect(() => {
        if (!isAppReady || tab === "overview") return;
        const app = appRef.current;
        if (!app) return;
        // Stop any running game loop
        if (gameLoopId.current) {
            cancelAnimationFrame(gameLoopId.current);
            gameLoopId.current = null;
        }
        // Clear the stage
        app.stage.removeChildren();
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
            editorObjsRef.current.forEach((o) => app.stage.addChild(o.container));
        } else if (tab === "test") {
            app.stage.eventMode = "auto";
            app.stage.hitArea = null;
            // Build test scene
            setIsComplete(false);
            setIsLoading(true);
            loadStage(editorObjsRef.current, app).then(() => {
                setIsLoading(false);
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
                            setIsComplete(true);
                            if (accessRef.current === 2) setAccess(1);
                        }, app);
                        accumulator -= STEP;
                    }
                    prevTime = timestamp;
                    gameLoopId.current = requestAnimationFrame(gameLoop);
                };
                gameLoopId.current = requestAnimationFrame(gameLoop);
            });
        }
    }, [tab, isAppReady, restarter]);

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
    });
    useEffect(() => {
        if (isAppReady && appRef.current?.canvas) {
            appRef.current.canvas.style.width = `${cnvSize}px`;
            appRef.current.canvas.style.height = `${cnvSize}px`;
        }
    }, [cnvSize, isAppReady]);

    const handleSubmit = async (e: React.FormEvent, checkChange: boolean) => {
        e.preventDefault();
        if (!user) {
            router.push("/auth/login");
            router.refresh();
        } else {
            const code = gzipSync(
                editorObjsRef.current
                    .map((o) => {
                        const props = [o.gid, o.x, o.y, o.w === 1 ? null : o.w, o.h === 1 ? null : o.h, o.ang === 0 ? null : [0, 90, 180, -90].indexOf(o.ang), o.color === 0 ? null : o.color, o.tag === "" ? null : o.tag];
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
                    .join(";")
            ).toString("base64");
            if (!code) {
                window.alert("ステージに何も設置されていません。");
            } else {
                const newData = {
                    title: title || "無題",
                    description: description || "",
                    code: code,
                    access: accessRef.current,
                };
                if ((checkChange && (initData?.title !== title || initData.description !== description || initData.code !== code) && window.confirm("変更を保存しますか？")) || !checkChange) {
                    setIsLoading(true);
                    if (initData) {
                        await putStage({
                            id: initData.id,
                            ...newData,
                        });
                    } else {
                        await postStage({
                            creatorId: user.id,
                            ...newData,
                        });
                    }
                    setIsLoading(false);
                }
                router.push("/editor");
                router.refresh();
            }
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (user && window.confirm("本当にこのステージを削除しますか？")) {
            setIsLoading(true);
            const res = await deleteStage(initData?.id as number);
            if (res.ok) {
                window.alert("ステージを削除しました。");
                router.push("/editor");
                router.refresh();
            } else {
                const data = await res.json();
                window.alert(data.message);
            }
            setIsLoading(false);
        }
    };

    const handleRestartTest = () => {
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
                setRestarter((r) => r + 1);
            }, 300);
        } else {
            setRestarter((r) => r + 1);
        }
    };

    return (
        <main id="stage-editor-main" className="text-center">
            <div className="[grid-area:header] flex justify-between items-center px-[2svmin] fixed w-full">
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
                    概要
                </span>
                <span className={`${tab !== "stage" ? "unselected-tab" : ""} w-[25%] h-15 leading-15 text-xl cursor-pointer`} onClick={() => setTab("stage")}>
                    ステージ
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
                    {tab !== "test" ? "テスト" : <RestartSvgWhite />}
                </span>
            </div>
            {/* 概要 */}
            <div className={tab === "overview" ? "" : "hidden"}>
                <div className="flex justify-center items-center">
                    <h1 className="text-[length:10svmin] mt-[15svmin]">{initData ? "ステージ編集" : "新規作成"}</h1>
                </div>
                <form
                    onSubmit={(e) => {
                        handleSubmit(e, false);
                    }}
                    className="flex flex-col justify-center items-center m-auto">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="タイトルを入力"
                        type="text"
                        className="px-4 w-[80svw] max-w-md py-2 my-2 bg-white text-black placeholder-gray-400 border-2 border-gray-600 focus:outline-none focus:border-gray-500 text-[16px]"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="説明を入力"
                        className="px-4 py-2 w-[80svw] max-w-md my-2 h-[20svh] bg-white text-black placeholder-gray-400 border-2 border-gray-600 focus:outline-none focus:border-gray-500 text-[16px]"></textarea>
                    <div className="m-2">
                        <Toggle
                            id="access"
                            checked={access === 0}
                            disabled={access === 2}
                            onChange={() => {
                                setAccess(1 - access);
                            }}
                            children={<span>公開</span>}
                        />
                    </div>
                    {access === 2 && <div>ステージを公開するには、ステージをクリアしてください。</div>}
                    <div className="flex flex-row gap-1">
                        <button className="btn completedBtn font-semibold px-4 py-2 shadow-xl bg-slate-200 m-auto hover:bg-slate-100 text-gray-800 w-[10svh] max-w-md">
                            <CheckSvg />
                        </button>
                        {initData && (
                            <button onClick={handleDelete} className="btn dangerBtn font-semibold px-4 py-2 shadow-xl bg-slate-200 m-auto hover:bg-slate-100 text-gray-800 w-[10svh] max-w-md">
                                <TrashSvg />
                            </button>
                        )}
                    </div>
                </form>
            </div>
            {/* Canvas Area */}
            <div className={tab === "overview" ? "hidden" : tab === "stage" ? "editorScreen" : "testScreen"}>
                <div id="cnvWrapper" ref={cnvWrapperRef}></div>
                {/* ステージ */}
                {tab === "stage" && (
                    <>
                        <div className="objs">
                            {selectedTool === "pencil" && Object.values(textureMap).map((obj, i) => <img key={i} className={`objImg ${obj === selectedObj ? "selected" : ""} cursor-pointer`} src={`/${obj}.png`} onClick={() => setSelectedObj(obj)}></img>)}
                            {selectedTool === "color" &&
                                Object.values(colorMap).map((color, i) => <div key={i} className={`objImg ${i === selectedColor ? "selected" : ""} cursor-pointer`} style={{ backgroundColor: color || "#ffffff" }} onClick={() => setSelectedColor(i)}></div>)}
                            {(selectedTool === "resize" || selectedTool === "move") && (
                                <>
                                    <div>スナップ：</div>
                                    {[1, 0.5].map((n, i) => (
                                        <div key={i}>
                                            <Checkbox
                                                id={`${n}`}
                                                checked={selectedSnap === n}
                                                onChange={() => {
                                                    setSelectedSnap(n as 1 | 0.5);
                                                }}
                                                children={<span>{n}</span>}
                                            />
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
                                        {[<PencilSvg />, <EraserSvg />, <MoveSvg />, <ResizeSvg />, <BucketSvg />, <RotateRightSvg />][i]}
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
