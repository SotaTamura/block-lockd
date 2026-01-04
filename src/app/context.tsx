"use client";

import { UserType } from "@/constants";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { putUser, throwError } from "./fetch";
import { StageType } from "@/constants";

// 認証
interface AuthContextType {
    user: Omit<UserType, "password"> | null;
    login: (userData: Omit<UserType, "password">) => void;
    logout: () => void;
    changeUserData: (newUserData: Partial<Omit<UserType, "id">>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Omit<UserType, "password"> | null>(null);
    const router = useRouter();

    const login = (userData: Omit<UserType, "password">) => {
        setUser(userData);
        router.push("/");
        router.refresh();
    };

    const logout = () => {
        setUser(null);
        router.push("/auth/login");
        router.refresh();
    };

    const changeUserData = async (newUserData: Partial<Omit<UserType, "id">>) => {
        if (!user) return;
        try {
            const res = await putUser({ id: user.id, ...newUserData });
            if (res.ok) {
                setUser({ ...user, ...newUserData });
                if ("name" in newUserData) alert("名前を変更しました。");
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (err) {
            throwError(err);
        }
    };

    return <AuthContext.Provider value={{ user, login, logout, changeUserData }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// ステージデータ
interface StageContextType {
    stages: StageType[];
    setStages: (stages: StageType[]) => void;
    getStageById: (id: number) => StageType | undefined;
}

const StageContext = createContext<StageContextType | undefined>(undefined);

export const StageProvider = ({ children }: { children: ReactNode }) => {
    const [stages, setStages] = useState<StageType[]>([]);

    const getStageById = useCallback((id: number) => stages.find((stage) => stage.id === id), [stages]);

    return <StageContext.Provider value={{ stages, setStages, getStageById }}>{children}</StageContext.Provider>;
};

export const useStage = () => {
    const context = useContext(StageContext);
    if (context === undefined) {
        throw new Error("useStage must be used within a StageProvider");
    }
    return context;
};
