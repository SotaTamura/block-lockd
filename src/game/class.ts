import { BLOCK_STRENGTH, Direction, MOVE_BLOCK_STRENGTH, PLAYER_STRENGTH, PUSH_BLOCK_STRENGTH, PLAYER_SPEED, MAP_BLOCK_LEN, Axis, SCALE } from "@/constants";
import { Sprite, Container, Application } from "pixi.js";
import { stateChangeTexture, xFlipTexture, pressingEvent, rotate, playSfx, stopSfx, stopBgm, SfxPath } from "./base";
import { isOverLapping } from "./collision";
import { players, remove, particles, ladders } from "./main";

// 箱
export class Box {
    owner: GameObj;
    rel: Record<Axis, number>;
    sz: Record<Axis, number>;
    counterpart: Record<Direction, Box | null>;
    constructor(owner: GameObj, relX: number, relY: number, w: number, h: number) {
        this.owner = owner;
        this.rel = {
            x: relX,
            y: relY,
        };
        this.sz = { x: w, y: h };
        this.counterpart = { u: null, d: null, l: null, r: null };
    }
    /** 絶対x座標 */
    get x() {
        return this.owner.x + this.rel.x;
    }
    /** 絶対y座標 */
    get y() {
        return this.owner.y + this.rel.y;
    }
    /** 左端絶対x座標 */
    get l() {
        return this.x;
    }
    /** 右端絶対x座標 */
    get r() {
        return this.x + this.sz.x;
    }
    /** 上端絶対y座標 */
    get u() {
        return this.y;
    }
    /** 下端絶対y座標 */
    get d() {
        return this.y + this.sz.y;
    }
    /** 中心絶対座標 */
    get center() {
        return { x: this.l + this.sz.x / 2, y: this.u + this.sz.y / 2 };
    }
}
// 当たり判定
export class Hitbox extends Box {
    counterpart: Record<Direction, Hitbox | null>; //portalで使用
    counterpartHidden: Record<Direction, Hitbox | null>; //portalで使用
    constructor(owner: GameObj, relX: number, relY: number, w: number, h: number) {
        super(owner, relX, relY, w, h);
        this.counterpart = { u: null, d: null, l: null, r: null };
        this.counterpartHidden = { u: null, d: null, l: null, r: null };
    }
}
// 描画する箱
export class SpriteBox extends Box {
    origin: Box;
    counterpart: Record<Direction, SpriteBox | null>;
    constructor(owner: GameObj, relX: number, relY: number, w: number, h: number, origin: Box) {
        super(owner, relX, relY, w, h);
        this.origin = origin;
        this.counterpart = { u: null, d: null, l: null, r: null };
    }
}
// オブジェクト
export abstract class GameObj {
    x: number;
    y: number;
    dir: Direction;
    color: number;
    hitboxes: Hitbox[];
    hiddenHitboxes: Hitbox[];
    spriteBoxes: SpriteBox[];
    v: Record<Axis, number>;
    correctsCorner: boolean;
    name: string;
    state: string;
    isSolid: boolean; // 最適化用
    canMove: boolean; // 最適化用
    strength: Record<Direction, number>; //数の大小によって、各方向から押されたときに動くか動かないか決まる
    nextBlocks: Record<Direction, GameObj[]>;
    inLadders: Ladder[];
    container: Container;
    playedSfxs: SfxPath[];
    needsRedraw: boolean;
    constructor(
        x: number,
        y: number,
        ang: Direction,
        color: number,
        hitboxes: {
            relX: number;
            relY: number;
            w: number;
            h: number;
        }[],
        spriteBoxes: {
            relX: number;
            relY: number;
            w: number;
            h: number;
        }[],
        name: string,
        textureState: string,
        isSolid: boolean,
        canMove: boolean,
        strength: number,
        correctsCorner: boolean,
    ) {
        this.x = x * SCALE;
        this.y = y * SCALE;
        this.dir = ang;
        this.color = color;
        this.v = { x: 0, y: 0 };
        this.hitboxes = hitboxes.map((b) => new Hitbox(this, b.relX * SCALE, b.relY * SCALE, b.w * SCALE, b.h * SCALE));
        this.hiddenHitboxes = [];
        this.spriteBoxes = spriteBoxes.map((b) => new SpriteBox(this, b.relX * SCALE, b.relY * SCALE, b.w * SCALE, b.h * SCALE, new Box(this, b.relX * SCALE, b.relY * SCALE, b.w * SCALE, b.h * SCALE)));
        this.name = name;
        this.state = textureState;
        this.isSolid = isSolid;
        this.canMove = canMove;
        this.strength = { u: strength, d: strength, l: strength, r: strength };
        this.correctsCorner = correctsCorner;
        this.nextBlocks = { u: [], d: [], l: [], r: [] };
        this.inLadders = [];
        this.container = new Container();
        this.playedSfxs = [];
        this.needsRedraw = false;
    }
    alignHitbox(hitboxId: number, dir: Direction, coordinate: number) {
        const axis = ["u", "d"].includes(dir) ? "y" : "x";
        this[axis] += coordinate - this.hitboxes[hitboxId][dir];
    }
    handleGoal() {
        const allBoxes = [...this.hitboxes, ...this.spriteBoxes];
        const minL = Math.min(...allBoxes.map((b) => b.l));
        const maxR = Math.max(...allBoxes.map((b) => b.r));
        const minU = Math.min(...allBoxes.map((b) => b.u));
        const maxD = Math.max(...allBoxes.map((b) => b.d));
        if (maxR < 0 || minL > MAP_BLOCK_LEN * SCALE || maxD < 0 || minU > MAP_BLOCK_LEN * SCALE) remove(this);
    }
}

