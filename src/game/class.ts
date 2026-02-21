import { BLOCK_STRENGTH, CORNER_CORRECT, Direction, MOVE_BLOCK_STRENGTH, MOVE_OBJ_CORNER_CORRECT, PLAYER_STRENGTH, PUSH_BLOCK_STRENGTH, PLAYER_SPEED, MAP_BLOCK_LEN, Axis, roundDecimal, POS_PRECISION, ε } from "@/constants";
import { Sprite, Container } from "pixi.js";
import { stateChangeTexture, xFlipTexture, pressingEvent, rotate, playSfx, stopSfx, stopBgm, SfxPath } from "./base";
import { isOverLapping } from "./collision";
import { players, remove } from "./main";

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
    constructor(owner: GameObj, relX: number, relY: number, w: number, h: number, cornerCorrect: number) {
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
    name: string;
    state: string;
    isSolid: boolean; // 最適化用
    initStrength: number;
    strength: Record<Direction, number>; //数の大小によって、各方向から押されたときに動くか動かないか決まる
    nextBlocks: Record<Direction, GameObj[]>;
    inLadders: Ladder[];
    container: Container;
    playedSfxs: SfxPath[];
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
        strength: number,
        cornerCorrect: number = CORNER_CORRECT,
    ) {
        this.x = x;
        this.y = y;
        this.dir = ang;
        this.color = color;
        this.v = { x: 0, y: 0 };
        this.hitboxes = hitboxes.map((b) => new Hitbox(this, b.relX, b.relY, b.w, b.h, cornerCorrect));
        this.hiddenHitboxes = [];
        this.spriteBoxes = spriteBoxes.map((b) => new SpriteBox(this, b.relX, b.relY, b.w, b.h, new Box(this, b.relX, b.relY, b.w, b.h)));
        this.name = name;
        this.state = textureState;
        this.isSolid = isSolid;
        this.initStrength = strength;
        this.strength = { u: strength, d: strength, l: strength, r: strength };
        this.nextBlocks = { u: [], d: [], l: [], r: [] };
        this.inLadders = [];
        this.container = new Container();
        this.playedSfxs = [];
    }
    alignHitbox(hitboxId: number, dir: Direction, coordinate: number) {
        const axis = ["u", "d"].includes(dir) ? "y" : "x";
        this[axis] = roundDecimal(this[axis] + coordinate - this.hitboxes[hitboxId][dir], POS_PRECISION);
    }
    handleGoal() {
        const allBoxes = [...this.hitboxes, ...this.spriteBoxes];
        const minL = Math.min(...allBoxes.map((b) => b.l));
        const maxR = Math.max(...allBoxes.map((b) => b.r));
        const minU = Math.min(...allBoxes.map((b) => b.u));
        const maxD = Math.max(...allBoxes.map((b) => b.d));
        if (maxR < 0 || minL > MAP_BLOCK_LEN || maxD < 0 || minU > MAP_BLOCK_LEN) remove(this);
    }
    // // 重なり判定
    // isColliding(box: Box): boolean {
    //     return this.hitboxes.some((thisBox) => thisBox.l < box.r && thisBox.r > box.l && thisBox.t < box.b && thisBox.b > box.t);
    // }
    // // --- [難解ゾーン] 衝突処理いろいろ ここから ---
    // //着地
    // collideBottom(objs: GameObj[]) {
    //     // 最も良い衝突解決策を保持するオブジェクト。yは最も高い位置（最小値）を見つけるためにInfinityで初期化。
    //     let resolvedCollision = {
    //         y: Infinity,
    //         vy: this.vy,
    //         bBlock: null as GameObj | null,
    //         strengthT: this.strength.t,
    //     };
    //     let hasCollision = false; // 衝突があったかどうかを示すフラグ
    //     // 衝突する可能性のあるすべてのオブジェクトをループ
    //     for (const obj of objs) {
    //         // 特定の条件下では衝突を無視する
    //         // 1. 相手が上方向以外の一方通行ブロックの場合
    //         // 2. 自分の下方向への強さが相手の上方向への強さより大きい場合（通り抜ける）
    //         if ((obj instanceof Oneway && obj.ang !== "u") || this.strength.b > obj.strength.t) continue;
    //         // 自分の各ヒットボックスと相手の各ヒットボックスをチェック
    //         for (const thisBox of [...this.hitboxes, ...this.hiddenHitboxes]) {
    //             for (const objBox of obj.hitboxes) {
    //                 if (this.hiddenHitboxes.includes(thisBox) && !(obj instanceof Portal)) continue;
    //                 // 衝突条件のチェック
    //                 // 1. 現在、自分の底が相手の上より上にある
    //                 // 2. 次のフレームで、自分の底が相手の上に達する、またはそれを越える
    //                 // 3. 水平方向で重なっている（現在または次のフレームで）
    //                 if (
    //                     thisBox.innerB <= objBox.t &&
    //                     thisBox.b + this.vy >= objBox.t + obj.vy &&
    //                     !((thisBox.innerR <= objBox.l || thisBox.innerL >= objBox.r) && (thisBox.innerR + this.vx <= objBox.l + obj.vx || thisBox.innerL + this.vx >= objBox.r + obj.vx))
    //                 ) {
    //                     // 衝突した場合、新しいY座標を計算（相手の真上に着地）
    //                     const newY = objBox.t - thisBox.relB;
    //                     // 新しい垂直速度を計算。moveBlockの強さのオブジェクト同士なら速度を0に、そうでなければ相手の速度に合わせる（動く床など）
    //                     const newVy = this.strength.b === obj.strength.t && this.strength.b === MOVE_BLOCK_STRENGTH ? 0 : obj.vy;
    //                     // より高い位置への着地が見つかった場合、解決策を更新
    //                     if (newY < resolvedCollision.y) {
    //                         resolvedCollision = {
    //                             y: newY,
    //                             vy: newVy,
    //                             bBlock: obj,
    //                             strengthT: obj.strength.t,
    //                         };
    //                     } else if (newY === resolvedCollision.y) {
    //                         // 同じ高さの場合は、下向き速度が遅い（上向き速度が速い）方を優先
    //                         if (newVy < resolvedCollision.vy) {
    //                             resolvedCollision.vy = newVy;
    //                             resolvedCollision.bBlock = obj;
    //                             resolvedCollision.strengthT = obj.strength.t;
    //                         }
    //                     }
    //                     hasCollision = true;
    //                 }
    //             }
    //         }
    //     }
    //     // 衝突が検出され、かつ自分が下に移動していた場合にのみ、位置と速度を更新
    //     if (hasCollision && this.vy - resolvedCollision.vy >= 0) {
    //         this.y = resolvedCollision.y;
    //         this.vy = resolvedCollision.vy;
    //         this.nextBlock.b = resolvedCollision.bBlock; // どのブロックに乗っているかを記録
    //         this.strength.t = resolvedCollision.strengthT; // 強さを更新
    //     }
    // }
    // // 天井衝突
    // collideTop(objs: GameObj[]) {
    //     let resolvedCollision = {
    //         y: -Infinity,
    //         vy: this.vy,
    //         tBlock: null as GameObj | null,
    //         strengthB: this.strength.b,
    //     };
    //     let hasCollision = false;
    //     for (const obj of objs) {
    //         if ((obj instanceof Oneway && obj.ang !== "d") || this.strength.t > obj.strength.b) continue;
    //         for (const thisBox of [...this.hitboxes, ...this.hiddenHitboxes]) {
    //             for (const objBox of obj.hitboxes) {
    //                 if (this.hiddenHitboxes.includes(thisBox) && !(obj instanceof Portal)) continue;
    //                 if (
    //                     thisBox.innerT >= objBox.b &&
    //                     thisBox.t + this.vy <= objBox.b + obj.vy &&
    //                     !((thisBox.innerR <= objBox.l || thisBox.innerL >= objBox.r) && (thisBox.innerR + this.vx <= objBox.l + obj.vx || thisBox.innerL + this.vx >= objBox.r + obj.vx))
    //                 ) {
    //                     const newY = objBox.b - thisBox.relT;
    //                     const newVy = this.strength.t === obj.strength.b && this.strength.t === MOVE_BLOCK_STRENGTH ? 0 : obj.vy;
    //                     if (newY > resolvedCollision.y) {
    //                         resolvedCollision = {
    //                             y: newY,
    //                             vy: newVy,
    //                             tBlock: obj,
    //                             strengthB: obj.strength.b,
    //                         };
    //                     } else if (newY === resolvedCollision.y) {
    //                         if (newVy > resolvedCollision.vy) {
    //                             resolvedCollision.vy = newVy;
    //                             resolvedCollision.tBlock = obj;
    //                             resolvedCollision.strengthB = obj.strength.b;
    //                         }
    //                     }
    //                     hasCollision = true;
    //                 }
    //             }
    //         }
    //     }
    //     if (hasCollision && this.vy - resolvedCollision.vy <= 0) {
    //         this.y = resolvedCollision.y;
    //         this.vy = resolvedCollision.vy;
    //         this.nextBlock.t = resolvedCollision.tBlock;
    //         this.strength.b = resolvedCollision.strengthB;
    //     }
    // }
    // // 左側衝突
    // collideLeft(objs: GameObj[]) {
    //     let resolvedCollision = {
    //         x: -Infinity,
    //         vx: this.vx,
    //         lBlock: null as GameObj | null,
    //         strengthR: this.strength.r,
    //     };
    //     let hasCollision = false;
    //     for (const obj of objs) {
    //         if ((obj instanceof Oneway && obj.ang !== 90) || this.strength.l > obj.strength.r) continue;
    //         for (const thisBox of [...this.hitboxes, ...this.hiddenHitboxes]) {
    //             for (const objBox of obj.hitboxes) {
    //                 if (this.hiddenHitboxes.includes(thisBox) && !(obj instanceof Portal)) continue;
    //                 if (
    //                     thisBox.innerL >= objBox.r &&
    //                     thisBox.l + this.vx <= objBox.r + obj.vx &&
    //                     !((thisBox.innerB <= objBox.t || thisBox.innerT >= objBox.b) && (thisBox.innerB + this.vy <= objBox.t + obj.vy || thisBox.innerT + this.vy >= objBox.b + obj.vy))
    //                 ) {
    //                     const newX = objBox.r - thisBox.relL;
    //                     const newVx = this.strength.l === obj.strength.r && this.strength.l === MOVE_BLOCK_STRENGTH ? 0 : obj.vx;
    //                     if (newX > resolvedCollision.x) {
    //                         resolvedCollision = {
    //                             x: newX,
    //                             vx: newVx,
    //                             lBlock: obj,
    //                             strengthR: obj.strength.r,
    //                         };
    //                     } else if (newX === resolvedCollision.x) {
    //                         if (newVx > resolvedCollision.vx) {
    //                             resolvedCollision.vx = newVx;
    //                             resolvedCollision.lBlock = obj;
    //                             resolvedCollision.strengthR = obj.strength.r;
    //                         }
    //                     }
    //                     hasCollision = true;
    //                 }
    //             }
    //         }
    //     }
    //     if (hasCollision && this.vx - resolvedCollision.vx <= 0) {
    //         this.x = resolvedCollision.x;
    //         this.vx = resolvedCollision.vx;
    //         this.nextBlock.l = resolvedCollision.lBlock;
    //         this.strength.r = resolvedCollision.strengthR;
    //     }
    // }
    // // 右側衝突
    // collideRight(objs: GameObj[]) {
    //     let resolvedCollision = {
    //         x: Infinity,
    //         vx: this.vx,
    //         rBlock: null as GameObj | null,
    //         strengthL: this.strength.l,
    //     };
    //     let hasCollision = false;
    //     for (const obj of objs) {
    //         if ((obj instanceof Oneway && obj.ang !== -90) || this.strength.r > obj.strength.l) continue;
    //         for (const thisBox of [...this.hitboxes, ...this.hiddenHitboxes]) {
    //             for (const objBox of obj.hitboxes) {
    //                 if (this.hiddenHitboxes.includes(thisBox) && !(obj instanceof Portal)) continue;
    //                 if (
    //                     thisBox.innerR <= objBox.l &&
    //                     thisBox.r + this.vx >= objBox.l + obj.vx &&
    //                     !((thisBox.innerB <= objBox.t || thisBox.innerT >= objBox.b) && (thisBox.innerB + this.vy <= objBox.t + obj.vy || thisBox.innerT + this.vy >= objBox.b + obj.vy))
    //                 ) {
    //                     const newX = objBox.l - thisBox.relR;
    //                     const newVx = this.strength.r === obj.strength.l && this.strength.r === MOVE_BLOCK_STRENGTH ? 0 : obj.vx;
    //                     if (newX < resolvedCollision.x) {
    //                         resolvedCollision = {
    //                             x: newX,
    //                             vx: newVx,
    //                             rBlock: obj,
    //                             strengthL: obj.strength.l,
    //                         };
    //                     } else if (newX === resolvedCollision.x) {
    //                         if (newVx < resolvedCollision.vx) {
    //                             resolvedCollision.vx = newVx;
    //                             resolvedCollision.rBlock = obj;
    //                             resolvedCollision.strengthL = obj.strength.l;
    //                         }
    //                     }
    //                     hasCollision = true;
    //                 }
    //             }
    //         }
    //     }
    //     if (hasCollision && this.vx - resolvedCollision.vx >= 0) {
    //         this.x = resolvedCollision.x;
    //         this.vx = resolvedCollision.vx;
    //         this.nextBlock.r = resolvedCollision.rBlock;
    //         this.strength.l = resolvedCollision.strengthL;
    //     }
    // }
    // // --- 衝突処理いろいろ ここまで ---
    // // ポータル
    // handlePortal(portals: Portal[], app: Application) {
    //     for (const p of portals) {
    //         const entrance = p.triggers[0];
    //         const exitPortals = portals.filter((p2) => p2.id === p.id && p2 !== p);
    //         let exit;
    //         if (exitPortals.length === 1) {
    //             exit = portals.filter((p2) => p2.id === p.id && p2 !== p)[0].triggers[0];
    //         } else if (exitPortals.length === 0) {
    //             throw new Error(`There is only 1 portal with id ${p.id}`);
    //         } else {
    //             throw new Error(`There are ${exitPortals.length + 1} portals with id ${p.id}`);
    //         }
    //         // 右方向
    //         if (p.ang === -90) {
    //             const distanceX = exit.r - entrance.l;
    //             const distanceY = exit.t - entrance.t;
    //             for (const hitbox of this.hitboxes) {
    //                 if (hitbox.t >= entrance.t && hitbox.b <= entrance.b && hitbox.r >= entrance.l && hitbox.l < entrance.r) {
    //                     if (hitbox.counterpart.r && hitbox.counterpartHidden.r && hitbox.counterpart.r.counterpartHidden.l) {
    //                         hitbox.counterpart.r.relX -= Math.min(hitbox.r - entrance.l, hitbox.w);
    //                         hitbox.counterpart.r.w += Math.min(hitbox.r - entrance.l, hitbox.w);
    //                         hitbox.counterpartHidden.r.relX = entrance.centerX - this.x;
    //                         hitbox.counterpart.r.counterpartHidden.l.relX = exit.centerX - this.x;
    //                     } else {
    //                         hitbox.counterpart.r = new Hitbox(this, exit.r - this.x, distanceY + hitbox.relY, hitbox.r - entrance.l, hitbox.h, hitbox.cornerLen);
    //                         hitbox.counterpart.r.counterpart.l = hitbox;
    //                         this.hitboxes.push(hitbox.counterpart.r);
    //                         hitbox.counterpartHidden.r = new Hitbox(this, entrance.centerX - this.x, hitbox.relY, 0, hitbox.h, 0);
    //                         hitbox.counterpart.r.counterpartHidden.l = new Hitbox(this, exit.centerX - this.x, distanceY + hitbox.relY, 0, hitbox.h, 0);
    //                         this.hiddenHitboxes.push(hitbox.counterpartHidden.r, hitbox.counterpart.r.counterpartHidden.l);
    //                     }
    //                     hitbox.w = entrance.l - hitbox.l;
    //                     if (hitbox.w < 0) {
    //                         this.hitboxes = this.hitboxes.filter((h) => h !== hitbox);
    //                         hitbox.counterpart.r.counterpart.l = null;
    //                         this.hiddenHitboxes = this.hiddenHitboxes.filter((h) => h !== hitbox.counterpartHidden.r && h !== hitbox.counterpart.r?.counterpartHidden.l);
    //                         hitbox.counterpartHidden.r = null;
    //                         hitbox.counterpart.r.counterpartHidden.l = null;
    //                         hitbox.counterpart.r.w = Math.round(hitbox.counterpart.r.w * 1000) / 1000;
    //                     }
    //                 }
    //             }
    //             for (const spriteBox of this.spriteBoxes) {
    //                 if (spriteBox.t >= entrance.t && spriteBox.b <= entrance.b && spriteBox.r >= entrance.l && spriteBox.l < entrance.r) {
    //                     if (spriteBox.counterpart.r) {
    //                         spriteBox.counterpart.r.relX -= Math.min(spriteBox.r - entrance.l, spriteBox.w);
    //                         spriteBox.counterpart.r.w += Math.min(spriteBox.r - entrance.l, spriteBox.w);
    //                     } else {
    //                         spriteBox.counterpart.r = new SpriteBox(
    //                             this,
    //                             exit.r - this.x,
    //                             distanceY + spriteBox.relY,
    //                             spriteBox.r - entrance.l,
    //                             spriteBox.h,
    //                             new Box(this, distanceX + spriteBox.origin.relX, distanceY + spriteBox.origin.relY, spriteBox.origin.w, spriteBox.origin.h),
    //                         );
    //                         spriteBox.counterpart.r.counterpart.l = spriteBox;
    //                         this.spriteBoxes.push(spriteBox.counterpart.r);
    //                     }
    //                     spriteBox.w = entrance.l - spriteBox.l;
    //                     if (spriteBox.w < 0) {
    //                         this.spriteBoxes = this.spriteBoxes.filter((s) => s !== spriteBox);
    //                         spriteBox.counterpart.r.counterpart.l = null;
    //                         spriteBox.counterpart.r.w = Math.round(spriteBox.counterpart.r.w * 1000) / 1000;
    //                     }
    //                     drawSprite(this, app);
    //                 }
    //             }
    //         }
    //         // 左方向
    //         if (p.ang === 90) {
    //             const distanceX = exit.l - entrance.r;
    //             const distanceY = exit.t - entrance.t;
    //             for (const hitbox of this.hitboxes) {
    //                 if (hitbox.t >= entrance.t && hitbox.b <= entrance.b && hitbox.l <= entrance.r && hitbox.r > entrance.l) {
    //                     if (hitbox.counterpart.l && hitbox.counterpartHidden.l && hitbox.counterpart.l.counterpartHidden.r) {
    //                         hitbox.counterpart.l.w += Math.min(entrance.r - hitbox.l, hitbox.w);
    //                         hitbox.counterpartHidden.l.relX = entrance.centerX - this.x;
    //                         hitbox.counterpart.l.counterpartHidden.r.relX = exit.centerX - this.x;
    //                     } else {
    //                         hitbox.counterpart.l = new Hitbox(this, exit.l - entrance.r + hitbox.relX, distanceY + hitbox.relY, entrance.r - hitbox.l, hitbox.h, hitbox.cornerLen);
    //                         hitbox.counterpart.l.counterpart.r = hitbox;
    //                         this.hitboxes.push(hitbox.counterpart.l);
    //                         hitbox.counterpartHidden.l = new Hitbox(this, entrance.centerX - this.x, hitbox.relY, 0, hitbox.h, 0);
    //                         hitbox.counterpart.l.counterpartHidden.r = new Hitbox(this, exit.centerX - this.x, distanceY + hitbox.relY, 0, hitbox.h, 0);
    //                         this.hiddenHitboxes.push(hitbox.counterpartHidden.l, hitbox.counterpart.l.counterpartHidden.r);
    //                     }
    //                     const delta = entrance.r - hitbox.l;
    //                     hitbox.relX += delta;
    //                     hitbox.w -= delta;
    //                     if (hitbox.w < 0) {
    //                         this.hitboxes = this.hitboxes.filter((h) => h !== hitbox);
    //                         hitbox.counterpart.l.counterpart.r = null;
    //                         this.hiddenHitboxes = this.hiddenHitboxes.filter((h) => h !== hitbox.counterpartHidden.l && h !== hitbox.counterpart.l?.counterpartHidden.r);
    //                         hitbox.counterpartHidden.l = null;
    //                         hitbox.counterpart.l.counterpartHidden.r = null;
    //                         hitbox.counterpart.l.w = Math.round(hitbox.counterpart.l.w * 1000) / 1000;
    //                     }
    //                 }
    //             }
    //             for (const spriteBox of this.spriteBoxes) {
    //                 if (spriteBox.t >= entrance.t && spriteBox.b <= entrance.b && spriteBox.l <= entrance.r && spriteBox.r > entrance.l) {
    //                     if (spriteBox.counterpart.l) {
    //                         spriteBox.counterpart.l.w += Math.min(entrance.r - spriteBox.l, spriteBox.w);
    //                     } else {
    //                         spriteBox.counterpart.l = new SpriteBox(
    //                             this,
    //                             exit.l - entrance.r + spriteBox.relX,
    //                             distanceY + spriteBox.relY,
    //                             entrance.r - spriteBox.l,
    //                             spriteBox.h,
    //                             new Box(this, distanceX + spriteBox.origin.relX, distanceY + spriteBox.origin.relY, spriteBox.origin.w, spriteBox.origin.h),
    //                         );
    //                         spriteBox.counterpart.l.counterpart.r = spriteBox;
    //                         this.spriteBoxes.push(spriteBox.counterpart.l);
    //                     }
    //                     const delta = entrance.r - spriteBox.l;
    //                     spriteBox.relX += delta;
    //                     spriteBox.w -= delta;
    //                     if (spriteBox.w < 0) {
    //                         this.spriteBoxes = this.spriteBoxes.filter((s) => s !== spriteBox);
    //                         spriteBox.counterpart.l.counterpart.r = null;
    //                         spriteBox.counterpart.l.w = Math.round(spriteBox.counterpart.l.w * 1000) / 1000;
    //                     }
    //                     drawSprite(this, app);
    //                 }
    //             }
    //         }
    //         // 下方向
    //         if (p.ang === 0) {
    //             const distanceX = exit.l - entrance.l;
    //             const distanceY = exit.b - entrance.t;
    //             for (const hitbox of this.hitboxes) {
    //                 if (hitbox.l >= entrance.l && hitbox.r <= entrance.r && hitbox.b >= entrance.t && hitbox.t < entrance.b) {
    //                     if (hitbox.counterpart.d && hitbox.counterpartHidden.d && hitbox.counterpart.d.counterpartHidden.u) {
    //                         hitbox.counterpart.d.relY -= Math.min(hitbox.b - entrance.t, hitbox.h);
    //                         hitbox.counterpart.d.h += Math.min(hitbox.b - entrance.t, hitbox.h);
    //                         hitbox.counterpartHidden.d.relY = entrance.centerY - this.y;
    //                         hitbox.counterpart.d.counterpartHidden.u.relY = exit.centerY - this.y;
    //                     } else {
    //                         hitbox.counterpart.d = new Hitbox(this, distanceX + hitbox.relX, exit.b - this.y, hitbox.w, hitbox.b - entrance.t, hitbox.cornerLen);
    //                         hitbox.counterpart.d.counterpart.u = hitbox;
    //                         this.hitboxes.push(hitbox.counterpart.d);
    //                         hitbox.counterpartHidden.d = new Hitbox(this, hitbox.relX, entrance.centerY - this.y, hitbox.w, 0, 0);
    //                         hitbox.counterpart.d.counterpartHidden.u = new Hitbox(this, distanceX + hitbox.relX, exit.centerY - this.y, hitbox.w, 0, 0);
    //                         this.hiddenHitboxes.push(hitbox.counterpartHidden.d, hitbox.counterpart.d.counterpartHidden.u);
    //                     }
    //                     hitbox.h = entrance.t - hitbox.t;
    //                     if (hitbox.h < 0) {
    //                         this.hitboxes = this.hitboxes.filter((h) => h !== hitbox);
    //                         hitbox.counterpart.d.counterpart.u = null;
    //                         this.hiddenHitboxes = this.hiddenHitboxes.filter((h) => h !== hitbox.counterpartHidden.d && h !== hitbox.counterpart.d?.counterpartHidden.u);
    //                         hitbox.counterpartHidden.d = null;
    //                         hitbox.counterpart.d.counterpartHidden.u = null;
    //                         hitbox.counterpart.d.h = Math.round(hitbox.counterpart.d.h * 1000) / 1000;
    //                     }
    //                 }
    //             }
    //             for (const spriteBox of this.spriteBoxes) {
    //                 if (spriteBox.l >= entrance.l && spriteBox.r <= entrance.r && spriteBox.b >= entrance.t && spriteBox.t < entrance.b) {
    //                     if (spriteBox.counterpart.d) {
    //                         spriteBox.counterpart.d.relY -= Math.min(spriteBox.b - entrance.t, spriteBox.h);
    //                         spriteBox.counterpart.d.h += Math.min(spriteBox.b - entrance.t, spriteBox.h);
    //                     } else {
    //                         spriteBox.counterpart.d = new SpriteBox(
    //                             this,
    //                             distanceX + spriteBox.relX,
    //                             exit.b - this.y,
    //                             spriteBox.w,
    //                             spriteBox.b - entrance.t,
    //                             new Box(this, distanceX + spriteBox.origin.relX, distanceY + spriteBox.origin.relY, spriteBox.origin.w, spriteBox.origin.h),
    //                         );
    //                         spriteBox.counterpart.d.counterpart.u = spriteBox;
    //                         this.spriteBoxes.push(spriteBox.counterpart.d);
    //                     }
    //                     spriteBox.h = entrance.t - spriteBox.t;
    //                     if (spriteBox.h < 0) {
    //                         this.spriteBoxes = this.spriteBoxes.filter((s) => s !== spriteBox);
    //                         spriteBox.counterpart.d.counterpart.u = null;
    //                         spriteBox.counterpart.d.h = Math.round(spriteBox.counterpart.d.h * 1000) / 1000;
    //                     }
    //                     drawSprite(this, app);
    //                 }
    //             }
    //         }
    //         // 上方向
    //         if (p.ang === 180) {
    //             const distanceX = exit.l - entrance.l;
    //             const distanceY = exit.t - entrance.b;
    //             for (const hitbox of this.hitboxes) {
    //                 if (hitbox.l >= entrance.l && hitbox.r <= entrance.r && hitbox.t <= entrance.b && hitbox.b > entrance.t) {
    //                     if (hitbox.counterpart.u && hitbox.counterpartHidden.u && hitbox.counterpart.u.counterpartHidden.d) {
    //                         hitbox.counterpart.u.h += Math.min(entrance.b - hitbox.t, hitbox.h);
    //                         hitbox.counterpartHidden.u.relY = entrance.centerY - this.y;
    //                         hitbox.counterpart.u.counterpartHidden.d.relY = exit.centerY - this.y;
    //                     } else {
    //                         hitbox.counterpart.u = new Hitbox(this, distanceX + hitbox.relX, exit.t - entrance.b + hitbox.relY, hitbox.w, entrance.b - hitbox.t, hitbox.cornerLen);
    //                         hitbox.counterpart.u.counterpart.d = hitbox;
    //                         this.hitboxes.push(hitbox.counterpart.u);
    //                         hitbox.counterpartHidden.u = new Hitbox(this, hitbox.relX, entrance.centerY - this.y, hitbox.w, 0, 0);
    //                         hitbox.counterpart.u.counterpartHidden.d = new Hitbox(this, distanceX + hitbox.relX, exit.centerY - this.y, hitbox.w, 0, 0);
    //                         this.hiddenHitboxes.push(hitbox.counterpartHidden.u, hitbox.counterpart.u.counterpartHidden.d);
    //                     }
    //                     const delta = entrance.b - hitbox.t;
    //                     hitbox.relY += delta;
    //                     hitbox.h -= delta;
    //                     if (hitbox.h < 0) {
    //                         this.hitboxes = this.hitboxes.filter((h) => h !== hitbox);
    //                         hitbox.counterpart.u.counterpart.d = null;
    //                         this.hiddenHitboxes = this.hiddenHitboxes.filter((h) => h !== hitbox.counterpartHidden.u && h !== hitbox.counterpart.u?.counterpartHidden.d);
    //                         hitbox.counterpartHidden.u = null;
    //                         hitbox.counterpart.u.counterpartHidden.d = null;
    //                         hitbox.counterpart.u.h = Math.round(hitbox.counterpart.u.h * 1000) / 1000;
    //                     }
    //                 }
    //             }
    //             for (const spriteBox of this.spriteBoxes) {
    //                 if (spriteBox.l >= entrance.l && spriteBox.r <= entrance.r && spriteBox.t <= entrance.b && spriteBox.b > entrance.t) {
    //                     if (spriteBox.counterpart.u) {
    //                         spriteBox.counterpart.u.h += Math.min(entrance.b - spriteBox.t, spriteBox.h);
    //                     } else {
    //                         spriteBox.counterpart.u = new SpriteBox(
    //                             this,
    //                             distanceX + spriteBox.relX,
    //                             exit.t - entrance.b + spriteBox.relY,
    //                             spriteBox.w,
    //                             entrance.b - spriteBox.t,
    //                             new Box(this, distanceX + spriteBox.origin.relX, distanceY + spriteBox.origin.relY, spriteBox.origin.w, spriteBox.origin.h),
    //                         );
    //                         spriteBox.counterpart.u.counterpart.d = spriteBox;
    //                         this.spriteBoxes.push(spriteBox.counterpart.u);
    //                     }
    //                     const delta = entrance.b - spriteBox.t;
    //                     spriteBox.relY += delta;
    //                     spriteBox.h -= delta;
    //                     if (spriteBox.h < 0) {
    //                         this.spriteBoxes = this.spriteBoxes.filter((s) => s !== spriteBox);
    //                         spriteBox.counterpart.u.counterpart.d = null;
    //                         spriteBox.counterpart.u.h = Math.round(spriteBox.counterpart.u.h * 1000) / 1000;
    //                     }
    //                     drawSprite(this, app);
    //                 }
    //             }
    //         }
    //     }
    // }
}

