// 定数
export const π = Math.PI;
export const STAGE_LEN = 20;
export const STEP = 1000 / 60;
export const RESOLUTION = 1024;
export const MAP_BLOCK_LEN = 16;
export const UNIT = RESOLUTION / MAP_BLOCK_LEN;
export const PX_PER_UNIT = 16;
export const PLAYER_STRENGTH = 10000;
export const BLOCK_STRENGTH = 20000;
export const PUSH_BLOCK_STRENGTH = 5000;
export const MOVE_BLOCK_STRENGTH = 15000;
export const GRAVITY = 0.01;
export const JUMP_SPEED = -0.2;
export const PLAYER_SPEED = 0.08;
export const MOVE_BLOCK_SPEED = 0.04;
export const CORNER_LEN = 0.05;
export const MOVE_OBJ_CORNER_LEN = 0.2;
// 型
export type StageType = {
    id: number;
    date: Date;
    title: string;
    creatorId: number;
    creatorName?: string;
    description: string;
    code: string;
};
export type UserType = {
    id: number;
    name: string;
    password: string;
    completedStageIds: number[];
};
export type Angle = 0 | 90 | 180 | -90;
export type StageData = {
    compressionlevel: number;
    height: number;
    infinite: boolean;
    layers: {
        draworder: string;
        id: number;
        name: string;
        objects: {
            gid: number;
            height: number;
            id: number;
            name: string;
            rotation: Angle;
            type: string;
            visible: boolean;
            width: number;
            x: number;
            y: number;
        }[];
        opacity: number;
        type: string;
        visible: boolean;
        x: number;
        y: number;
        tintcolor?: string;
    }[];
    nextlayerid: number;
    nextobjectid: number;
    orientation: string;
    properties: {
        name: string;
        type: string;
        value: string;
    }[];
    renderorder: string;
    tiledversion: string;
    tileheight: number;
    tilesets: { firstgid: number; source: string }[];
    tilewidth: number;
    type: string;
    version: string;
    width: number;
};
export type Side = "t" | "b" | "l" | "r";
export type Direction = "u" | "d" | "l" | "r";
