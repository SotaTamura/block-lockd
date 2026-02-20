import { Axis, MAX_ITER, opposite, Direction, ε, CORNER_CORRECT } from "@/constants";
import { Box, GameObj, Hitbox, Ladder, Oneway, Player, Portal, SpriteBox } from "./class";
import { playSfx, pressingEvent } from "./base";
import { portals } from "./main";

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
/** 座標ax, 長さalの区間が座標bx, 長さblの区間に含まれているかどうか(境界含む) */
const isContained1D = (ax: number, al: number, bx: number, bl: number) => {
    return ax >= bx && ax + al <= bx + bl;
};

/** 重なり判定(境界除く) */
export const isOverLappingBox = (a: Box, b: Box) => {
    return isOverlapping1D(a.x, a.sz.x, b.x, b.sz.x) && isOverlapping1D(a.y, a.sz.y, b.y, b.sz.y);
};
/** 重なり判定(境界除く) */
export const isOverLapping = (a: GameObj, b: GameObj) => {
    return a.hitboxes.some((aHitbox) => b.hitboxes.some((bHitbox) => isOverLappingBox(aHitbox, bHitbox)));
};

/** 座標ax, 長さal、速さavの区間と座標bx, 長さbl、速さbvの区間との衝突。衝突する時刻t及びaの相対速度を返す */
const collision1D = (ax: number, al: number, av: number, bx: number, bl: number, bv: number) => {
    const relV = av - bv;
    if (relV === 0) return null; // 相対速度が0の場合
    if (isOverlapping1D(ax, al, bx, bl)) return null; // 重なっている場合
    // 衝突する場合
    return { t: relV > 0 ? (bx - (ax + al)) / relV : (bx + bl - ax) / relV, relV };
};

/** 衝突を無視するパターンかどうか */
const isIgnoreCollision = (aHitbox: Hitbox, bHitbox: Hitbox, axis: Axis) => {
    const a = aHitbox.owner;
    const b = bHitbox.owner;
    if (a instanceof Ladder || b instanceof Ladder) {
        if (axis === "x") return true; // ハシゴの側面とは衝突しない
        let ladderHitbox: Hitbox;
        let other: GameObj;
        let otherHitbox: Hitbox;
        if (a instanceof Ladder && !(b instanceof Ladder)) {
            ladderHitbox = aHitbox;
            other = b;
            otherHitbox = bHitbox;
        } else if (!(a instanceof Ladder) && b instanceof Ladder) {
            ladderHitbox = bHitbox;
            other = a;
            otherHitbox = aHitbox;
        } else return false;
        if (other.inLadders.length) return true; // ハシゴの中にいるときは衝突しない
        if (otherHitbox.y > ladderHitbox.y) return true; // ハシゴの下面とは衝突しない
        if (other instanceof Player && pressingEvent.d) return true; // プレイヤーがハシゴの頂上から下ろうとしているときは衝突しない
    }
    if (a instanceof Oneway || b instanceof Oneway) {
        let oneway: Oneway;
        let onewayHitbox: Hitbox;
        let other: GameObj;
        let otherHitbox: Hitbox;
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

        const rel = relDir1D(otherHitbox, onewayHitbox, axis);
        if (rel === null) {
            // 重なっている場合、その軸が一方通行の阻止方向であり、かつ阻止される方向に動こうとしていれば衝突とみなす
            const onewayAxis = ["u", "d"].includes(oneway.dir) ? "y" : "x";
            if (axis !== onewayAxis) return true;
            const relV = other.v[axis] - oneway.v[axis];
            if (oneway.dir === "u" && relV >= 0) return false;
            if (oneway.dir === "d" && relV <= 0) return false;
            if (oneway.dir === "l" && relV >= 0) return false;
            if (oneway.dir === "r" && relV <= 0) return false;
            return true;
        }
        if (oneway.dir === rel) return false; // 一方通行ブロックに逆らう方向の衝突は考える
        return true; // それ以外の方向は無視
    }
    return false;
};