// プレイヤー
export class Player extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction) {
        super(x, y, ang, 0, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "player", "idle", true, PLAYER_STRENGTH, MOVE_OBJ_CORNER_CORRECT);
    }
    // override collideBottom(objs: GameObj[]) {
    //     let resolvedCollision = {
    //         y: Infinity,
    //         vy: this.vy,
    //         bBlock: null as GameObj | null,
    //         strengthT: this.strength.t,
    //     };
    //     let hasCollision = false;

    //     for (const obj of objs) {
    //         if ((obj instanceof Oneway && obj.ang !== "u") || this.strength.b > obj.strength.t) continue;
    //         for (const thisBox of [...this.hitboxes, ...this.hiddenHitboxes]) {
    //             for (const objBox of obj.hitboxes) {
    //                 if (this.hiddenHitboxes.includes(thisBox) && !(obj instanceof Portal)) continue;
    //                 if (
    //                     ((obj instanceof Ladder && !pressingEvent.d && thisBox.b <= objBox.t && thisBox.b + this.vy >= objBox.t + obj.vy) || !(obj instanceof Ladder)) &&
    //                     thisBox.innerB <= objBox.t &&
    //                     thisBox.b + this.vy >= objBox.t + obj.vy &&
    //                     !((thisBox.innerR <= objBox.l || thisBox.innerL >= objBox.r) && (thisBox.innerR + this.vx < objBox.l + obj.vx || thisBox.innerL + this.vx > objBox.r + obj.vx))
    //                 ) {
    //                     const newY = objBox.t - thisBox.relB;
    //                     const newVy = this.strength.b === obj.strength.t && this.strength.b === MOVE_BLOCK_STRENGTH ? 0 : obj.vy;

    //                     if (newY < resolvedCollision.y) {
    //                         resolvedCollision = {
    //                             y: newY,
    //                             vy: newVy,
    //                             bBlock: obj,
    //                             strengthT: obj.strength.t,
    //                         };
    //                     } else if (newY === resolvedCollision.y) {
    //                         if (newVy < resolvedCollision.vy) {
    //                             resolvedCollision = {
    //                                 y: newY,
    //                                 vy: newVy,
    //                                 bBlock: obj,
    //                                 strengthT: obj.strength.t,
    //                             };
    //                         } else if (resolvedCollision.bBlock && newVy === resolvedCollision.vy && obj.initStrength > resolvedCollision.bBlock.initStrength) {
    //                             resolvedCollision.bBlock = obj;
    //                             resolvedCollision.strengthT = obj.strength.t;
    //                         }
    //                     }
    //                     hasCollision = true;
    //                 }
    //             }
    //         }
    //     }

    //     if (hasCollision && this.vy - resolvedCollision.vy >= 0) {
    //         this.y = resolvedCollision.y;
    //         this.vy = resolvedCollision.vy;
    //         this.nextBlock.b = resolvedCollision.bBlock;
    //         this.strength.t = resolvedCollision.strengthT;
    //     }
    // }
    handleLadder(ladders: Ladder[]) {
        const wasInLadders = this.inLadders;
        this.inLadders = ladders.filter((l) => isOverLapping(this, l));
        if (wasInLadders.length && !this.inLadders.length) this.v.y = 0; //ハシゴから出たときy方向の速度を0にする
        if (this.inLadders.length) {
            if (pressingEvent.u && pressingEvent.d) this.v.y = 0;
            else if (pressingEvent.u) {
                const ladderTop = Math.min(...this.inLadders.map((l) => l.hitboxes[0].u));
                const distToTop = roundDecimal(this.hitboxes[0].d - ladderTop, POS_PRECISION);
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
            if (!this.nextBlocks.d.length) {
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
}
// ブロック
export class Block extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction, isSolid: boolean, color: number) {
        super(x, y, ang, color, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "block", "default", isSolid, BLOCK_STRENGTH);
    }
}
// ハシゴ
export class Ladder extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction) {
        super(x, y, ang, 0, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "ladder", "default", true, BLOCK_STRENGTH);
    }
}
// 鍵
export class Key extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number) {
        super(x, y, ang, color, [{ relX: 0.2, relY: 0.2, w: w - 0.4, h: h - 0.4 }], [{ relX: 0, relY: 0, w, h }], "key", "default", false, -1);
    }
}
// 一方通行ブロック
export class Oneway extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number) {
        super(x, y, ang, color, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "oneway", "default", true, BLOCK_STRENGTH);
    }
}
// レバー
export class Lever extends GameObj {
    isBeingContacted: boolean;
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number) {
        super(x, y, ang, color, [{ relX: 0.2, relY: 0.2, w: w - 0.4, h: h - 0.4 }], [{ relX: 0, relY: 0, w, h }], "lever", "off", false, -1);
        this.isBeingContacted = false;
    }
}
// ポータル
export class Portal extends GameObj {
    id: string;
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
            BLOCK_STRENGTH,
        );
        this.id = id;
        this.hitboxes.forEach((t) => {
            rotate(t, ang, w, h);
        });
    }
}
// 押しブロック
export class PushBlock extends GameObj {
    constructor(x: number, y: number, w: number, h: number, ang: Direction) {
        super(x, y, ang, 0, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "pushBlock", "default", true, PUSH_BLOCK_STRENGTH, 0.2);
    }
    // handleLadder(ladders: Ladder[]) {
    //     // ハシゴ
    //     for (const ladder of ladders) {
    //         // 梯子判定
    //         if (this.isColliding(ladder.triggers[0])) {
    //             this.inLadder = ladder;
    //             break;
    //         } else this.inLadder = null;
    //     }
    //     if (this.inLadder) this.vy = 0;
    // }
}
// ボタン
export class Button extends GameObj {
    isPressed: Boolean;
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number) {
        super(x, y, ang, color, [{ relX: 0, relY: (3 / 4) * h, w, h: h / 4 }], [{ relX: 0, relY: 0, w, h }], "button", "off", true, BLOCK_STRENGTH);
        this.isPressed = false;
        this.hitboxes.forEach((b) => {
            rotate(b, ang, w, h);
        });
    }
}
// 駆動ブロック
export class MoveBlock extends GameObj {
    isActivated: boolean;
    constructor(x: number, y: number, w: number, h: number, ang: Direction, color: number, isActivated: boolean) {
        super(x, y, ang, color, [{ relX: 0, relY: 0, w, h }], [{ relX: 0, relY: 0, w, h }], "moveBlock", isActivated ? "on" : "off", true, MOVE_BLOCK_STRENGTH);
        this.isActivated = isActivated;
    }
}
