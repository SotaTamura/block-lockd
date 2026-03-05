import { angFrom, Angle, colorMap, Direction, SFX_MIN_INTERVAL, UNIT, π, SCALE } from "@/constants";
import { Block, Box, GameObj, Portal, SpriteBox, Oneway } from "./class";
import { Assets, Texture, TilingSprite, groupD8, Sprite, AnimatedSprite, Graphics, Application, BitmapText } from "pixi.js";
import { blocks, gameObjs, particles, portals } from "./main";
import { GlitchFilter } from "pixi-filters";

// キーイベント
export const pressingEvent: Record<Direction, boolean> = {
    u: false,
    d: false,
    l: false,
    r: false,
}; // 押し中
export const pressingTimeForKeyboard: Record<Direction, number> = {
    u: 0,
    d: 0,
    l: 0,
    r: 0,
};
export let pressStartEvent: Record<Direction, boolean> = {
    u: false,
    d: false,
    l: false,
    r: false,
}; // 押し始め
const keyMap: Record<string, Direction> = {
    ArrowUp: "u",
    w: "u",
    " ": "u",
    ArrowDown: "d",
    s: "d",
    ArrowLeft: "l",
    a: "l",
    ArrowRight: "r",
    d: "r",
};
// 押し始めイベントをリセット
export const clearPressStart = () => {
    pressStartEvent = { u: false, d: false, l: false, r: false };
};
// 箱の回転
export const rotate = (box: Box, ang: Direction, originW: number, originH: number) => {
    if (ang === "u") return;
    const convertedRelX = (box.rel.x * originH) / originW;
    const convertedRelY = (box.rel.y * originW) / originH;
    const convertedW = (box.sz.x * originH) / originW;
    const convertedH = (box.sz.y * originW) / originH;
    if (ang === "r") {
        box.rel.x = originW - (convertedRelY + convertedH);
        box.rel.y = convertedRelX;
        box.sz.x = convertedH;
        box.sz.y = convertedW;
    } else if (ang === "d") {
        box.rel.x = originW - (box.rel.x + box.sz.x);
        box.rel.y = originH - (box.rel.y + box.sz.y);
    } else if (ang === "l") {
        box.rel.x = convertedRelY;
        box.rel.y = originH - (convertedRelX + convertedW);
        box.sz.x = convertedH;
        box.sz.y = convertedW;
    }
    if (box instanceof SpriteBox) rotate(box.origin, ang, originW, originH);
};
// 画像
export type TextureData =
    | Texture
    | {
          textures: Texture[];
          animationSpeed: number;
      };
