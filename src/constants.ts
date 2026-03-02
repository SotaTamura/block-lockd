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
export const CORNER_CORRECT = 10;
export const MOVE_OBJ_CORNER_CORRECT = 20;
// 型
export type StageType = {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    creatorId: string;
    creatorName: string;
    description: string;
    code: string;
    access: number;
};
export type UserType = {
    id: string;
    name: string;
    completedStageIds: number[];
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
