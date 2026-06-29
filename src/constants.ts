import type { Stage, User } from "@/generated/prisma";

// 定数
export const π = Math.PI;
export const ε = 1e-4;
export const MAX_ITER = 64;
export const STEP = 1000 / 60;
export const SCALE = 100;
export const PROPS_LEN = 8;
export const RESOLUTION = 1024;
export const MAP_BLOCK_LEN = 16;
export const UNIT = RESOLUTION / MAP_BLOCK_LEN;
export const PX_PER_UNIT = 16;
export const SFX_MIN_INTERVAL = 50;
export const PLAYER_STRENGTH = 10000;
export const BLOCK_STRENGTH = 20000;
export const PUSH_BLOCK_STRENGTH = 5000;
export const MOVE_BLOCK_STRENGTH = 15000;
export const GRAVITY = 1;
export const JUMP_SPEED = -21;
export const PLAYER_SPEED = 8;
export const MOVE_BLOCK_SPEED = 4;
export const TERMINAL_V = 45;
export const CORNER_CORRECT = 12;

export const MAX_GRID_DIVISION = 32;
export const MASK_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
export const TAG_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// 型
export type StageType = Stage & {
    creatorId: string;
    creatorName: string;
};
export type UserType = User & {
    completedOnlineStageIds: number[];
};
export type SettingsType = {
    lang: Language;
    bgm: boolean;
    sfx: boolean;
    font: boolean;
};
export type Angle = 0 | 90 | 180 | -90;
export type Axis = "x" | "y";
export type Direction = "u" | "d" | "l" | "r";
export type Language = "ja" | "us" | "gb" | "cn" | "tw";
// 変換
export const opposite: Record<Direction, Direction> = {
    u: "d",
    d: "u",
    l: "r",
    r: "l",
};
export const angFrom: Record<Direction, Angle> = {
    u: 0,
    r: 90,
    d: 180,
    l: -90,
};
export const colorMap: Record<number, string | undefined> = {
    0: undefined, //white
    1: "#ff0000", //red
    2: "#00ff00", //green
    3: "#0000ff", //blue
    4: "#00ffff", //cyan
    5: "#ff00ff", //magenta
    6: "#ffff00", //yellow
    7: "#ff8ad8", //carnation
    8: "#fd8208", //orange
};

export const convertBase = (m: number, chars: string) => {
    if (!Number.isInteger(m) || m < 0) throw new Error("m must be a non-negative integer");
    const n = chars.length;
    if (m === 0) return chars[0];
    let r = "";
    while (m > 0) {
        r = chars[m % n] + r;
        m = Math.floor(m / n);
    }
    return r;
};
export const parseBase = (r: string, chars: string) => {
    const n = chars.length;
    let m = 0;
    for (const char of r) {
        const v = chars.indexOf(char);
        if (v === -1) throw new Error("invalid char: " + char);
        m = m * n + v;
    }
    return m;
};

export const leastBitsForSize = (pos: number) => {
    const maxSz = MAX_GRID_DIVISION - pos;
    if (maxSz <= 1) return 0;
    return Math.floor(Math.log2(maxSz - 1)) + 1;
};

export const toBinary = (value: number, bits: number) => {
    if (bits === 0) return "";
    return Math.floor(value).toString(2).padStart(bits, "0");
};