export const generatedTextures: Map<string, TextureData> = new Map();
// sprite加工
export const getTexture = (name: string, state: string, newRotId: number): TextureData => {
    const key = `${name}_${state}_${newRotId}`;
    const texture = generatedTextures.get(key);
    if (texture) return texture;
    else {
        const baseTexture = generatedTextures.get(`${name}_${state}_0`);
        if (!baseTexture) throw new Error(`baseTexture with key ${name}_${state}_0 not found`);
        let newTexture: TextureData;
        if ("textures" in baseTexture) {
            newTexture = {
                textures: baseTexture.textures.map(
                    (texture) =>
                        new Texture({
                            source: texture.source,
                            rotate: newRotId,
                        }),
                ),
                animationSpeed: baseTexture.animationSpeed,
            };
        } else {
            newTexture = new Texture({
                source: baseTexture.source,
                rotate: newRotId,
            });
        }
        generatedTextures.set(key, newTexture);
        return newTexture;
    }
};
export const editTexture = (obj: GameObj, newTextureData: TextureData) => {
    if ("textures" in newTextureData) {
        const { textures, animationSpeed } = newTextureData;
        obj.container.children.forEach((child) => {
            if (child instanceof AnimatedSprite) {
                const sprite = child;
                if (sprite.textures !== textures) {
                    sprite.textures = textures;
                    sprite.animationSpeed = animationSpeed;
                }
                if (!sprite.playing) {
                    sprite.play();
                }
            }
        });
    } else {
        obj.container.children.forEach((child) => {
            if (child instanceof Sprite) {
                const sprite = child;
                if (sprite.texture === newTextureData) return;
                sprite.texture = newTextureData;
            }
        });
    }
};
export const getRotatedTexture = (name: string, state: string, rotId: number, ang: Direction | Angle) => {
    const angle = typeof ang === "string" ? angFrom[ang] : ang;
    return getTexture(name, state, groupD8.add((8 - angle / 45) % 8, rotId));
};
export const rotateTexture = (obj: GameObj, ang: Direction | Angle) => {
    const firstSprite = obj.container.children.find((c) => c instanceof Sprite || c instanceof AnimatedSprite) as Sprite | AnimatedSprite | undefined;
    if (firstSprite) {
        editTexture(obj, getRotatedTexture(obj.name, obj.state, firstSprite.texture.rotate, ang));
    }
};
export const getXFlippedTexture = (name: string, state: string, rotId: number) => getTexture(name, state, groupD8.add(groupD8.MIRROR_HORIZONTAL, rotId));
export const xFlipTexture = (obj: GameObj) => {
    const firstSprite = obj.container.children.find((c) => c instanceof Sprite || c instanceof AnimatedSprite) as Sprite | AnimatedSprite | undefined;
    if (firstSprite) {
        editTexture(obj, getXFlippedTexture(obj.name, obj.state, firstSprite.texture.rotate));
    }
};
export const getStateTexture = (name: string, newState: string, rotId: number) => getTexture(name, newState, rotId);
export const stateChangeTexture = (obj: GameObj, newState: string) => {
    if (obj.state === newState) return;
    obj.state = newState;
    const firstSprite = obj.container.children.find((c) => c instanceof Sprite || c instanceof AnimatedSprite) as Sprite | AnimatedSprite | undefined;
    if (firstSprite) {
        editTexture(obj, getStateTexture(obj.name, newState, firstSprite.texture.rotate));
    }
};
// spriteを描画する
export const drawSprite = (obj: GameObj) => {
    const container = obj.container;
    const firstSprite = container.children.find((c) => c instanceof Sprite || c instanceof AnimatedSprite) as Sprite | AnimatedSprite | undefined;
    const rotId = firstSprite?.texture.rotate ?? 0;

    const existingSprites = container.children.filter((c) => c instanceof Sprite || c instanceof AnimatedSprite) as (Sprite | AnimatedSprite)[];

    if (existingSprites.length !== obj.spriteBoxes.length || obj.needsRedraw) {
        let prevFrame = 0;
        let prevPlaying = true;
        if (existingSprites.length > 0) {
            if (existingSprites[0] instanceof AnimatedSprite) {
                prevFrame = existingSprites[0].currentFrame;
                prevPlaying = existingSprites[0].playing;
            } else {
                prevPlaying = false;
            }
        }

        const removed = container.removeChildren();
        for (const child of removed) {
            child.destroy({ children: true });
        }

        obj.spriteBoxes.forEach((spriteBox) => {
            let sprite;
            const textureData = generatedTextures.get(`${obj.name}_${obj.state}_0`);
            if (!textureData) throw new Error(`baseTexture with key ${obj.name}_${obj.state}_0 not found`);
            if ("textures" in textureData) {
                sprite = new AnimatedSprite(textureData.textures);
                sprite.animationSpeed = textureData.animationSpeed;
                sprite.gotoAndPlay(prevFrame % textureData.textures.length);
                if (!prevPlaying) sprite.stop();
            } else {
                sprite = new Sprite(textureData);
            }
            sprite.anchor.set(0);
            sprite.x = (spriteBox.origin.rel.x / SCALE) * UNIT;
            sprite.y = (spriteBox.origin.rel.y / SCALE) * UNIT;
            sprite.width = (spriteBox.origin.sz.x / SCALE) * UNIT;
            sprite.height = (spriteBox.origin.sz.y / SCALE) * UNIT;
            container.addChild(sprite);
            if (!(spriteBox.rel.x === spriteBox.origin.rel.x && spriteBox.rel.y === spriteBox.origin.rel.y && spriteBox.sz.x === spriteBox.origin.sz.x && spriteBox.sz.y === spriteBox.origin.sz.y)) {
                const mask = new Graphics().rect((spriteBox.rel.x / SCALE) * UNIT, (spriteBox.rel.y / SCALE) * UNIT, (spriteBox.sz.x / SCALE) * UNIT, (spriteBox.sz.y / SCALE) * UNIT).fill();
                container.addChild(mask);
                sprite.mask = mask;
            }
        });
        obj.needsRedraw = false;
    } else {
        obj.spriteBoxes.forEach((spriteBox, i) => {
            const sprite = existingSprites[i];
            sprite.x = (spriteBox.origin.rel.x / SCALE) * UNIT;
            sprite.y = (spriteBox.origin.rel.y / SCALE) * UNIT;
            sprite.width = (spriteBox.origin.sz.x / SCALE) * UNIT;
            sprite.height = (spriteBox.origin.sz.y / SCALE) * UNIT;

            if (!(spriteBox.rel.x === spriteBox.origin.rel.x && spriteBox.rel.y === spriteBox.origin.rel.y && spriteBox.sz.x === spriteBox.origin.sz.x && spriteBox.sz.y === spriteBox.origin.sz.y)) {
                if (sprite.mask && sprite.mask instanceof Graphics) {
                    sprite.mask
                        .clear()
                        .rect((spriteBox.rel.x / SCALE) * UNIT, (spriteBox.rel.y / SCALE) * UNIT, (spriteBox.sz.x / SCALE) * UNIT, (spriteBox.sz.y / SCALE) * UNIT)
                        .fill();
                } else {
                    const mask = new Graphics().rect((spriteBox.rel.x / SCALE) * UNIT, (spriteBox.rel.y / SCALE) * UNIT, (spriteBox.sz.x / SCALE) * UNIT, (spriteBox.sz.y / SCALE) * UNIT).fill();
                    container.addChild(mask);
                    sprite.mask = mask;
                }
            } else {
                if (sprite.mask) {
                    const mask = sprite.mask as Graphics;
                    sprite.mask = null;
                    mask.destroy();
                }
            }
        });
    }

    editTexture(obj, getTexture(obj.name, obj.state, rotId));
};
// sprite初期化
export const setSprite = (obj: GameObj, app: Application) => {
    const container = obj.container;
    container.x = (obj.x / SCALE) * UNIT;
    container.y = (obj.y / SCALE) * UNIT;
    container.width = UNIT;
    container.height = UNIT;
    drawSprite(obj);
    if (obj.color) container.tint = colorMap[obj.color]!;
    rotateTexture(obj, obj.dir);
    app.stage.addChild(container);
};
// 点線囲い
const blockDashLine = (obj: Block) => {
    const lineTexture = generatedTextures.get("block_deactivatedLine_0") as Texture;
    const w = (obj.spriteBoxes[0].sz.x / SCALE) * UNIT;
    const h = (obj.spriteBoxes[0].sz.y / SCALE) * UNIT;
    const borderThickness = 0.125 * UNIT;
    const scale = borderThickness / lineTexture.height;
    // 上辺
    const tEdge = new TilingSprite({
        texture: lineTexture,
        width: w,
        height: borderThickness,
    });
    tEdge.x = 0;
    tEdge.y = 0;
    tEdge.tileScale = { x: scale * 2, y: scale };
    obj.container.addChild(tEdge);
    // 下辺
    const bEdge = new TilingSprite({
        texture: lineTexture,
        width: w,
        height: borderThickness,
    });
    bEdge.rotation = π;
    bEdge.x = w;
    bEdge.y = h;
    bEdge.tileScale = { x: scale * 2, y: scale };
    obj.container.addChild(bEdge);
    // 左辺
    const lEdge = new TilingSprite({
        texture: lineTexture,
        width: h,
        height: borderThickness,
    });
    lEdge.rotation = -π / 2;
    lEdge.x = 0;
    lEdge.y = h;
    lEdge.tileScale = { x: scale * 2, y: scale };
    obj.container.addChild(lEdge);
    // 右辺
    const rEdge = new TilingSprite({
        texture: lineTexture,
        width: h,
        height: borderThickness,
    });
    rEdge.rotation = π / 2;
    rEdge.x = w;
    rEdge.y = 0;
    rEdge.tileScale = { x: scale * 2, y: scale };
    obj.container.addChild(rEdge);
};
// portalのアルファベットと後ろの画像
const drawPortal = (portal: Portal, app: Application) => {
    // アルファベット
    const portalText = new BitmapText({
        text: portal.id,
        x: ((portal.x + portal.spriteBoxes[0].sz.x / 2) / SCALE) * UNIT,
        y: ((portal.y + portal.spriteBoxes[0].sz.y / 2) / SCALE) * UNIT,
        style: {
            fontFamily: ["Makinas", "sans-serif"],
            fontSize: (3 / 4) * UNIT,
            fill: 0x000000,
            stroke: { color: 0xffffff, width: 10, join: "round" },
            align: "center",
        },
    });
    portalText.anchor.set(0.5);
    app.stage.addChild(portalText);
    // 後ろの画像
    if (portal.backContainer.children.length === 0) {
        const textureData = getRotatedTexture("portal", "back", 0, portal.dir) as { textures: Texture[]; animationSpeed: number };
        const { textures, animationSpeed } = textureData;
        if (!textures) throw new Error("Portal back texture should be an animation");
        const sprite = new AnimatedSprite(textures);
        sprite.animationSpeed = animationSpeed;
        sprite.play();
        const [w, h] = [portal.spriteBoxes[0].sz.x, portal.spriteBoxes[0].sz.y];
        if (portal.dir === "u") {
            sprite.x = 0;
            sprite.y = -(h / SCALE) * UNIT;
        } else if (portal.dir === "r") {
            sprite.x = (w / SCALE) * UNIT;
            sprite.y = 0;
        } else if (portal.dir === "d") {
            sprite.x = 0;
            sprite.y = (h / SCALE) * UNIT;
        } else if (portal.dir === "l") {
            sprite.x = -(w / SCALE) * UNIT;
            sprite.y = 0;
        }
        sprite.width = (w / SCALE) * UNIT;
        sprite.height = (h / SCALE) * UNIT;
        portal.backContainer.addChild(sprite);
        portal.backContainer.x = (portal.x / SCALE) * UNIT;
        portal.backContainer.y = (portal.y / SCALE) * UNIT;
        portal.backContainer.zIndex = -1;
        app.stage.addChild(portal.backContainer);
    }
};
// 描画更新
export const updateSprites = () => {
    gameObjs.forEach((obj) => {
        const container = obj.container;
        container.x = (obj.x / SCALE) * UNIT;
        container.y = (obj.y / SCALE) * UNIT;
        // オフ状態のブロックを半透明にする
        if (obj instanceof Block) {
            obj.container.children.forEach((child) => {
                if (!obj.isSolid && !(child instanceof TilingSprite)) {
                    child.alpha = 0.2;
                } else child.alpha = 1;
            });
        }
        // ポータルをまたがっている場合や、再描画フラグが立っている場合は再描画
        if (obj.needsRedraw || obj.spriteBoxes.some((s) => Object.values(s.counterpart).some((c) => c !== null))) {
            drawSprite(obj);
            obj.needsRedraw = false;
        }
        // ポータルの前後アニメーションを同期
        if (obj instanceof Portal) {
            const frontSprite = obj.container.children.find((c) => c instanceof AnimatedSprite) as AnimatedSprite;
            const backSprite = obj.backContainer.children.find((c) => c instanceof AnimatedSprite) as AnimatedSprite;
            if (frontSprite && backSprite) {
                backSprite.currentFrame = frontSprite.currentFrame;
            }
            obj.backContainer.x = container.x;
            obj.backContainer.y = container.y;
        }
    });

    particles.forEach((p) => {
        p.container.x = (p.x / SCALE) * UNIT;
        p.container.y = (p.y / SCALE) * UNIT;
        if (p.container.children.length === 0) {
            const size = (p.size / SCALE) * UNIT;
            const g = new Graphics();
            g.rect(-size / 2, -size / 2, size, size).fill({ color: p.color, alpha: 0.6 });
            p.container.addChild(g);
            p.container.rotation = Math.random() * π * 2;
        }
        p.container.rotation += 0.1; // くるくる回す
        p.container.alpha = p.life / p.maxLife;
    });
};
// デバッグ表示
export const drawDebug = ($debug: HTMLCanvasElement, gameObjs: GameObj[]) => {
    const ctx = $debug.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, $debug.width, $debug.height);
    for (const obj of gameObjs) {
        const drawSide = (sideX1: number, sideY1: number, sideX2: number, sideY2: number, strength: number) => {
            ctx.lineWidth = Math.max(2, strength / 4000);
            ctx.strokeStyle = strength > 15000 ? "#f00" : strength > 8000 ? "#ff0" : "#0f0";
            ctx.beginPath();
            ctx.moveTo(sideX1, sideY1);
            ctx.lineTo(sideX2, sideY2);
            ctx.stroke();
        };

        if (obj instanceof Oneway) {
            for (const hitbox of obj.hitboxes) {
                const x = (hitbox.x / SCALE) * UNIT;
                const y = (hitbox.y / SCALE) * UNIT;
                const w = (hitbox.sz.x / SCALE) * UNIT;
                const h = (hitbox.sz.y / SCALE) * UNIT;
                if (obj.dir === "u") drawSide(x, y, x + w, y, obj.strength.u);
                else if (obj.dir === "d") drawSide(x, y + h, x + w, y + h, obj.strength.d);
                else if (obj.dir === "l") drawSide(x, y, x, y + h, obj.strength.l);
                else if (obj.dir === "r") drawSide(x + w, y, x + w, y + h, obj.strength.r);
            }
        } else {
            if (obj instanceof Block && !obj.isSolid) continue;
            for (const hitbox of obj.hitboxes) {
                const x = (hitbox.x / SCALE) * UNIT;
                const y = (hitbox.y / SCALE) * UNIT;
                const w = (hitbox.sz.x / SCALE) * UNIT;
                const h = (hitbox.sz.y / SCALE) * UNIT;

                drawSide(x, y, x + w, y, obj.strength.u);
                drawSide(x, y + h, x + w, y + h, obj.strength.d);
                drawSide(x, y, x, y + h, obj.strength.l);
                drawSide(x + w, y, x + w, y + h, obj.strength.r);
            }
        }
        if (obj instanceof Portal) {
            const t = obj.trigger;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#000";
            ctx.strokeRect((t.x / SCALE) * UNIT, (t.y / SCALE) * UNIT, (t.sz.x / SCALE) * UNIT, (t.sz.y / SCALE) * UNIT);
        }
        for (const hitbox of obj.hiddenHitboxes) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#0f0";
            ctx.strokeRect((hitbox.x / SCALE) * UNIT, (hitbox.y / SCALE) * UNIT, (hitbox.sz.x / SCALE) * UNIT, (hitbox.sz.y / SCALE) * UNIT);
        }
    }
};
// グリッチ
export const glitch = (app: Application, time: number) => {
    const glitchFilter = new GlitchFilter({
        slices: 10,
        offset: 10,
        direction: 0,
        fillMode: 0,
        red: { x: 0, y: 0 },
        blue: { x: 0, y: 0 },
        green: { x: 0, y: 0 },
    });
    app.stage.filters = [glitchFilter];
    let count = 0;
    const ticker = () => {
        if (count % 4 === 0) {
            glitchFilter.seed = Math.random();
            glitchFilter.offset = (Math.random() - 0.5) * 200;
            glitchFilter.red = { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 };
            glitchFilter.blue = { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 };
            glitchFilter.green = { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 };
        }
        count++;
    };
    app.ticker.add(ticker);
    setTimeout(() => {
        if (!app.renderer) return;
        app.ticker.remove(ticker);
        app.stage.filters = [];
    }, time);
};
// キャンバスのフェードイン
export const showStage = (app: Application, skipFadeIn: boolean) => {
    if (skipFadeIn) {
        for (const block of blocks) blockDashLine(block);
        for (const portal of portals) drawPortal(portal, app);
        return;
    }
    app.stage.sortableChildren = true;
    // フェードインアニメーション
    const overlay = new Graphics().fill(0x000000).rect(0, 0, app.screen.width, app.screen.height);
    overlay.zIndex = 1000;
    app.stage.addChild(overlay);
    gameObjs.forEach((obj) => {
        obj.container.scale.set(0);
        obj.container.alpha = 0;
    });
    let elapsed = 0;
    const duration = 20;
    const fadeOut = (ticker: { deltaTime: number }) => {
        elapsed += ticker.deltaTime;
        const progress = elapsed / duration;
        overlay.alpha = 1 - progress;
        gameObjs.forEach((obj) => {
            obj.container.alpha = progress;
            obj.container.scale.set(Math.min(progress, 1));
        });
        if (progress >= 1) {
            app.stage.removeChild(overlay);
            overlay.destroy();
            app.ticker.remove(fadeOut);
            for (const block of blocks) blockDashLine(block);
            for (const portal of portals) drawPortal(portal, app);
        }
    };
    app.ticker.add(fadeOut);
};
// 音声
export const BGM_PATHS = ["/menu.mp3", "/bgm0.mp3", "/bgm1.mp3", "/bgm2.mp3", "/bgm3.mp3", "/bgm4.mp3", "/bgm5.mp3", "/bgm6.mp3"] as const;
export const SFX_PATHS = ["/walk.mp3", "/jump.mp3", "/key.mp3", "/ladder.mp3", "/lever.mp3", "/button.mp3", "/restart.mp3", "/goal.mp3", "/landing.mp3", "/pushblock.mp3", "/pushblocklanding.mp3", "/portal.mp3"] as const;
export type BgmPath = (typeof BGM_PATHS)[number];
export type SfxPath = (typeof SFX_PATHS)[number];
export const bgmBuffers: Map<BgmPath, AudioBuffer> = new Map();
export const sfxBuffers: Map<SfxPath, AudioBuffer> = new Map();
let currentBgm: BgmPath | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let bgmGain: GainNode | null = null;
const activeSfx: Map<SfxPath, { buffer: AudioBufferSourceNode; lastPlayed: number }> = new Map();
let audioContext: AudioContext | null = null;
function getAudioContext() {
    if (typeof window === "undefined") return null;
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContext = new AudioContextClass();
    }
    return audioContext;
}
export async function loadAudio(path: BgmPath | SfxPath): Promise<AudioBuffer> {
    const ctx = getAudioContext();
    if (!ctx) throw new Error("AudioContext not available");
    if (ctx.state === "suspended") {
        await ctx.resume();
    }
    return await ctx.decodeAudioData(await (await fetch(path)).arrayBuffer());
}
export async function loadAllBgm() {
    const buffers = await Promise.all(
        BGM_PATHS.map(async (p) => {
            try {
                return await loadAudio(p);
            } catch (e) {
                console.error(`Failed to load BGM: ${p}`, e);
                return null;
            }
        }),
    );
    BGM_PATHS.forEach((p, i) => {
        const buffer = buffers[i];
        if (buffer) bgmBuffers.set(p, buffer);
    });
}
export async function loadAllSfx() {
    const buffers = await Promise.all(
        SFX_PATHS.map(async (p) => {
            try {
                return await loadAudio(p);
            } catch (e) {
                console.error(`Failed to load SFX: ${p}`, e);
                return null;
            }
        }),
    );
    SFX_PATHS.forEach((p, i) => {
        const buffer = buffers[i];
        if (buffer) sfxBuffers.set(p, buffer);
    });
}
export function stopBgm() {
    if (bgmSource) {
        bgmSource.stop();
        bgmSource.disconnect();
        bgmSource = null;
        bgmGain = null;
    }
    currentBgm = null;
}
export function playBgm(path: BgmPath) {
    if (path === currentBgm) return;
    const buffer = bgmBuffers.get(path);
    if (!buffer) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    stopBgm();
    bgmSource = ctx.createBufferSource();
    bgmSource.buffer = buffer;
    bgmSource.loop = true;
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.5;
    bgmSource.connect(bgmGain);
    bgmGain.connect(ctx.destination);
    bgmSource.start(0);
    currentBgm = path;
}
let sfxGain: GainNode | null = null;
function getSfxGain() {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (!sfxGain) {
        sfxGain = ctx.createGain();
        sfxGain.connect(ctx.destination);
    }
    return sfxGain;
}
export function stopSfx(path: SfxPath, obj: GameObj | null) {
    if (obj && !obj.playedSfxs.includes(path)) return;
    const source = activeSfx.get(path)?.buffer;
    if (!source) return;
    if (obj) obj.playedSfxs = obj.playedSfxs.filter((p) => p !== path);
    source.stop();
    source.disconnect();
    activeSfx.delete(path);
}
export function playSfx(path: SfxPath, obj: GameObj | null, volume: number = 1, disableDuplicate: boolean = false, pitch: number = 1) {
    const now = performance.now();
    if (activeSfx.has(path) && (disableDuplicate || now - activeSfx.get(path)!.lastPlayed < SFX_MIN_INTERVAL)) return;
    const buffer = sfxBuffers.get(path);
    if (!buffer) return;
    if (obj) obj.playedSfxs.push(path);
    const ctx = getAudioContext();
    if (!ctx) return;
    const sfxGain = getSfxGain();
    if (!sfxGain) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitch;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(sfxGain);
    activeSfx.set(path, { buffer: source, lastPlayed: now });
    source.start(0);
    source.onended = () => {
        if (activeSfx.get(path)?.buffer === source) activeSfx.delete(path);
        source.disconnect();
        gain.disconnect();
    };
}