/** 角補正 */
const cornerCorrect = (hit: { a: GameObj; b: GameObj; relV: number }, axis: Axis, gameObjs: GameObj[]) => {
    const { a, b } = hit;
    const crossAxis = axis === "x" ? "y" : "x";
    const positiveDir = crossAxis === "x" ? "r" : "d";
    const negativeDir = opposite[positiveDir];
    const aCollisionDir = vDir1D(hit.relV, axis);
    if (!aCollisionDir) return false;
    const bCollisionDir = opposite[aCollisionDir];
    // strengthが小さい方の座標を補正する
    let weaker: GameObj;
    let stronger: GameObj;
    let bothMove = false;
    if (a.strength[aCollisionDir] < b.strength[bCollisionDir]) {
        weaker = a;
        stronger = b;
    } else if (a.strength[aCollisionDir] > b.strength[bCollisionDir]) {
        weaker = b;
        stronger = a;
    } else {
        weaker = a;
        stronger = b;
        bothMove = true;
    }
    for (let i = 0; i < weaker.hitboxes.length; i++) {
        for (let j = 0; j < stronger.hitboxes.length; j++) {
            const weakerHitBox = weaker.hitboxes[i];
            const strongerHitBox = stronger.hitboxes[j];
            let overlap = Math.min(weakerHitBox[positiveDir], strongerHitBox[positiveDir]) - Math.max(weakerHitBox[negativeDir], strongerHitBox[negativeDir]);
            // 厚さ0のヒットボックス(ポータルの壁など)を跨いでいる場合
            if (strongerHitBox.sz[crossAxis] === 0 && weakerHitBox[negativeDir] < strongerHitBox[negativeDir] && weakerHitBox[positiveDir] > strongerHitBox[positiveDir]) {
                overlap = Math.min(strongerHitBox[negativeDir] - weakerHitBox[negativeDir], weakerHitBox[positiveDir] - strongerHitBox[positiveDir]);
            }
            if (overlap <= 0 || overlap > CORNER_CORRECT || overlap >= weakerHitBox.sz[crossAxis] || (strongerHitBox.sz[crossAxis] > 0 && overlap >= strongerHitBox.sz[crossAxis])) continue;
            const oldCrossPosA = a[crossAxis];
            const oldCrossPosB = b[crossAxis];
            let diff = 0;
            // 端を揃える
            if (weakerHitBox.center[crossAxis] < strongerHitBox.center[crossAxis] && weaker.v[crossAxis] <= 0) {
                diff = strongerHitBox[negativeDir] - weakerHitBox[positiveDir];
            } else if (weakerHitBox.center[crossAxis] > strongerHitBox.center[crossAxis] && weaker.v[crossAxis] >= 0) {
                diff = strongerHitBox[positiveDir] - weakerHitBox[negativeDir];
            } else return false;

            if (bothMove) {
                const moveDirA = diff > 0 ? positiveDir : negativeDir;
                const moveDirB = opposite[moveDirA];
                if (a.nextBlocks[moveDirA].length > 0 || b.nextBlocks[moveDirB].length > 0) return false;
                a[crossAxis] += diff / 2;
                b[crossAxis] -= diff / 2;
            } else {
                const moveDir = diff > 0 ? positiveDir : negativeDir;
                if (weaker.nextBlocks[moveDir].length > 0) return false;
                weaker[crossAxis] += diff;
            }

            const checkValid = (obj: GameObj, dir: Direction) => {
                // 補正後の位置で他のオブジェクトと重ならないかチェック
                if (
                    gameObjs.some((o) => {
                        if (o === obj) return false;
                        return obj.hitboxes.some((ah) =>
                            o.hitboxes.some((bh) => {
                                if (!isOverLappingBox(ah, bh)) return false;
                                // 元の軸と、補正によって動いた軸の両方で衝突をチェックする
                                return !isIgnoreCollision(ah, bh, axis) || !isIgnoreCollision(ah, bh, crossAxis);
                            }),
                        );
                    })
                )
                    return false;
                // 補正後の位置で進行方向が塞がれていないかチェック
                if (
                    gameObjs.some((o) => {
                        if (o === obj) return false;
                        return obj.hitboxes.some((ah) =>
                            o.hitboxes.some((bh) => {
                                if (isIgnoreCollision(ah, bh, axis)) return false;
                                if (!isOverlapping1D(ah[crossAxis], ah.sz[crossAxis], bh[crossAxis], bh.sz[crossAxis])) return false;
                                return ah[dir] === bh[opposite[dir]];
                            }),
                        );
                    })
                )
                    return false;
                return true;
            };

            if (!checkValid(a, aCollisionDir) || !checkValid(b, bCollisionDir)) {
                a[crossAxis] = oldCrossPosA;
                b[crossAxis] = oldCrossPosB;
                return false;
            }

            if (stronger instanceof Portal) return true;
            return true;
        }
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
            if (!a.canMove && !b.canMove) continue;
            let tPair: number | null = null;
            let relVPair: number | null = null;
            for (const aHitbox of [...a.hitboxes, ...a.hiddenHitboxes]) {
                for (const bHitbox of [...b.hitboxes, ...b.hiddenHitboxes]) {
                    if (isIgnoreCollision(aHitbox, bHitbox, axis)) continue;
                    // hiddenHitboxはPortalとしか衝突しない
                    if (a.hiddenHitboxes.includes(aHitbox) && !(b instanceof Portal)) continue;
                    if (b.hiddenHitboxes.includes(bHitbox) && !(a instanceof Portal)) continue;

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

/** 次にポータルに入る時間tと、ボックスboxとポータルportalのペアのリストentriesを返す */
const findEarliestPortalEnter1D = (gameObjs: GameObj[], axis: Axis, tRemain: number) => {
    let tMin = tRemain;
    const entries: { box: Hitbox | SpriteBox; portal: Portal }[] = [];
    const crossAxis = axis === "x" ? "y" : "x";
    for (const obj of gameObjs.filter((o) => !(o instanceof Portal))) {
        const dir = vDir1D(obj.v[axis], axis);
        if (!dir) continue;
        for (const box of [...obj.hitboxes, ...obj.spriteBoxes]) {
            if (box.counterpart[dir]) continue;
            for (const portalObj of portals) {
                if (dir !== opposite[portalObj.dir]) continue; // 常に正面からのみ進入可能
                const pt = portalObj.trigger;
                // 角補正を考慮して、完全に含まれていなくても判定する
                if (!isOverlapping1D(box[crossAxis], box.sz[crossAxis], pt[crossAxis], pt.sz[crossAxis])) continue;
                let t: number;
                const collision = collision1D(box[axis], box.sz[axis], obj.v[axis], pt[axis], pt.sz[axis], 0);
                if (collision === null) {
                    if (isOverlapping1D(box[axis], box.sz[axis], pt[axis], pt.sz[axis])) t = 0;
                    else continue;
                } else {
                    t = collision.t;
                }
                if (t === null || t < 0 || t > tRemain) continue;
                if (t < tMin - ε) {
                    tMin = t;
                    entries.length = 0;
                    entries.push({ box, portal: portalObj });
                } else if (Math.abs(t - tMin) < ε) {
                    entries.push({ box, portal: portalObj }); // 同時衝突を集める
                }
            }
        }
    }
    return { t: tMin, entries };
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
        if (av === -bv) {
            av = 0;
            bv = 0;
        }
        // 速度の絶対値が小さい方に合わせる
        else if (Math.abs(av) < Math.abs(bv)) {
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

/** フレーム内で全てのオブジェクトの1次元の衝突解決をする */
const resolveCollisions1D = (gameObjs: GameObj[], axis: Axis) => {
    let tRemain = 1;
    let iter = 0;
    while (tRemain > ε && iter < MAX_ITER) {
        iter++;
        if (iter === MAX_ITER) console.log("MAX_ITER REACHED");
        // 一番最初に起こる衝突を求める
        const { t: collisionT, hits } = findEarliestCollision1D(gameObjs, axis, tRemain);
        const { t: pEnterT, entries } = findEarliestPortalEnter1D(gameObjs, axis, tRemain);
        const t = Math.min(collisionT, pEnterT);
        // 衝突まで進める
        for (const obj of gameObjs) {
            obj[axis] += obj.v[axis] * t;
        }
        // ポータルに入った当たり判定のcounterpartを厚さ0で作る
        if (t === pEnterT) {
            let handledNearMiss = false;
            for (const { box, portal } of entries) {
                const crossAxis = axis === "x" ? "y" : "x";
                // 完全に含まれていない場合は角補正を試みる
                if (!isContained1D(box[crossAxis], box.sz[crossAxis], portal.trigger[crossAxis], portal.trigger.sz[crossAxis])) {
                    if (cornerCorrect({ a: box.owner, b: portal, relV: box.owner.v[axis] }, axis, gameObjs)) {
                        handledNearMiss = true;
                        continue;
                    }
                    continue; // 角補正もできない場合は侵入失敗
                }
                const exit = portals.find((p) => p.id === portal.id && p !== portal) as Portal;
                const dir = vDir1D(box.owner.v[axis], axis);
                if (!dir || box.counterpart[dir]) continue;
                const dist = { x: exit.trigger.x - portal.trigger.x, y: exit.trigger.y - portal.trigger.y };
                const rel = { x: box.rel.x + dist.x, y: box.rel.y + dist.y };
                rel[axis] = box[dir] + dist[axis] - box.owner[axis];
                const sz = { x: box.sz.x, y: box.sz.y };
                sz[axis] = 0;

                if (box instanceof Hitbox) {
                    const counterpart = new Hitbox(box.owner, rel.x, rel.y, sz.x, sz.y);
                    box.counterpart[dir] = counterpart;
                    counterpart.counterpart[opposite[dir]] = box;
                    box.owner.hitboxes.push(counterpart);
                    box.owner.needsRedraw = true;

                    const entranceHidden =
                        axis === "x"
                            ? new Hitbox(box.owner, portal.trigger.center.x - box.owner.x + (dir === "r" ? ε : -ε), box.rel.y, 0, box.sz.y)
                            : new Hitbox(box.owner, box.rel.x, portal.trigger.center.y - box.owner.y + (dir === "d" ? ε : -ε), box.sz.x, 0);
                    const exitHidden =
                        axis === "x"
                            ? new Hitbox(box.owner, exit.trigger.center.x - box.owner.x + (opposite[dir] === "r" ? ε : -ε), counterpart.rel.y, 0, counterpart.sz.y)
                            : new Hitbox(box.owner, counterpart.rel.x, exit.trigger.center.y - box.owner.y + (opposite[dir] === "d" ? ε : -ε), counterpart.sz.x, 0);
                    box.counterpartHidden[dir] = entranceHidden;
                    counterpart.counterpartHidden[opposite[dir]] = exitHidden;
                    box.owner.hiddenHitboxes.push(entranceHidden, exitHidden);
                } else {
                    const sBox = box as SpriteBox;
                    const counterpart = new SpriteBox(sBox.owner, rel.x, rel.y, sz.x, sz.y, new Box(sBox.owner, sBox.origin.rel.x + dist.x, sBox.origin.rel.y + dist.y, sBox.origin.sz.x, sBox.origin.sz.y));
                    sBox.counterpart[dir] = counterpart;
                    counterpart.counterpart[opposite[dir]] = sBox;
                    sBox.owner.spriteBoxes.push(counterpart);
                    sBox.owner.needsRedraw = true;
                }
                playSfx("/portal.mp3", box.owner, 4);
            }
            if (handledNearMiss) {
                tRemain -= t;
                continue;
            }
        }
        // ポータルをまたがっているものの更新
        for (const obj of gameObjs) {
            if (obj instanceof Portal) continue;
            for (const boxes of [obj.hitboxes, obj.spriteBoxes]) {
                for (let i = 0; i < boxes.length; i++) {
                    const b = boxes[i];
                    for (const dir of ["u", "d", "l", "r"] as Direction[]) {
                        if (axis === "x" && (dir === "u" || dir === "d")) continue;
                        if (axis === "y" && (dir === "l" || dir === "r")) continue;
                        const c = b.counterpart[dir] as typeof b;
                        if (!c) continue;
                        const moveDir = vDir1D(obj.v[axis], axis);
                        if (!moveDir) continue;
                        if (dir !== moveDir) {
                            if (c.sz[axis] <= 0 && !c.counterpart[dir]) {
                                b.counterpart[dir] = null;
                                const cIdx = (boxes as (Hitbox | SpriteBox)[]).indexOf(c);
                                if (cIdx !== -1) {
                                    boxes.splice(cIdx, 1);
                                    if (i > cIdx) i--;
                                }
                                obj.needsRedraw = true;
                                if (b instanceof Hitbox) {
                                    obj.hiddenHitboxes = obj.hiddenHitboxes.filter((hh) => hh !== b.counterpartHidden[dir] && hh !== (c as Hitbox).counterpartHidden[opposite[dir]]);
                                }
                            }
                            continue;
                        }
                        const crossAxis = axis === "x" ? "y" : "x";
                        const portal = portals.find((p) => {
                            if (moveDir !== opposite[p.dir]) return false;
                            if (!isOverlapping1D(b[crossAxis], b.sz[crossAxis], p.trigger[crossAxis], p.trigger.sz[crossAxis])) return false;
                            // 進行方向に対し、移動前後の範囲内にポータルの入口があるかチェックする
                            const delta = (b[dir] - p.trigger[axis]) * (["r", "d"].includes(dir) ? 1 : -1);
                            return delta >= -ε && delta <= Math.abs(obj.v[axis] * t) + ε;
                        });
                        if (!portal) continue;
                        const exit = portals.find((p) => p.id === portal.id && p !== portal)!;
                        const delta = (b[dir] - portal.trigger[axis]) * (["r", "d"].includes(dir) ? 1 : -1);
                        const shrinkAmount = Math.min(delta, b.sz[axis]);
                        b.sz[axis] -= shrinkAmount;
                        if (["l", "u"].includes(dir)) b.rel[axis] += shrinkAmount;
                        c.sz[axis] += shrinkAmount;
                        if (["l", "u"].includes(opposite[dir])) c.rel[axis] -= shrinkAmount;
                        if (b instanceof Hitbox && b.counterpartHidden[dir]) {
                            b.counterpartHidden[dir]!.rel[axis] = portal.trigger.center[axis] - obj[axis] + (dir === "r" || dir === "d" ? ε : -ε);
                            (c as Hitbox).counterpartHidden[opposite[dir]]!.rel[axis] = exit.trigger.center[axis] - obj[axis] + (opposite[dir] === "r" || opposite[dir] === "d" ? ε : -ε);
                        }
                        if (b.sz[axis] <= 0 && delta > 0 && !b.counterpart[opposite[dir]]) {
                            boxes.splice(i, 1);
                            i--;
                            c.counterpart[opposite[dir]] = null;
                            obj.needsRedraw = true;
                            if (b instanceof Hitbox) obj.hiddenHitboxes = obj.hiddenHitboxes.filter((hh) => hh !== b.counterpartHidden[dir] && hh !== (c as Hitbox).counterpartHidden[opposite[dir]]);
                        }
                    }
                }
            }
        }
        // 衝突したオブジェクトの速度変更
        if (t === collisionT) {
            for (const hit of hits) {
                if (cornerCorrect(hit, axis, gameObjs)) continue;
                resolveCollision1D(hit, axis);
            }
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
                for (const aHitbox of [...a.hitboxes, ...a.hiddenHitboxes]) {
                    for (const bHitbox of [...b.hitboxes, ...b.hiddenHitboxes]) {
                        if (isIgnoreCollision(aHitbox, bHitbox, axis)) continue;
                        // hiddenHitboxはPortalとしか衝突しない
                        if (a.hiddenHitboxes.includes(aHitbox) && !(b instanceof Portal)) continue;
                        if (b.hiddenHitboxes.includes(bHitbox) && !(a instanceof Portal)) continue;

                        if (!isOverlapping1D(aHitbox[crossAxis], aHitbox.sz[crossAxis], bHitbox[crossAxis], bHitbox.sz[crossAxis])) continue;
                        if (aHitbox[dir] === bHitbox[oppositeDir]) {
                            if (!a.nextBlocks[dir].includes(b)) a.nextBlocks[dir].push(b);
                            if (!b.nextBlocks[oppositeDir].includes(a)) b.nextBlocks[oppositeDir].push(a);
                        }
                    }
                }
            }
        }
    }
};
