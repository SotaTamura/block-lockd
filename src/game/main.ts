import { Application, BitmapText } from "pixi.js";
import { Block, Button, GameObj, Key, Ladder, Lever, MoveBlock, Oneway, Player, Portal, PushBlock } from "./class";
import { blockDashLine, stateChangeTexture, clearPressStart, pressStartEvent, rotateTexture, setSprite, updateSprites } from "./base";
import { Angle, GRAVITY, JUMP_SPEED, MAP_BLOCK_LEN, PLAYER_STRENGTH, PX_PER_UNIT, TiledStageDataType, UNIT, MOVE_BLOCK_SPEED, TextureName, colorMap, parseBase, PROPS_LEN } from "@/constants";
import { getStage } from "@/app/fetch";
import { EditorObj } from "@/app/editor/stageEditor";
import { gunzipSync } from "zlib";

export let hint: string;
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
const remove = (obj: GameObj) => {
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
const activate = (color: string | undefined) => {
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
            if (oneway.ang === 0) {
                oneway.y -= oneway.hitboxes[0].h;
                oneway.ang = 180;
            } else if (oneway.ang === 180) {
                oneway.y += oneway.hitboxes[0].h;
                oneway.ang = 0;
            } else if (oneway.ang === 90) {
                oneway.x += oneway.hitboxes[0].w;
                oneway.ang = -90;
            } else if (oneway.ang === -90) {
                oneway.x -= oneway.hitboxes[0].w;
                oneway.ang = 90;
            }
            rotateTexture(oneway, 180);
        }
};
const objCreator: { [gid: number]: (...args: [x: number, y: number, w: number, h: number, ang: Angle, color: string | undefined, tag: string]) => GameObj } = {
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
export const loadStage = async (i: number, app: Application, dataType: "official" | "online" | EditorObj[]) => {
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
    if (dataType === "official") {
        let data: { default: TiledStageDataType } | null;
        try {
            data = await import(`./stagesJSON/stage${i}.json`);
        } catch {
            data = null;
        }
        if (!data) return;
        hint = data.default.properties[0].value;
        const allObjs = data.default.layers.flatMap((layer) => (layer.objects ? layer.objects.map((obj) => ({ ...obj, color: layer.tintcolor })) : []));
        for (let obj of allObjs) {
            let newW = obj.width / PX_PER_UNIT;
            let newH = obj.height / PX_PER_UNIT;
            let newX = obj.x / PX_PER_UNIT;
            let newY = obj.y / PX_PER_UNIT;
            if (obj.rotation === 0) {
                newY -= newH;
            } else if (obj.rotation === 90) {
                [newW, newH] = [newH, newW];
            } else if (obj.rotation === 180) {
                newX -= newW;
            } else if (obj.rotation === -90) {
                [newW, newH] = [newH, newW];
                newX -= newW;
                newY -= newH;
            }
            const create = objCreator[obj.gid];
            if (!create) throw new Error(`unknown gid ${obj.gid}`);
            const newObj = create(newX, newY, newW, newH, obj.rotation, obj.color, obj.type);
            gameObjs.push(newObj);
            setSprite(newObj, app);
        }
    } else if (dataType === "online") {
        const data = await getStage(i);
        if (!data) return;
        const splitCode = gunzipSync(Buffer.from(data.code, "base64")).toString("utf-8").split(";");
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
                [0, 90, 180, -90][Number(propStrs[5] || 0)] as Angle,
                Number(propStrs[6] || 0),
                propStrs[7] || "",
            ];
            const create = objCreator[gid];
            if (!create) throw new Error(`unknown gid ${gid}`);
            const newObj = create(x, y, w, h, ang, colorMap[color], tag);
            gameObjs.push(newObj);
            setSprite(newObj, app);
        }
    } else {
        for (const obj of dataType) {
            const create = objCreator[obj.gid];
            if (!create) throw new Error(`unknown gid ${obj.gid}`);
            const newObj = create(obj.x, obj.y, obj.w, obj.h, obj.ang, colorMap[obj.color], obj.tag);
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
            x: (portal.x + portal.spriteBoxes[0].w / 2) * UNIT,
            y: (portal.y + portal.spriteBoxes[0].h / 2) * UNIT,
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
    // 鍵
    for (const key of keys)
        if (players.some((player) => player.isColliding(key.triggers[0]))) {
            remove(key);
            activate(key.color);
        }
    // レバー
    for (const lever of levers) {
        const isColliding = players.some((player) => player.isColliding(lever.triggers[0]));
        if (isColliding) {
            if (!lever.isBeingContacted) {
                activate(lever.color);
                stateChangeTexture(lever, lever.state === "on" ? "off" : "on");
                lever.isBeingContacted = true;
            }
        } else {
            lever.isBeingContacted = false;
        }
    }
    // ボタン
    for (const button of buttons) {
        const isPressed = [...players, ...pushBlocks, ...moveBlocks].some((obj) => obj.isColliding(button.triggers[0]));
        if (isPressed) {
            if (!button.isPressed) {
                activate(button.color);
                stateChangeTexture(button, "on");
                button.isPressed = true;
            }
        } else {
            if (button.isPressed) {
                activate(button.color);
                stateChangeTexture(button, "off");
                button.isPressed = false;
            }
        }
    }
    // 動くオブジェクト
    for (const player of players) {
        player.strength = {
            t: player.initStrength,
            b: player.initStrength,
            l: player.initStrength,
            r: player.initStrength,
        };
        player.nextBlock = { t: null, b: null, l: null, r: null };
        player.vy += GRAVITY; // 重力加速度
        player.handleLadder(ladders); //ハシゴ
        player.handlePortal(portals, app); //ポータル
        player.handleHorizontalMove(); // 左右移動
    }
    for (const pushBlock of pushBlocks) {
        pushBlock.vx = 0;
        pushBlock.strength = {
            t: pushBlock.initStrength,
            b: pushBlock.initStrength,
            l: pushBlock.initStrength,
            r: pushBlock.initStrength,
        };
        pushBlock.nextBlock = { t: null, b: null, l: null, r: null };
        pushBlock.vy += GRAVITY; // 重力加速度
        pushBlock.handleLadder(ladders); //ハシゴ
        pushBlock.handlePortal(portals, app); //ポータル
    }
    for (const moveBlock of moveBlocks) {
        moveBlock.strength = {
            t: moveBlock.initStrength,
            b: moveBlock.initStrength,
            l: moveBlock.initStrength,
            r: moveBlock.initStrength,
        };
        if (moveBlock.ang === 0) {
            moveBlock.vy = moveBlock.isActivated && !moveBlock.nextBlock.t ? -MOVE_BLOCK_SPEED : 0;
        }
        if (moveBlock.ang === 90) {
            moveBlock.vx = moveBlock.isActivated && !moveBlock.nextBlock.r ? MOVE_BLOCK_SPEED : 0;
        }
        if (moveBlock.ang === 180) {
            moveBlock.vy = moveBlock.isActivated && !moveBlock.nextBlock.b ? MOVE_BLOCK_SPEED : 0;
        }
        if (moveBlock.ang === -90) {
            moveBlock.vx = moveBlock.isActivated && !moveBlock.nextBlock.l ? -MOVE_BLOCK_SPEED : 0;
        }
        moveBlock.nextBlock = { t: null, b: null, l: null, r: null };
        moveBlock.handlePortal(portals, app); //ポータル
    }
    for (let i = 0; i < [...players, ...pushBlocks, ...moveBlocks].length; i++) {
        for (const obj of [...moveBlocks, ...pushBlocks, ...players]) {
            const otherSolidObjs = gameObjs.filter((o) => o !== obj && o.isSolid);
            obj.collideBottom([...otherSolidObjs, ...ladders]); // 着地
            // ジャンプ(ジャンプ中のプレイヤーの上に乗っているプレイヤーをジャンプさせない)
            if (obj instanceof Player && pressStartEvent.u && obj.nextBlock.b) {
                let bottom: GameObj | null = obj.nextBlock.b;
                while (bottom instanceof Player) {
                    bottom = bottom.nextBlock.b;
                    if (!bottom) break;
                }
                if (bottom) {
                    obj.vy = JUMP_SPEED;
                    obj.strength.t = PLAYER_STRENGTH;
                }
            }
            obj.collideTop(otherSolidObjs); // 天井衝突
            obj.collideLeft(otherSolidObjs); // 左壁衝突
            obj.collideRight(otherSolidObjs); // 右壁衝突
        }
    }
    for (const player of players) {
        const otherSolidObjs = gameObjs.filter((obj) => obj !== player && obj.isSolid);
        player.collideTop(otherSolidObjs); // 天井衝突
        player.handleTexture();
        player.x += player.vx;
        player.y += player.vy; // 移動
        const playerBB = player.boundingBox;
        if (playerBB && (playerBB.r < 0 || playerBB.l > MAP_BLOCK_LEN || playerBB.b < 0 || playerBB.t > MAP_BLOCK_LEN)) {
            // ゴール
            remove(player);
            if (players.length === 0) {
                handleComplete();
            }
        }
    }
    for (const pushBlock of pushBlocks) {
        pushBlock.x += pushBlock.vx;
        pushBlock.y += pushBlock.vy; // 移動
        const pushBlockBB = pushBlock.boundingBox;
        if (pushBlockBB && (pushBlockBB.r < 0 || pushBlockBB.l > MAP_BLOCK_LEN || pushBlockBB.b < 0 || pushBlockBB.t > MAP_BLOCK_LEN)) {
            // ゴール
            remove(pushBlock);
        }
    }
    for (const moveBlock of moveBlocks) {
        moveBlock.x += moveBlock.vx;
        moveBlock.y += moveBlock.vy; //移動
        const moveBlockBB = moveBlock.boundingBox;
        if (moveBlockBB && (moveBlockBB.r < 0 || moveBlockBB.l > MAP_BLOCK_LEN || moveBlockBB.b < 0 || moveBlockBB.t > MAP_BLOCK_LEN)) {
            // ゴール
            remove(moveBlock);
        }
    }
    clearPressStart();
    updateSprites();
};