// 初期化関数
export async function onLoad() {
    // キーイベント
    document.addEventListener("keydown", (e) => {
        if (!Object.keys(keyMap).includes(e.key)) return;
        const direction = keyMap[e.key];
        pressingEvent[direction] = true;
        pressStartEvent[direction] = !pressingTimeForKeyboard[direction] ? true : false;
        pressingTimeForKeyboard[direction] = pressingTimeForKeyboard[direction] >= 0 ? pressingTimeForKeyboard[direction] + 1 : 0;
    });
    document.addEventListener("keyup", (e) => {
        if (!Object.keys(keyMap).includes(e.key)) return;
        const direction = keyMap[e.key];
        pressingEvent[direction] = false;
        pressingTimeForKeyboard[direction] = 0;
        pressStartEvent[direction] = false;
    });

    // 画像のパスを配列にまとめる
    const assetUrls = [
        ...Array.from({ length: 8 }, (_, i) => `/player${i}.png`),
        ...Array.from({ length: 3 }, (_, i) => `/portal_front${i}.png`),
        ...Array.from({ length: 3 }, (_, i) => `/portal_back${i}.png`),
        "/block.png",
        "/block_deactivated.png",
        "/block_deactivated_line.png",
        "/ladder.png",
        "/key.png",
        "/oneway.png",
        "/lever_off.png",
        "/lever_on.png",
        "/pushblock.png",
        "/button_off.png",
        "/button_on.png",
        "/moveblock_off.png",
        "/moveblock_on.png",
    ];
    // すべてのアセットを並行して読み込む
    const textures = await Assets.load(assetUrls);
    // 読み込んだテクスチャをgeneratedTexturesに割り当てる
    const playerTextures = Array.from({ length: 8 }, (_, i) => textures[`/player${i}.png`]);
    const portalFrontTextures = Array.from({ length: 3 }, (_, i) => textures[`/portal_front${i}.png`]);
    const portalBackTextures = Array.from({ length: 3 }, (_, i) => textures[`/portal_back${i}.png`]);
    generatedTextures.set("player_static_0", playerTextures[0]);
    generatedTextures.set("player_idle_0", { textures: [playerTextures[0], playerTextures[7]], animationSpeed: 0.015625 });
    generatedTextures.set("player_walk_0", {
        textures: [playerTextures[1], playerTextures[0], playerTextures[2], playerTextures[0]],
        animationSpeed: 0.125,
    });
    generatedTextures.set("player_jump_0", { textures: [playerTextures[3]], animationSpeed: 0.125 });
    generatedTextures.set("player_ladderMove_0", { textures: [playerTextures[4], playerTextures[5]], animationSpeed: 0.125 });
    generatedTextures.set("player_ladderIdle_0", { textures: [playerTextures[6]], animationSpeed: 0.125 });
    generatedTextures.set("block_default_0", textures["/block.png"]);
    generatedTextures.set("block_deactivatedLine_0", textures["/block_deactivated_line.png"]);
    generatedTextures.set("block_deactivated_0", textures["/block_deactivated.png"]);
    generatedTextures.set("ladder_default_0", textures["/ladder.png"]);
    generatedTextures.set("key_default_0", textures["/key.png"]);
    generatedTextures.set("oneway_default_0", textures["/oneway.png"]);
    generatedTextures.set("lever_off_0", textures["/lever_off.png"]);
    generatedTextures.set("lever_on_0", textures["/lever_on.png"]);
    generatedTextures.set("portal_static_0", portalFrontTextures[0]);
    generatedTextures.set("portal_front_0", { textures: portalFrontTextures, animationSpeed: 0.0625 });
    generatedTextures.set("portal_back_0", { textures: portalBackTextures, animationSpeed: 0.0625 });
    generatedTextures.set("pushBlock_default_0", textures["/pushblock.png"]);
    generatedTextures.set("button_off_0", textures["/button_off.png"]);
    generatedTextures.set("button_on_0", textures["/button_on.png"]);
    generatedTextures.set("moveBlock_off_0", textures["/moveblock_off.png"]);
    generatedTextures.set("moveBlock_on_0", textures["/moveblock_on.png"]);
    assetUrls.forEach((url) => {
        const texture = textures[url];
        if (texture) {
            texture.source.scaleMode = "nearest";
        }
    });
}
