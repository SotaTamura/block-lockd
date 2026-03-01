import { angFrom, Angle, colorMap, Direction, SFX_MIN_INTERVAL, UNIT, π, INTERNAL_SCALE } from "@/constants";
import { Block, Box, GameObj, Portal, SpriteBox } from "./class";
import { Assets, Texture, TilingSprite, groupD8, Sprite, AnimatedSprite, Graphics, Application } from "pixi.js";
import { gameObjs } from "./main";
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
export const generatedTextures: Map<string, Texture | Texture[]> = new Map();
// sprite加工
export const getTexture = (name: string, state: string, newRotId: number) => {
    const key = `${name}_${state}_${newRotId}`;
    const texture = generatedTextures.get(key);
    if (texture) return texture;
    else {
        const baseTexture = generatedTextures.get(`${name}_${state}_0`);
        if (!baseTexture) throw new Error(`baseTexture with key ${name}_${state}_0 not found`);
        let newTexture: typeof baseTexture;
        if (Array.isArray(baseTexture)) {
            newTexture = baseTexture.map(
                (texture) =>
                    new Texture({
                        source: texture.source,
                        rotate: newRotId,
                    }),
            );
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
export const editTexture = (obj: GameObj, newTexture: Texture | Texture[]) => {
    if (Array.isArray(newTexture)) {
        obj.container.children.forEach((child) => {
            if (child instanceof AnimatedSprite) {
                const sprite = child;
                sprite.textures = newTexture;
                if (!sprite.playing) {
                    sprite.play();
                }
            }
        });
    } else {
        obj.container.children.forEach((child) => {
            if (child instanceof Sprite) {
                const sprite = child;
                sprite.texture = newTexture;
            }
        });
    }
};
export const getRotatedTexture = (name: string, state: string, rotId: number, ang: Direction | Angle) => {
    const angle = typeof ang === "string" ? angFrom[ang] : ang;
    return getTexture(name, state, groupD8.add((8 - angle / 45) % 8, rotId));
};
export const rotateTexture = (obj: GameObj, ang: Direction | Angle) => {
    editTexture(obj, getRotatedTexture(obj.name, obj.state, (obj.container.children[0] as Sprite).texture.rotate, ang));
};
export const getXFlippedTexture = (name: string, state: string, rotId: number) => getTexture(name, state, groupD8.add(groupD8.MIRROR_HORIZONTAL, rotId));
export const xFlipTexture = (obj: GameObj) => {
    editTexture(obj, getXFlippedTexture(obj.name, obj.state, (obj.container.children[0] as Sprite).texture.rotate));
};
export const getStateTexture = (name: string, newState: string, rotId: number) => getTexture(name, newState, rotId);
export const stateChangeTexture = (obj: GameObj, newState: string) => {
    if (obj.state === newState) return;
    obj.state = newState;
    editTexture(obj, getStateTexture(obj.name, newState, (obj.container.children[0] as Sprite).texture.rotate));
};
// spriteを描画する
export const drawSprite = (obj: GameObj, app: Application) => {
    const container = obj.container;
    const rotId = (obj.container.children[0] as Sprite | undefined)?.texture.rotate ?? 0;
    const removed = container.removeChildren();
    for (const child of removed) {
        child.destroy({ children: true });
    }
    obj.spriteBoxes.forEach((spriteBox) => {
        let sprite;
        const texture = generatedTextures.get(`${obj.name}_${obj.state}_0`);
        if (!texture) throw new Error(`baseTexture with key ${obj.name}_${obj.state}_0 not found`);
        else if (Array.isArray(texture)) {
            sprite = new AnimatedSprite(texture);
            sprite.animationSpeed = 0.125;
        } else {
            sprite = new Sprite(generatedTextures.get(`${obj.name}_${obj.state}_0`) as Texture);
        }
        sprite.anchor.set(0);
        sprite.x = (spriteBox.origin.rel.x / INTERNAL_SCALE) * UNIT;
        sprite.y = (spriteBox.origin.rel.y / INTERNAL_SCALE) * UNIT;
        sprite.width = (spriteBox.origin.sz.x / INTERNAL_SCALE) * UNIT;
        sprite.height = (spriteBox.origin.sz.y / INTERNAL_SCALE) * UNIT;
        container.addChild(sprite);
        if (!(spriteBox.rel.x === spriteBox.origin.rel.x && spriteBox.rel.y === spriteBox.origin.rel.y && spriteBox.sz.x === spriteBox.origin.sz.x && spriteBox.sz.y === spriteBox.origin.sz.y)) {
            const mask = new Graphics().rect((spriteBox.rel.x / INTERNAL_SCALE) * UNIT, (spriteBox.rel.y / INTERNAL_SCALE) * UNIT, (spriteBox.sz.x / INTERNAL_SCALE) * UNIT, (spriteBox.sz.y / INTERNAL_SCALE) * UNIT).fill();
            container.addChild(mask);
            sprite.mask = mask;
        }
    });
    editTexture(obj, getTexture(obj.name, obj.state, rotId));
    if (obj instanceof Portal) {
        const sprite = new Sprite(getRotatedTexture("portal", "back", 0, obj.dir) as Texture);
        const [l, r, u, d, w, h] = [obj.spriteBoxes[0].l, obj.spriteBoxes[0].r, obj.spriteBoxes[0].u, obj.spriteBoxes[0].d, obj.spriteBoxes[0].sz.x, obj.spriteBoxes[0].sz.y];
        if (obj.dir === "u") {
            sprite.x = (l / INTERNAL_SCALE) * UNIT;
            sprite.y = ((u - h) / INTERNAL_SCALE) * UNIT;
        } else if (obj.dir === "r") {
            sprite.x = (r / INTERNAL_SCALE) * UNIT;
            sprite.y = (u / INTERNAL_SCALE) * UNIT;
        } else if (obj.dir === "d") {
            sprite.x = (l / INTERNAL_SCALE) * UNIT;
            sprite.y = (d / INTERNAL_SCALE) * UNIT;
        } else if (obj.dir === "l") {
            sprite.x = ((l - w) / INTERNAL_SCALE) * UNIT;
            sprite.y = (u / INTERNAL_SCALE) * UNIT;
        }
        sprite.width = (w / INTERNAL_SCALE) * UNIT;
        sprite.height = (h / INTERNAL_SCALE) * UNIT;
        sprite.zIndex = -1;
        app.stage.addChild(sprite);
    }
};
// sprite初期化
export const setSprite = (obj: GameObj, app: Application) => {
    const container = obj.container;
    container.x = (obj.x / INTERNAL_SCALE) * UNIT;
    container.y = (obj.y / INTERNAL_SCALE) * UNIT;
    container.width = UNIT;
    container.height = UNIT;
    drawSprite(obj, app);
    if (obj.color) container.tint = colorMap[obj.color]!;
    rotateTexture(obj, obj.dir);
    app.stage.addChild(container);
};
// 点線囲い
export const blockDashLine = (obj: Block) => {
    const lineTexture = generatedTextures.get("block_deactivatedLine_0") as Texture;
    const w = (obj.spriteBoxes[0].sz.x / INTERNAL_SCALE) * UNIT;
    const h = (obj.spriteBoxes[0].sz.y / INTERNAL_SCALE) * UNIT;
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
// 描画更新
export const updateSprites = () => {
    gameObjs.forEach((obj) => {
        const container = obj.container;
        container.x = (obj.x / INTERNAL_SCALE) * UNIT;
        container.y = (obj.y / INTERNAL_SCALE) * UNIT;
        // オフ状態のブロックを半透明にする
        if (obj instanceof Block) {
            obj.container.children.forEach((child) => {
                if (!obj.isSolid && !(child instanceof TilingSprite)) {
                    child.alpha = 0.2;
                } else child.alpha = 1;
            });
        }
    });
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
// 音声
export const BGM_PATHS = ["/menu.mp3", "/bgm0.mp3", "/bgm1.mp3", "/bgm2.mp3", "/bgm3.mp3", "/bgm4.mp3", "/bgm5.mp3", "/bgm6.mp3"] as const;
export const SFX_PATHS = ["/walk.mp3", "/jump.mp3", "/key.mp3", "/ladder.mp3", "/lever.mp3", "/button.mp3", "/restart.mp3", "/goal.mp3"] as const;
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
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
export function playSfx(path: SfxPath, obj: GameObj | null, volume: number = 1, disableDuplicate: boolean = false) {
    const now = performance.now();
    if (activeSfx.has(path) && (disableDuplicate || now - activeSfx.get(path)!?.lastPlayed < SFX_MIN_INTERVAL)) return;
    const buffer = sfxBuffers.get(path);
    if (!buffer) return;
    if (obj) obj.playedSfxs.push(path);
    const ctx = getAudioContext();
    if (!ctx) return;
    const sfxGain = getSfxGain();
    if (!sfxGain) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
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
        ...Array.from({ length: 7 }, (_, i) => `/player${i}.png`),
        "/block.png",
        "/block_deactivated.png",
        "/block_deactivated_line.png",
        "/ladder.png",
        "/key.png",
        "/oneway.png",
        "/lever_off.png",
        "/lever_on.png",
        "/portal_front.png",
        "/portal_back.png",
        "/pushblock.png",
        "/button_off.png",
        "/button_on.png",
        "/moveblock_off.png",
        "/moveblock_on.png",
    ];
    // すべてのアセットを並行して読み込む
    const textures = await Assets.load(assetUrls);
    // 読み込んだテクスチャをgeneratedTexturesに割り当てる
    const playerTextures = Array.from({ length: 7 }, (_, i) => textures[`/player${i}.png`]);
    generatedTextures.set("player_static_0", playerTextures[0]);
    generatedTextures.set("player_idle_0", [playerTextures[0]]);
    generatedTextures.set("player_walk_0", [playerTextures[1], playerTextures[0], playerTextures[2], playerTextures[0]]);
    generatedTextures.set("player_jump_0", [playerTextures[3]]);
    generatedTextures.set("player_ladderMove_0", [playerTextures[4], playerTextures[5]]);
    generatedTextures.set("player_ladderIdle_0", [playerTextures[6]]);
    generatedTextures.set("block_default_0", textures["/block.png"]);
    generatedTextures.set("block_deactivatedLine_0", textures["/block_deactivated_line.png"]);
    generatedTextures.set("block_deactivated_0", textures["/block_deactivated.png"]);
    generatedTextures.set("ladder_default_0", textures["/ladder.png"]);
    generatedTextures.set("key_default_0", textures["/key.png"]);
    generatedTextures.set("oneway_default_0", textures["/oneway.png"]);
    generatedTextures.set("lever_off_0", textures["/lever_off.png"]);
    generatedTextures.set("lever_on_0", textures["/lever_on.png"]);
    generatedTextures.set("portal_front_0", textures["/portal_front.png"]);
    generatedTextures.set("portal_back_0", textures["/portal_back.png"]);
    generatedTextures.set("pushBlock_default_0", textures["/pushblock.png"]);
    generatedTextures.set("button_off_0", textures["/button_off.png"]);
    generatedTextures.set("button_on_0", textures["/button_on.png"]);
    generatedTextures.set("moveBlock_off_0", textures["/moveblock_off.png"]);
    generatedTextures.set("moveBlock_on_0", textures["/moveblock_on.png"]);
    // nearest-neighbor scaling を適用
    assetUrls.forEach((url) => {
        const texture = textures[url];
        if (texture) {
            texture.source.scaleMode = "nearest";
        }
    });
}
