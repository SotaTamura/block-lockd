import { Application, BitmapText } from "pixi.js";
import { Block, Button, GameObj, Key, Ladder, Lever, MoveBlock, Oneway, Player, Portal, PushBlock } from "./class";
import { blockDashLine, stateChangeTexture, clearPressStart, pressStartEvent, rotateTexture, setSprite, updateSprites, playSfx } from "./base";
import { Direction, GRAVITY, JUMP_SPEED, UNIT, parseBase, PROPS_LEN, opposite, INTERNAL_SCALE } from "@/constants";
import { EditorObj } from "@/app/editor/stageEditor";
import { gunzipSync } from "zlib";
import { isOverLapping, resolveCollisions, updateNextBlocks } from "./collision";

export let gameObjs: GameObj[];
export let players: Player[];
export let blocks: Block[];
export let ladders: Ladder[];
export let keys: Key[];
export let oneways: Oneway[];
export let levers: Lever[];
export let pushBlocks: PushBlock[];
export let portals: Portal[];
export let portalTexts: BitmapText[];
export let buttons: Button[];
export let moveBlocks: MoveBlock[];

// オブジェクト削除
export const remove = (obj: GameObj) => {
    const typeArrays: GameObj[][] = [players, blocks, ladders, keys, oneways, levers, portals, pushBlocks, buttons, moveBlocks];
    for (const typeArray of typeArrays) {
        const index = typeArray.indexOf(obj);
        if (index !== -1) {
            typeArray.splice(index, 1);
            gameObjs = gameObjs.filter((item) => item !== obj);
            obj.container.destroy();
        }
    }
};
// オブジェクトの状態切り替え
const activate = (color: number) => {
    for (const moveBlock of moveBlocks) {
        if (moveBlock.color === color) {
            stateChangeTexture(moveBlock, moveBlock.isActivated ? "off" : "on");
            moveBlock.isActivated = !moveBlock.isActivated;
        }
    }
    for (const block of blocks)
        if (block.color === color) {
            block.isSolid = !block.isSolid;
        }
    for (const oneway of oneways)
        if (oneway.color === color) {
            for (const dir of ["u", "d", "l", "r"]) {
                if (oneway.dir === dir) {
                    oneway.alignHitbox(0, opposite[dir], oneway.hitboxes[0][dir]);
                    oneway.dir = opposite[dir];
                    break;
                }
            }
            rotateTexture(oneway, 180);
        }
};
const objCreator: { [gid: number]: (...args: [x: number, y: number, w: number, h: number, ang: Direction, color: number, tag: string]) => GameObj } = {
    1: (x, y, w, h, ang) => new Player(x, y, w, h, ang),
    2: (x, y, w, h, ang, color) => new Block(x, y, w, h, ang, true, color),
    3: (x, y, w, h, ang, color) => new Block(x, y, w, h, ang, false, color),
    4: (x, y, w, h, ang) => new Ladder(x, y, w, h, ang),
    5: (x, y, w, h, ang, color) => new Key(x, y, w, h, ang, color),
    6: (x, y, w, h, ang, color) => new Oneway(x, y, w, h, ang, color),
    7: (x, y, w, h, ang, _color, tag) => new Portal(x, y, w, h, ang, tag),
    8: (x, y, w, h, ang, color) => new Lever(x, y, w, h, ang, color),
    9: (x, y, w, h, ang) => new PushBlock(x, y, w, h, ang),
    10: (x, y, w, h, ang, color) => new Button(x, y, w, h, ang, color),
    11: (x, y, w, h, ang, color) => new MoveBlock(x, y, w, h, ang, color, false),
    12: (x, y, w, h, ang, color) => new MoveBlock(x, y, w, h, ang, color, true),
};
// マップ作成
export const loadStage = async (data: string | EditorObj[], app: Application) => {
    // 初期化
    gameObjs = [];
    players = [];
    blocks = [];
    ladders = [];
    keys = [];
    oneways = [];
    levers = [];
    portals = [];
    portalTexts = [];
    pushBlocks = [];
    buttons = [];
    moveBlocks = [];
    if (typeof data === "string") {
        const splitCode = gunzipSync(Buffer.from(data, "base64")).toString("utf-8").split(";");
        for (const obj of splitCode) {
            const [base64Mask, joinedMaskedProps] = obj.split(":");
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
                (["u", "r", "d", "l"] as Direction[])[Number(propStrs[5] || 0)],
                Number(propStrs[6] || 0),
                propStrs[7] || "",
            ];
            const create = objCreator[gid];
            if (!create) throw new Error(`unknown gid ${gid}`);
            const newObj = create(x, y, w, h, ang, color, tag);
            gameObjs.push(newObj);
            setSprite(newObj, app);
        }
    } else {
        for (const obj of data) {
            const create = objCreator[obj.gid];
            if (!create) throw new Error(`unknown gid ${obj.gid}`);
            const newObj = create(obj.x, obj.y, obj.w, obj.h, obj.ang as Direction, obj.color, obj.tag);
            gameObjs.push(newObj);
            setSprite(newObj, app);
        }
    }
    players = gameObjs.filter((o) => o instanceof Player);
    blocks = gameObjs.filter((o) => o instanceof Block);
    ladders = gameObjs.filter((o) => o instanceof Ladder);
    keys = gameObjs.filter((o) => o instanceof Key);
    oneways = gameObjs.filter((o) => o instanceof Oneway);
    portals = gameObjs.filter((o) => o instanceof Portal);
    levers = gameObjs.filter((o) => o instanceof Lever);
    pushBlocks = gameObjs.filter((o) => o instanceof PushBlock);
    buttons = gameObjs.filter((o) => o instanceof Button);
    moveBlocks = gameObjs.filter((o) => o instanceof MoveBlock);
    for (const block of blocks) blockDashLine(block);
    for (const portal of portals) {
        const portalText = new BitmapText({
            text: portal.id,
            x: ((portal.x + portal.spriteBoxes[0].sz.x / 2) / INTERNAL_SCALE) * UNIT,
            y: ((portal.y + portal.spriteBoxes[0].sz.y / 2) / INTERNAL_SCALE) * UNIT,
            style: {
                fontFamily: ["Makinas", "sans-serif"],
                fontSize: (3 / 4) * UNIT,
                fill: 0x000000,
                stroke: { color: 0xffffff, width: 10, join: "round" },
                align: "center",
            },
        });
        portalText.anchor.set(0.5);
        portalTexts.push(portalText);
        app.stage.addChild(portalText);
    }
};
export let isComplete = false;
export const update = (handleComplete: () => void, app: Application) => {
    if (!app.renderer) return;

    // 鍵
    for (const key of keys)
        if (players.some((p) => isOverLapping(p, key))) {
            remove(key);
            activate(key.color);
            playSfx("/key.mp3", key, 5);
        }
    // // レバー
    // for (const lever of levers) {
    //     const isColliding = players.some((player) => player.isColliding(lever.triggers[0]));
    //     if (isColliding) {
    //         if (!lever.isBeingContacted) {
    //             playSfx("/lever.mp3", lever, 5);
    //             activate(lever.color);
    //             stateChangeTexture(lever, lever.state === "on" ? "off" : "on");
    //             lever.isBeingContacted = true;
    //         }
    //     } else {
    //         lever.isBeingContacted = false;
    //     }
    // }
    // // ボタン
    // for (const button of buttons) {
    //     const isPressed = [...players, ...pushBlocks, ...moveBlocks].some((obj) => obj.isColliding(button.triggers[0]));
    //     if (isPressed) {
    //         if (!button.isPressed) {
    //             playSfx("/button.mp3", button, 5);
    //             activate(button.color);
    //             stateChangeTexture(button, "on");
    //             button.isPressed = true;
    //         }
    //     } else {
    //         if (button.isPressed) {
    //             activate(button.color);
    //             stateChangeTexture(button, "off");
    //             button.isPressed = false;
    //         }
    //     }
    // }
    // // 動くオブジェクト
    for (const player of players) {
        player.strength = {
            u: player.initStrength,
            d: player.initStrength,
            l: player.initStrength,
            r: player.initStrength,
        };
        if (pressStartEvent.u && player.nextBlocks.d.length) {
            player.v.y = JUMP_SPEED;
            playSfx("/jump.mp3", player);
        }
        player.v.y += GRAVITY;
        player.handleLadder(ladders);
        //     player.handlePortal(portals, app);
        player.handleHorizontalMove();
        player.handleGoal(handleComplete);
        player.handleTexture();
    }
    for (const pushBlock of pushBlocks) {
        pushBlock.strength = {
            u: pushBlock.initStrength,
            d: pushBlock.initStrength,
            l: pushBlock.initStrength,
            r: pushBlock.initStrength,
        };
        pushBlock.v.x = 0;
        pushBlock.v.y += GRAVITY;
        //     pushBlock.handleLadder(ladders); //ハシゴ
        //     pushBlock.handlePortal(portals, app); //ポータル
        pushBlock.handleGoal();
    }
    // for (const moveBlock of moveBlocks) {
    //     moveBlock.strength = {
    //         t: moveBlock.initStrength,
    //         b: moveBlock.initStrength,
    //         l: moveBlock.initStrength,
    //         r: moveBlock.initStrength,
    //     };
    //     if (moveBlock.ang === 0) {
    //         moveBlock.vy = moveBlock.isActivated && !moveBlock.nextBlock.t ? -MOVE_BLOCK_SPEED : 0;
    //     }
    //     if (moveBlock.ang === 90) {
    //         moveBlock.vx = moveBlock.isActivated && !moveBlock.nextBlock.r ? MOVE_BLOCK_SPEED : 0;
    //     }
    //     if (moveBlock.ang === 180) {
    //         moveBlock.vy = moveBlock.isActivated && !moveBlock.nextBlock.b ? MOVE_BLOCK_SPEED : 0;
    //     }
    //     if (moveBlock.ang === -90) {
    //         moveBlock.vx = moveBlock.isActivated && !moveBlock.nextBlock.l ? -MOVE_BLOCK_SPEED : 0;
    //     }
    //     moveBlock.nextBlock = { t: null, b: null, l: null, r: null };
    //     moveBlock.handlePortal(portals, app); //ポータル
    // }
    // for (let i = 0; i < [...players, ...pushBlocks, ...moveBlocks].length; i++) {
    //     for (const obj of [...moveBlocks, ...pushBlocks, ...players]) {
    //         const otherSolidObjs = gameObjs.filter((o) => o !== obj && o.isSolid);
    //         obj.collideBottom([...otherSolidObjs, ...ladders]); // 着地
    //         // ジャンプ(ジャンプ中のプレイヤーの上に乗っているプレイヤーをジャンプさせない)
    //         if (obj instanceof Player && pressStartEvent.u && obj.nextBlock.b) {
    //             let bottom: GameObj | null = obj.nextBlock.b;
    //             while (bottom instanceof Player) {
    //                 bottom = bottom.nextBlock.b;
    //                 if (!bottom) break;
    //             }
    //             if (bottom) {
    //                 obj.vy = JUMP_SPEED;
    //                 obj.strength.t = PLAYER_STRENGTH;
    //                 playSfx("/jump.mp3", obj);
    //             }
    //         }
    //         obj.collideTop(otherSolidObjs); // 天井衝突
    //         obj.collideLeft(otherSolidObjs); // 左壁衝突
    //         obj.collideRight(otherSolidObjs); // 右壁衝突
    //     }
    // }
    // for (const moveBlock of moveBlocks) {
    //     moveBlock.x += moveBlock.vx;
    //     moveBlock.y += moveBlock.vy; //移動
    //     const moveBlockBB = moveBlock.boundingBox;
    //     if (moveBlockBB && (moveBlockBB.r < 0 || moveBlockBB.l > MAP_BLOCK_LEN || moveBlockBB.b < 0 || moveBlockBB.t > MAP_BLOCK_LEN)) {
    //         // ゴール
    //         remove(moveBlock);
    //     }
    // }
    const solidObjs = gameObjs.filter((o) => o.isSolid);
    resolveCollisions(solidObjs);
    updateNextBlocks(solidObjs);
    clearPressStart();
    updateSprites();
};
