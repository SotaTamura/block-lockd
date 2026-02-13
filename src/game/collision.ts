import { Axis, MAX_ITER, opposite, POS_PRECISION, POS_SNAP, roundDecimal, Direction, ε } from "@/constants";
import { GameObj, Hitbox, Ladder, Oneway, Player } from "./class";
import { pressingEvent } from "./base";

/** 速度の方向(速度0の場合null) */
const vDir1D = (v: number, axis: Axis): Direction | null => {
    if (v === 0) return null;
    if (axis === "x") return v > 0 ? "r" : "l";
    else return v > 0 ? "d" : "u";
};

/** bに対してaがどの向きにいるか(重なっている場合はnull(境界除く)) */
const relDir1D = (aHitbox: Hitbox, bHitbox: Hitbox, axis: Axis): Direction | null => {
    if (axis === "x") {
        if (aHitbox.r <= bHitbox.l) return "l";
        if (aHitbox.l >= bHitbox.r) return "r";
    }
    if (aHitbox.d <= bHitbox.u) return "u";
    if (aHitbox.u >= bHitbox.d) return "d";
    return null;
};

/** 座標ax, 長さalの区間と座標bx, 長さblの区間が重なっているかどうか(境界除く) */
const isOverlapping1D = (ax: number, al: number, bx: number, bl: number) => {
    return ax < bx + bl && ax + al > bx;
};

/** 重なり判定(境界除く) */
export const isOverLapping = (a: GameObj, b: GameObj) => {
    return a.hitboxes.some((aHitbox) => b.hitboxes.some((bHitbox) => isOverlapping1D(aHitbox.x, aHitbox.sz.x, bHitbox.x, bHitbox.sz.x) && isOverlapping1D(aHitbox.y, aHitbox.sz.y, bHitbox.y, bHitbox.sz.y)));
};

/** 座標ax, 長さal、速さavの区間と座標bx, 長さbl、速さbvの区間との衝突。衝突する時刻t及びaの相対速度を返す */
const collision1D = (ax: number, al: number, av: number, bx: number, bl: number, bv: number) => {
    if (av === bv) return null; // 相対速度が0の場合
    if (isOverlapping1D(ax, al, bx, bl)) return null; // 重なっている場合
    // 衝突する場合
    const relV = av - bv;
    return { t: av > bv ? (bx - (ax + al)) / relV : (bx + bl - ax) / relV, relV };
};

/** 衝突を無視するパターンかどうか */
const isIgnoreCollision = (aHitbox: Hitbox, bHitbox: Hitbox, axis: Axis) => {
    const a = aHitbox.owner;
    const b = bHitbox.owner;
    if (a instanceof Ladder || b instanceof Ladder) {
        if (axis === "x") return true; // ハシゴの側面とは衝突しない
        let ladder;
        let ladderHitbox;
        let other;
        let otherHitbox;
        if (a instanceof Ladder && !(b instanceof Ladder)) {
            ladder = a;
            ladderHitbox = aHitbox;
            other = b;
            otherHitbox = bHitbox;
        } else if (!(a instanceof Ladder) && b instanceof Ladder) {
            ladder = b;
            ladderHitbox = bHitbox;
            other = a;
            otherHitbox = aHitbox;
        } else return false;
        if (other.inLadders.length) return true; // ハシゴの中にいるときは衝突しない
        if (otherHitbox.y > ladderHitbox.y) return true; // ハシゴの下面とは衝突しない
        if (other instanceof Player && pressingEvent.d) return true; // プレイヤーがハシゴの頂上から下ろうとしているときは衝突しない
    }
    if (a instanceof Oneway || b instanceof Oneway) {
        let oneway;
        let onewayHitbox;
        let other;
        let otherHitbox;
        if (a instanceof Oneway && !(b instanceof Oneway)) {
            oneway = a;
            onewayHitbox = aHitbox;
            other = b;
            otherHitbox = bHitbox;
        } else if (!(a instanceof Oneway) && b instanceof Oneway) {
            oneway = b;
            onewayHitbox = bHitbox;
            other = a;
            otherHitbox = aHitbox;
        } else return false;
        if (oneway.dir === relDir1D(otherHitbox, onewayHitbox, axis)) return false; // 一方通行ブロックに逆らう方向の衝突は考える
        return true; // それ以外の方向は無視
    }
    return false;
};

