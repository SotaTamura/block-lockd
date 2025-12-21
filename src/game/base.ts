import { Angle, Direction, UNIT, π } from "@/constants";
import { Block, Box, GameObj, isColorable, Portal, SpriteBox } from "./class";
import { Assets, Texture, TilingSprite, groupD8, Sprite, AnimatedSprite, Graphics, Application } from "pixi.js";
import { gameObjs } from "./main";

// キーイベント
export let pressingEvent: Record<Direction, boolean> = {
    u: false,
    d: false,
    l: false,
    r: false,
}; // 押し中
export let pressingTimeForKeyboard: Record<Direction, number> = {
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
export const rotate = (box: Box, ang: Angle, originW: number, originH: number) => {
    if (ang === 0) return;
    const convertedRelX = (box.relX * originH) / originW;
    const convertedRelY = (box.relY * originW) / originH;
    const convertedW = (box.w * originH) / originW;
    const convertedH = (box.h * originW) / originH;
    if (ang === 90) {
        box.relX = originW - (convertedRelY + convertedH);
        box.relY = convertedRelX;
        box.w = convertedH;
        box.h = convertedW;
    } else if (ang === 180) {
        box.relX = originW - (box.relX + box.w);
        box.relY = originH - (box.relY + box.h);
        box.w = box.w;
        box.h = box.h;
    } else if (ang === -90) {
        box.relX = convertedRelY;
        box.relY = originH - (convertedRelX + convertedW);
        box.w = convertedH;
        box.h = convertedW;
    }
    if (box instanceof SpriteBox) rotate(box.origin, ang, originW, originH);
};
// 画像
export let generatedTextures: Map<string, Texture | Texture[]> = new Map();
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
                    })
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
export const getRotatedTexture = (name: string, state: string, rotId: number, ang: Angle) => getTexture(name, state, groupD8.add((8 - ang / 45) % 8, rotId));
export const rotateTexture = (obj: GameObj, ang: Angle) => {
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
    let rotId = (obj.container.children[0] as Sprite | undefined)?.texture.rotate ?? 0;
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
        sprite.x = spriteBox.origin.relX * UNIT;
        sprite.y = spriteBox.origin.relY * UNIT;
        sprite.width = spriteBox.origin.w * UNIT;
        sprite.height = spriteBox.origin.h * UNIT;
        container.addChild(sprite);
        if (!(spriteBox.relX === spriteBox.origin.relX && spriteBox.relY === spriteBox.origin.relY && spriteBox.w === spriteBox.origin.w && spriteBox.h === spriteBox.origin.h)) {
            const mask = new Graphics().rect(spriteBox.relX * UNIT, spriteBox.relY * UNIT, spriteBox.w * UNIT, spriteBox.h * UNIT).fill();
            container.addChild(mask);
            sprite.mask = mask;
        }
    });
    editTexture(obj, getTexture(obj.name, obj.state, rotId));
    if (obj instanceof Portal) {
        const sprite = new Sprite(getRotatedTexture("portal", "back", 0, obj.ang) as Texture);
        const [l, r, t, b, w, h] = [obj.spriteBoxes[0].l, obj.spriteBoxes[0].r, obj.spriteBoxes[0].t, obj.spriteBoxes[0].b, obj.spriteBoxes[0].w, obj.spriteBoxes[0].h];
        if (obj.ang === 0) {
            sprite.x = l * UNIT;
            sprite.y = (t - h) * UNIT;
        } else if (obj.ang === 90) {
            sprite.x = r * UNIT;
            sprite.y = t * UNIT;
        } else if (obj.ang === 180) {
            sprite.x = l * UNIT;
            sprite.y = b * UNIT;
        } else if (obj.ang === -90) {
            sprite.x = (l - w) * UNIT;
            sprite.y = t * UNIT;
        }
        sprite.width = w * UNIT;
        sprite.height = h * UNIT;
        sprite.zIndex = -1;
        app.stage.addChild(sprite);
    }
};
// sprite初期化
export const setSprite = (obj: GameObj, app: Application) => {
    const container = obj.container;
    container.x = obj.x * UNIT;
    container.y = obj.y * UNIT;
    container.width = UNIT;
    container.height = UNIT;
    drawSprite(obj, app);
    if (isColorable(obj) && obj.color) container.tint = obj.color;
    rotateTexture(obj, obj.ang);
    app.stage.addChild(container);
};
// 点線囲い
export const blockDashLine = (obj: Block) => {
    const lineTexture = generatedTextures.get("block_deactivatedLine_0") as Texture;
    const w = obj.spriteBoxes[0].w * UNIT;
    const h = obj.spriteBoxes[0].h * UNIT;
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
    if (obj.color) obj.container.tint = obj.color;
};
// 描画更新
export const updateSprites = () => {
    gameObjs.forEach((obj) => {
        const container = obj.container;
        container.x = obj.x * UNIT;
        container.y = obj.y * UNIT;
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
// 初期化関数
export async function onLoad() {
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
}
