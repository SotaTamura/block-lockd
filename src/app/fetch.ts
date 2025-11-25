import { StageType, UserType } from "@/constants";

export const throwError = (err: unknown) => {
    window.alert("エラーが発生しました：" + err);
    console.error(err);
};

// project://src/app/api/stage
export const getAllStages = async (): Promise<StageType[]> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage`, {
            cache: "no-store",
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.stages || [];
    } catch (err) {
        throwError(err);
        return [];
    }
};
export const postStage = async (stageData: Pick<StageType, "title" | "creatorId" | "description" | "code">) =>
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stageData),
    });

// project://src/app/api/stage/[id]
export const getStage = async (stageId: number): Promise<StageType | null> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/${stageId}`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.stage || null;
    } catch (err) {
        throwError(err);
        return null;
    }
};
export const putStage = async (newStageData: StageType) =>
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/${newStageData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStageData),
    });
export const deleteStage = async (stageId: number) =>
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/${stageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });

// project://src/app/api/stage/user/[id]
export const getStagesByUser = async (userId: number): Promise<StageType[]> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/user/${userId}`, {
            cache: "no-store",
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.stages || [];
    } catch (err) {
        throwError(err);
        return [];
    }
};

// project://src/app/api/user/route.ts
export const postUser = async (signupData: Pick<UserType, "name" | "password">) =>
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
    });

// project://src/app/api/user/login/route.ts
export const postLogin = async (loginData: Pick<UserType, "name" | "password">) =>
    await fetch(`/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
    });

// project://src/app/api/user/[id]/route.ts
export const getUser = async (userId: number): Promise<Omit<UserType, "password"> | null> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${userId}`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.user || null;
    } catch (err) {
        throwError(err);
        return null;
    }
};
export const putUser = async (newUserData: { id: number } & Partial<Omit<UserType, "id">>) =>
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${newUserData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
    });
export const deleteUser = async (userId: number) =>
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