export const transformCode = async (oldCode: string): Promise<string> => {
    // 1. Decompress old data
    const binary = atob(oldCode);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const decompressedData = await new Response(stream).text();

    // 2. Parse and Translate Coordinates
    const objects: any[] = [];
    for (const entry of decompressedData.split(";")) {
        if (!entry) continue;
        const [maskStr, propsStr] = entry.split(":");
        const mask = parseBase(maskStr, MASK_ALPHABET);
        const props = propsStr.split(",");

        const fullProps: (string | null)[] = Array(8).fill(null);
        let idx = 0;
        for (let i = 0; i < 8; i++) {
            if (mask & (1 << i)) {
                fullProps[i] = props[idx];
                idx++;
            }
        }

        const gid = parseInt(fullProps[0] || "0");
        const xScaled = Math.round(parseFloat(fullProps[1] || "0") * 2);
        const yScaled = Math.round(parseFloat(fullProps[2] || "0") * 2);
        const wNew = Math.round(parseFloat(fullProps[3] || "1") * 2);
        const hNew = Math.round(parseFloat(fullProps[4] || "1") * 2);

        const yNew = 32 - yScaled - hNew;
        const angNew = parseInt(fullProps[5] || "0");

        let wStored = wNew;
        const hStored = hNew;

        if (gid === 6) {
            // oneway
            if (angNew === 1 || angNew === 3) {
                wStored = hNew;
            } else {
                wStored = wNew;
            }
        }

        objects.push({
            gid,
            x: xScaled,
            y: yNew,
            w: wStored,
            h: hStored,
            ang: angNew,
            color: parseInt(fullProps[6] || "0"),
            tag: fullProps[7] || "",
        });
    }

    // 3. Handle Portals
    const portals = objects.filter((o) => o.gid === 7);
    const others = objects.filter((o) => o.gid !== 7);

    const portalPairs: Record<string, any[]> = {};
    for (const p of portals) {
        if (!portalPairs[p.tag]) portalPairs[p.tag] = [];
        portalPairs[p.tag].push(p);
    }

    const mergedData = [...others];
    for (const tag of Object.keys(portalPairs).sort()) {
        const pair = portalPairs[tag];
        if (pair.length < 2) continue;
        let p1 = pair[0];
        let p2 = pair[1];

        let x1 = p1.x;
        let y1 = p1.y;
        let x2 = p2.x;
        let y2 = p2.y;
        let ang = p1.ang;
        let angDeg = ang * 90;

        // Optimization swap to match EditorManager.cs
        if (((angDeg === 0 || angDeg === 180) && x2 > x1) || ((angDeg === 90 || angDeg === 270) && y2 > y1)) {
            [p1, p2] = [p2, p1];
            [x1, x2] = [x2, x1];
            [y1, y2] = [y2, y1];
            angDeg = (angDeg + 180) % 360;
            ang = angDeg / 90;
        }

        const length = angDeg === 0 || angDeg === 180 ? p1.w : p1.h;

        mergedData.push({
            gid: 7,
            x: Math.round(x1),
            y: Math.round(y1),
            ang,
            length,
            pairX: Math.round(x2),
            pairY: Math.round(y2),
            color: p1.color,
            tag,
        });
    }

    // 4. Sort and Build Bitstream
    mergedData.sort((a, b) => a.color - b.color);

    let binaryStr = "";
    let currentColor = 0;
    for (const obj of mergedData) {
        while (currentColor < obj.color) {
            binaryStr += "00000"; // next color marker
            currentColor++;
        }

        const gid = obj.gid;
        binaryStr += toBinary(gid, 5);
        binaryStr += toBinary(obj.x, 5);
        binaryStr += toBinary(obj.y, 5);

        if (gid === 6) {
            // oneway
            binaryStr += toBinary(obj.ang, 2);
            binaryStr += toBinary(obj.w - 1, leastBitsForSize(obj.ang % 2 === 0 ? obj.x : obj.y));
        } else if (gid === 7) {
            // portal
            const ang = obj.ang;
            const angDeg = ang * 90;
            const isHoriz = angDeg === 0 || angDeg === 180;
            binaryStr += toBinary(ang, 2);
            const posForLen = isHoriz ? obj.x : obj.y;
            binaryStr += toBinary(obj.length - 1, leastBitsForSize(posForLen));
            const bitsPairX = isHoriz ? leastBitsForSize(obj.length - 1) : 5;
            binaryStr += toBinary(obj.pairX, bitsPairX);
            const bitsPairY = isHoriz ? 5 : leastBitsForSize(obj.length - 1);
            binaryStr += toBinary(obj.pairY, bitsPairY);
        } else if ([8, 10, 11, 12].includes(gid)) {
            // rotateables
            binaryStr += toBinary(obj.w - 1, leastBitsForSize(obj.x));
            binaryStr += toBinary(obj.h - 1, leastBitsForSize(obj.y));
            binaryStr += toBinary(obj.ang, 2);
        } else {
            binaryStr += toBinary(obj.w - 1, leastBitsForSize(obj.x));
            binaryStr += toBinary(obj.h - 1, leastBitsForSize(obj.y));
        }
    }

    // 5. Base4096 Encode
    let result = "";
    for (let i = 0; i < binaryStr.length; i += 6) {
        const chunk = binaryStr.substring(i, i + 6).padEnd(6, "0");
        const val = parseInt(chunk, 2);
        result += BASE64[val];
    }

    return result;
};
