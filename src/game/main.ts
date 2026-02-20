import { Application } from "pixi.js";
import { Block, Button, GameObj, Key, Ladder, Lever, MoveBlock, Oneway, Player, Portal, PushBlock, Particle } from "./class";
import { stateChangeTexture, clearPressStart, pressStartEvent, rotateTexture, setSprite, updateSprites, playSfx, drawDebug, stopSfx, showStage } from "./base";
import { Direction, GRAVITY, JUMP_SPEED, parseBase, PROPS_LEN, opposite, TERMINAL_V, MOVE_BLOCK_SPEED, BLOCK_STRENGTH, MOVE_BLOCK_STRENGTH, PLAYER_STRENGTH, PUSH_BLOCK_STRENGTH } from "@/constants";
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
export let buttons: Button[];
export let moveBlocks: MoveBlock[];
export let particles: Particle[] = [];

// オブジェクト削除
export const remove = (obj: GameObj | Particle) => {
    if (obj instanceof Particle) {
        particles = particles.filter((p) => p !== obj);
        obj.container.destroy();
        return;
    }
    const typeArrays: GameObj[][] = [players, blocks, ladders, keys, oneways, levers, portals, pushBlocks, buttons, moveBlocks];
    for (const typeArray of typeArrays) {
        const index = typeArray.indexOf(obj as GameObj);
        if (index !== -1) {
            typeArray.splice(index, 1);
            gameObjs = gameObjs.filter((item) => item !== obj);
            if (obj instanceof Portal) {
                obj.backContainer.destroy({ children: true });
            }
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
export const loadStage = async (data: string | EditorObj[], app: Application, skipFadeIn: boolean) => {
    // 初期化
    gameObjs = [];
    players = [];
    blocks = [];
    ladders = [];
    keys = [];
    oneways = [];
    levers = [];
    portals = [];
    pushBlocks = [];
    buttons = [];
    moveBlocks = [];
    particles.forEach((p) => p.container.destroy());
    particles = [];
    if (typeof data === "string") {
        const splitCode = gunzipSync(Buffer.from(data, "base64")).toString("utf-8").split(";");
        for (const obj of splitCode) {
            const [base64Mask, joinedMaskedProps] = obj.split(":");
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
    const solidObjs = gameObjs.filter((o) => o.isSolid);
    updateNextBlocks(solidObjs);
    showStage(app, skipFadeIn);
};
export const isComplete = false;
export const update = (handleComplete: () => void, app: Application, $debug?: HTMLCanvasElement) => {
    if (!app.renderer) return;
    if ($debug) drawDebug($debug, gameObjs);
    // 鍵
    for (const key of keys)
        if (players.some((p) => isOverLapping(p, key))) {
            key.handleParticle(app);
            remove(key);
            activate(key.color);
            playSfx("/key.mp3", key, 5, false, 0.8 + Math.random() * 0.4);
        }
    // レバー
    for (const lever of levers) {
        if (players.some((p) => isOverLapping(p, lever))) {
            if (!lever.isBeingContacted) {
                playSfx("/lever.mp3", lever, 5);
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
        if ([...players, ...pushBlocks, ...moveBlocks].some((o) => o.nextBlocks[opposite[button.dir]].includes(button))) {
            if (!button.isPressed) {
                playSfx("/button.mp3", button, 5, false, 0.8 + Math.random() * 0.4);
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
    // プレイヤー
    for (const player of players) {
        player.strength = {
            u: PLAYER_STRENGTH,
            d: PLAYER_STRENGTH,
            l: PLAYER_STRENGTH,
            r: PLAYER_STRENGTH,
        };
        if (pressStartEvent.u && player.nextBlocks.d.length) {
            player.v.y = JUMP_SPEED;
            playSfx("/jump.mp3", player);
        }
        player.v.y = Math.min(player.v.y + GRAVITY, TERMINAL_V);
        player.handleLadder();
        player.handleHorizontalMove();
        player.handleGoal(handleComplete);
        player.handleTexture();
        player.handleParticle(app);
    }
    // 押しブロック
    for (const pushBlock of pushBlocks) {
        pushBlock.strength = {
            u: PUSH_BLOCK_STRENGTH,
            d: PUSH_BLOCK_STRENGTH,
            l: PUSH_BLOCK_STRENGTH,
            r: PUSH_BLOCK_STRENGTH,
        };
        pushBlock.v.x = 0;
        pushBlock.v.y = Math.min(pushBlock.v.y + GRAVITY, TERMINAL_V);
        pushBlock.handleLadder(); //ハシゴ
        pushBlock.handleGoal();
        pushBlock.handleLanding();
    }
    // 駆動ブロック
    for (const moveBlock of moveBlocks) {
        if (moveBlock.dir === "u" || moveBlock.dir === "d")
            moveBlock.strength = {
                u: MOVE_BLOCK_STRENGTH,
                d: MOVE_BLOCK_STRENGTH,
                l: BLOCK_STRENGTH,
                r: BLOCK_STRENGTH,
            };
        else
            moveBlock.strength = {
                u: BLOCK_STRENGTH,
                d: BLOCK_STRENGTH,
                l: MOVE_BLOCK_STRENGTH,
                r: MOVE_BLOCK_STRENGTH,
            };
        if (moveBlock.dir === "u") moveBlock.v.y = moveBlock.isActivated ? -MOVE_BLOCK_SPEED : 0;
        else if (moveBlock.dir === "r") moveBlock.v.x = moveBlock.isActivated ? MOVE_BLOCK_SPEED : 0;
        else if (moveBlock.dir === "d") moveBlock.v.y = moveBlock.isActivated ? MOVE_BLOCK_SPEED : 0;
        else if (moveBlock.dir === "l") moveBlock.v.x = moveBlock.isActivated ? -MOVE_BLOCK_SPEED : 0;
        moveBlock.canMove = moveBlock.isActivated;
        moveBlock.handleParticle(app);
    }
    // ポータル
    for (const portal of portals) {
        portal.handleParticle(app);
    }
    // パーティクル更新
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;
        if (p.life <= 0) {
            remove(p);
        }
    }
    const solidObjs = gameObjs.filter((o) => o.isSolid);
    resolveCollisions(solidObjs);
    for (const pushBlock of pushBlocks) {
        if (pushBlock.v.x !== 0) {
            playSfx("/pushblock.mp3", pushBlock, 1, true);
        } else {
            stopSfx("/pushblock.mp3", pushBlock);
        }
    }
    updateNextBlocks(solidObjs);
    clearPressStart();
    updateSprites();
};