// プレイヤー
export class Player extends GameObj {
    wasOnGround: boolean;
    constructor(x: number, y: number, w: number, h: number, ang: Direction) {
        super(x, y, ang, 0, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "player", "idle", true, true, PLAYER_STRENGTH, true);
        this.wasOnGround = true;
    }
    handleLadder() {
        const wasInLadders = this.inLadders;
        this.inLadders = ladders.filter((l) => isOverLapping(this, l));
        if (wasInLadders.length && !this.inLadders.length) this.v.y = 0; //ハシゴから出たときy方向の速度を0にする
        if (this.inLadders.length) {
            if (pressingEvent.u && pressingEvent.d) this.v.y = 0;
            else if (pressingEvent.u) {
                const ladderTop = Math.min(...this.inLadders.map((l) => l.hitboxes[0].u));
                const distToTop = this.hitboxes[0].d - ladderTop;
                if (distToTop <= PLAYER_SPEED)
                    this.v.y = -distToTop; // ハシゴの頂上でピッタリ止める
                else this.v.y = -PLAYER_SPEED; // ハシゴを登る
            } else if (pressingEvent.d)
                this.v.y = PLAYER_SPEED; // ハシゴを下る
            else this.v.y = 0;
        }
        if (this.nextBlocks.d.length && this.nextBlocks.d.every((o) => o instanceof Ladder) && pressingEvent.d) this.v.y = PLAYER_SPEED; // ハシゴの頂上から下る
    }
    override handleGoal(handleComplete?: () => void) {
        super.handleGoal();
        if (players.length === 0) {
            stopBgm();
            playSfx("/goal.mp3", null, 3);
            handleComplete?.();
        }
    }
    handleHorizontalMove() {
        const currentRotation = (this.container.children[0] as Sprite).texture.rotate;
        if (pressingEvent.l && pressingEvent.r) this.v.x = 0;
        else if (pressingEvent.l) {
            if (currentRotation === 0) xFlipTexture(this);
            this.v.x = -PLAYER_SPEED;
        } else if (pressingEvent.r) {
            if (currentRotation === 12) xFlipTexture(this);
            this.v.x = PLAYER_SPEED;
        } else this.v.x = 0;
    }
    handleTexture() {
        const isOnGround = this.nextBlocks.d.length > 0;
        if (!this.wasOnGround && isOnGround && !this.inLadders.length) {
            playSfx("/landing.mp3", this);
        }
        this.wasOnGround = isOnGround;

        if (this.inLadders.length) {
            if (pressingEvent.u || pressingEvent.d) {
                stateChangeTexture(this, "ladderMove");
                playSfx("/ladder.mp3", this, 3, true);
            } else {
                stateChangeTexture(this, "ladderIdle");
                stopSfx("/ladder.mp3", this);
            }
            stopSfx("/walk.mp3", this);
        } else {
            if (!isOnGround) {
                stateChangeTexture(this, "jump");
                stopSfx("/walk.mp3", this);
            } else {
                if (pressingEvent.l || pressingEvent.r) {
                    stateChangeTexture(this, "walk");
                    playSfx("/walk.mp3", this, 5, true);
                } else {
                    stateChangeTexture(this, "idle");
                    stopSfx("/walk.mp3", this);
                }
            }
            stopSfx("/ladder.mp3", this);
        }
    }
    handleParticle(app: Application) {
        const isOnGround = this.nextBlocks.d.length > 0;
        if (isOnGround && (pressingEvent.l || pressingEvent.r) && Math.random() < 0.15) {
            const w = this.spriteBoxes[0].sz.x;
            const h = this.spriteBoxes[0].sz.y;
            const x = this.spriteBoxes[0].x;
            const y = this.spriteBoxes[0].y;
            const px = x + w / 2 + (Math.random() - 0.5) * w;
            const py = y + h;
            const vx = (Math.random() - 0.5) * 1;
            const vy = -Math.random() * 1;
            const pSize = (Math.min(w, h) / 6) * (0.5 + Math.random());
            const p = new Particle(px, py, vx, vy, 20 + Math.random() * 10, pSize, 0xdddddd);
            particles.push(p);
            app.stage.addChild(p.container);
            p.container.zIndex = -1;
        }
    }
}
// ブロック
export class Block extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction, isSolid: boolean, color: number) {
        super(x, y, ang, color, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "block", "default", isSolid, false, BLOCK_STRENGTH, false);
    }
}
// ハシゴ
export class Ladder extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction) {
        super(x, y, ang, 0, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "ladder", "default", true, false, BLOCK_STRENGTH, false);
    }
}
// 鍵
export class Key extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number) {
        super(x, y, ang, color, [{ relX: 0.2, relY: 0.2, w: w - 0.4, h: h - 0.4 }], [{ relX: 0, relY: 0, w, h }], "key", "default", false, false, -1, false);
    }
    handleParticle(app: Application) {
        const px = this.x + this.spriteBoxes[0].sz.x / 2;
        const py = this.y + this.spriteBoxes[0].sz.y / 2;
        const pSize = this.spriteBoxes[0].sz.x / 3;
        const p = new Particle(px, py, 0, 0, 8, pSize, 0xffffff);
        particles.push(p);
        app.stage.addChild(p.container);
        p.container.zIndex = 10;
    }
}
// 一方通行ブロック
export class Oneway extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number) {
        super(x, y, ang, color, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "oneway", "default", true, false, BLOCK_STRENGTH, false);
    }
}
// レバー
export class Lever extends GameObj {
    isBeingContacted: boolean;
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number) {
        super(x, y, ang, color, [{ relX: 0.2, relY: 0.2, w: w - 0.4, h: h - 0.4 }], [{ relX: 0, relY: 0, w, h }], "lever", "off", false, false, -1, false);
        this.isBeingContacted = false;
    }
}
// ポータル
export class Portal extends GameObj {
    id: string;
    trigger: Box;
    backContainer: Container;
    constructor(x: number, y: number, w: number, h: number, ang: Direction, id: string) {
        super(
            x,
            y,
            ang,
            0,
            [
                { relX: 0, relY: 0, w: 0, h: h / 2 },
                { relX: w, relY: 0, w: 0, h: h / 2 },
                { relX: 0, relY: h / 2, w, h: 0 },
            ],
            [{ relX: 0, relY: 0, w, h }],
            "portal",
            "front",
            true,
            false,
            BLOCK_STRENGTH,
            false,
        );
        this.id = id;
        this.trigger = new Box(this, 0, 0, w * SCALE, 0);
        this.backContainer = new Container();
        [...this.hitboxes, this.trigger].forEach((t) => {
            rotate(t, ang, w * SCALE, h * SCALE);
        });
    }
    handleParticle(app: Application) {
        if (Math.random() < 0.25) {
            const w = this.spriteBoxes[0].sz.x;
            const h = this.spriteBoxes[0].sz.y;
            const centerX = this.x + w / 2;
            const centerY = this.y + h / 2;

            let px, py, vx, vy;

            if (this.dir === "u") {
                px = centerX + (Math.random() - 0.5) * SCALE;
                py = this.y - SCALE * Math.random();
                vx = (centerX - px) * 0.05;
                vy = (this.y - py) * 0.1;
            } else if (this.dir === "d") {
                px = centerX + (Math.random() - 0.5) * SCALE;
                py = this.y + h + SCALE * Math.random();
                vx = (centerX - px) * 0.05;
                vy = (this.y + h - py) * 0.1;
            } else if (this.dir === "l") {
                px = this.x - SCALE * Math.random();
                py = centerY + (Math.random() - 0.5) * SCALE;
                vx = (this.x - px) * 0.1;
                vy = (centerY - py) * 0.05;
            } else {
                // "r"
                px = this.x + w + SCALE * Math.random();
                py = centerY + (Math.random() - 0.5) * SCALE;
                vx = (this.x + w - px) * 0.1;
                vy = (centerY - py) * 0.05;
            }

            const pSize = (Math.min(w, h) / 10) * (0.5 + Math.random());
            // 色は白に近い水色
            const p = new Particle(px, py, vx, vy, 15 + Math.random() * 10, pSize, 0xccffff);
            particles.push(p);
            app.stage.addChild(p.container);
            p.container.zIndex = -2;
        }
    }
}
// 押しブロック
export class PushBlock extends GameObj {
    wasOnGround: boolean;
    constructor(x: number, y: number, w: number, h: number, ang: Direction) {
        super(x, y, ang, 0, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "pushBlock", "default", true, true, PUSH_BLOCK_STRENGTH, true);
        this.wasOnGround = true;
    }
    handleLadder() {
        this.inLadders = ladders.filter((l) => isOverLapping(this, l));
        if (this.inLadders.length) this.v.y = 0;
    }
    handleLanding() {
        const isOnGround = this.nextBlocks.d.length > 0;
        if (!this.wasOnGround && isOnGround && !this.inLadders.length) {
            playSfx("/pushblocklanding.mp3", this, 2);
        }
        this.wasOnGround = isOnGround;
    }
}
// ボタン
export class Button extends GameObj {
    isPressed: boolean;
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number) {
        super(x, y, ang, color, [{ relX: 0, relY: (3 / 4) * h, w, h: h / 4 }], [{ relX: 0, relY: 0, w, h }], "button", "off", true, false, BLOCK_STRENGTH, false);
        this.isPressed = false;
        this.hitboxes.forEach((b) => {
            rotate(b, ang, w * SCALE, h * SCALE);
        });
    }
}
// 駆動ブロック
export class MoveBlock extends GameObj {
    isActivated: boolean;
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number, isActivated: boolean) {
        super(x, y, ang, color, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "moveBlock", isActivated ? "on" : "off", true, true, MOVE_BLOCK_STRENGTH, false);
        this.isActivated = isActivated;
    }
    handleParticle(app: Application) {
        if (this.isActivated && Math.random() < 0.3) {
            const w = this.spriteBoxes[0].sz.x;
            const h = this.spriteBoxes[0].sz.y;
            const x = this.spriteBoxes[0].x;
            const y = this.spriteBoxes[0].y;
            let px = x + ((Math.random() + 0.5) * w) / 2;
            let py = y + ((Math.random() + 0.5) * h) / 2;
            let vx = (Math.random() - 0.5) * 2;
            let vy = (Math.random() - 0.5) * 2;
            let pSize: number;

            if (this.dir === "u") {
                py = y + h;
                vy = 2 + Math.random() * 2;
                pSize = (w / 4) * (0.5 + Math.random());
            } else if (this.dir === "d") {
                py = y;
                vy = -2 - Math.random() * 2;
                pSize = (w / 4) * (0.5 + Math.random());
            } else if (this.dir === "l") {
                px = x + w;
                vx = 2 + Math.random() * 2;
                pSize = (h / 4) * (0.5 + Math.random());
            } else {
                px = x;
                vx = -2 - Math.random() * 2;
                pSize = (h / 4) * (0.5 + Math.random());
            }

            // 色の決定: グレー(多)、黒(中)、赤(低)
            const rand = Math.random();
            let color = 0xaaaaaa; // グレー
            if (rand < 0.1)
                color = 0xff4400; // 赤 (火の粉)
            else if (rand < 0.3) color = 0x333333; // 黒 (濃い煙)

            const p = new Particle(px, py, vx, vy, 30 + Math.random() * 20, pSize, color);
            particles.push(p);
            app.stage.addChild(p.container);
            p.container.zIndex = -1; // 背面に表示
        }
    }
}

// パーティクル
export class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
    container: Container;
    constructor(x: number, y: number, vx: number, vy: number, life: number, size: number, color: number) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.container = new Container();
    }
}
