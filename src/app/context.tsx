"use client";

import { UserType } from "@/constants";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from "react";
import { StageType } from "@/constants";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

// 認証
interface AuthContextType {
    user: UserType | null;
    signup: (name: string, password: string) => void;
    login: (name: string, password: string) => void;
    loginBySession: (id: string) => void;
    logout: () => void;
    changeData: (newData: Partial<Omit<UserType, "id" | "name">>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<UserType | null>(null);
    const userRef = useRef<UserType | null>(null);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const signup = async (name: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email: `${name}@example.com`,
            password: password,
        });
        if (error) {
            alert(error.message);
        } else {
            try {
                // project://src/app/api/user/route.ts
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: data.user?.id, name }),
                });
                const dbData = await res.json();
                if (res.ok) {
                    setUser(dbData.user);
                    router.push("/");
                    router.refresh();
                } else {
                    alert(dbData.message);
                }
                const { error } = await supabase.auth.signInWithPassword({
                    email: `${name}@example.com`,
                    password: password,
                });
                if (error) {
                    alert(error.message);
                }
            } catch (error) {
                alert(error);
            }
        }
    };

    const login = async (name: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: `${name}@example.com`,
            password: password,
        });
        if (error) {
            alert(error.message);
        } else if (data.user) {
            try {
                // project://src/app/api/user/[id]/route.ts
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${data.user.id}`, {
                    cache: "no-store",
                });
                const dbData = await res.json();
                if (res.ok) {
                    setUser(dbData.user);
                    router.push("/");
                    router.refresh();
                } else {
                    alert(dbData.message);
                }
            } catch (error) {
                alert(error);
            }
        }
    };

    const loginBySession = useCallback(
        async (id: string) => {
            try {
                // project://src/app/api/user/[id]/route.ts
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${id}`, {
                    cache: "no-store",
                });
                const dbData = await res.json();
                if (res.ok) {
                    setUser(dbData.user);
                } else if (res.status !== 404) {
                    alert(dbData.message);
                }
            } catch (error) {
                alert(error);
            }
        },
        [router],
    );

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(error.message);
        } else {
            setUser(null);
            router.push("/auth/login");
            router.refresh();
        }
    };

    const changeData = useCallback(async (newData: Partial<Omit<UserType, "id" | "name">>) => {
        const currentUser = userRef.current;
        if (!currentUser) return;
        try {
            // project://src/app/api/user/[id]/route.ts
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${currentUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newData),
            });
            if (res.ok) {
                setUser({ ...currentUser, ...newData });
            } else {
                alert((await res.json()).message);
            }
        } catch (error) {
            alert(error);
        }
    }, []);
    return <AuthContext.Provider value={{ user, signup, login, loginBySession, logout, changeData }}>{children}</AuthContext.Provider>;
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