/** 次に起こる衝突を探す。最短衝突時間tと、その時間に衝突するペアのリストhitsを返す */
const findEarliestCollision1D = (gameObjs: GameObj[], axis: Axis, tRemain: number) => {
    let tMin = tRemain;
    const hits: { a: GameObj; b: GameObj; relV: number }[] = [];
    const crossAxis = axis === "x" ? "y" : "x";
    for (let i = 0; i < gameObjs.length; i++) {
        for (let j = i + 1; j < gameObjs.length; j++) {
            const a = gameObjs[i];
            const b = gameObjs[j];
            let tPair: number | null = null;
            let relVPair: number | null = null;
            for (const aHitbox of a.hitboxes) {
                for (const bHitbox of b.hitboxes) {
                    if (isIgnoreCollision(aHitbox, bHitbox, axis)) continue;
                    if (!isOverlapping1D(aHitbox[crossAxis], aHitbox.sz[crossAxis], bHitbox[crossAxis], bHitbox.sz[crossAxis])) continue;
                    const collision = collision1D(aHitbox[axis], aHitbox.sz[axis], a.v[axis], bHitbox[axis], bHitbox.sz[axis], b.v[axis]);
                    if (collision === null) continue;
                    const { t, relV } = collision;
                    if (t === null || t < 0 || t > tRemain) continue;
                    if (tPair === null || t < tPair) {
                        tPair = t;
                        relVPair = relV;
                    }
                }
            }
            if (tPair !== null && relVPair !== null) {
                if (tPair < tMin - ε) {
                    tMin = tPair;
                    hits.length = 0;
                    hits.push({ a, b, relV: relVPair });
                } else if (Math.abs(tPair - tMin) < ε) {
                    hits.push({ a, b, relV: relVPair }); // 同時衝突を集める
                }
            }
        }
    }
    return { t: tMin, hits };
};

/** 1次元の衝突解決 */
const resolveCollision1D = (hit: { a: GameObj; b: GameObj; relV: number }, axis: Axis) => {
    const { a, b } = hit;
    let av = a.v[axis];
    let bv = b.v[axis];
    const aCollisionDir = vDir1D(hit.relV, axis);
    if (!aCollisionDir) return;
    const bCollisionDir = opposite[aCollisionDir];
    // 強さが等しい場合
    if (a.strength[aCollisionDir] === b.strength[bCollisionDir]) {
        // 速度の絶対値が等しく向きが逆の場合、静止
        if (Math.abs(av + bv) < ε) {
            av = 0;
            bv = 0;
        }
        // 速度の絶対値が大きい方に合わせる
        else if (Math.abs(av) > Math.abs(bv)) {
            bv = av;
        } else {
            av = bv;
        }
    }
    // 強さが異なる場合、強い方に合わせる
    else if (a.strength[aCollisionDir] > b.strength[bCollisionDir]) {
        bv = av;
        b.strength[opposite[bCollisionDir]] = a.strength[aCollisionDir];
    } else {
        av = bv;
        a.strength[opposite[aCollisionDir]] = b.strength[bCollisionDir];
    }
    a.v[axis] = av;
    b.v[axis] = bv;
};

/** 静止オブジェクトの座標をスナップ */
export const snapPos = (gameObjs: GameObj[]) => {
    for (const obj of gameObjs) {
        if (obj.v.x === 0 && obj.v.y === 0) {
            obj.x = roundDecimal(obj.x, POS_SNAP);
            obj.y = roundDecimal(obj.y, POS_SNAP);
        }
    }
};

/** フレーム内で全てのオブジェクトの1次元の衝突解決をする */
const resolveCollisions1D = (gameObjs: GameObj[], axis: Axis) => {
    let tRemain = 1;
    let iter = 0;
    while (tRemain > ε && iter < MAX_ITER) {
        iter++;
        if (iter === MAX_ITER) console.log("MAX_ITER REACHED");
        // 一番最初に起こる衝突を求める
        const { t, hits } = findEarliestCollision1D(gameObjs, axis, tRemain);
        // 衝突まで進める
        for (const obj of gameObjs) {
            obj[axis] = roundDecimal(obj[axis] + obj.v[axis] * t, POS_PRECISION);
        }
        // 衝突が起きない場合
        if (hits.length === 0) break;
        // 衝突したオブジェクトの速度変更
        for (const hit of hits) {
            resolveCollision1D(hit, axis);
        }
        tRemain -= t;
    }
};

/** フレーム内で全てのオブジェクトの衝突解決をする */
export const resolveCollisions = (gameObjs: GameObj[]) => {
    resolveCollisions1D(gameObjs, "x");
    resolveCollisions1D(gameObjs, "y");
};

/** 接触判定の更新 */
export const updateNextBlocks = (gameObjs: GameObj[]) => {
    for (const o of gameObjs) o.nextBlocks = { u: [], d: [], l: [], r: [] };
    for (let i = 0; i < gameObjs.length; i++) {
        for (let j = i + 1; j < gameObjs.length; j++) {
            const a = gameObjs[i];
            const b = gameObjs[j];
            for (const dir of ["l", "r", "u", "d"] as Direction[]) {
                const oppositeDir = opposite[dir];
                const axis = ["u", "d"].includes(dir) ? "y" : "x";
                const crossAxis = axis === "x" ? "y" : "x";
                for (const aHitbox of a.hitboxes) {
                    for (const bHitbox of b.hitboxes) {
                        if (isIgnoreCollision(aHitbox, bHitbox, axis)) continue;
                        if (!isOverlapping1D(aHitbox[crossAxis], aHitbox.sz[crossAxis], bHitbox[crossAxis], bHitbox.sz[crossAxis])) continue;
                        if (Math.abs(aHitbox[dir] - bHitbox[oppositeDir]) <= ε) {
                            if (!a.nextBlocks[dir].includes(b)) a.nextBlocks[dir].push(b);
                            if (!b.nextBlocks[oppositeDir].includes(a)) b.nextBlocks[oppositeDir].push(a);
                        }
                    }
                }
            }
        }
    }
};
