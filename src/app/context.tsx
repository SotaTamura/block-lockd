"use client";

import { Language, SettingsType, UserType } from "@/constants";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from "react";
import { StageType } from "@/constants";
import { createClient } from "../../lib/supabase/client";
import { bgmBuffers, BgmPath, loadAllBgm, loadAllSfx, playBgm, sfxBuffers, stopBgm } from "@/game/base";
import { signInAnonymously } from "./auth/actions";

const supabase = createClient();

// 認証
interface AuthContextType {
    user: UserType | null;
    signinBySession: (name?: string) => Promise<void>;
    loginBySession: (id: string, initialName?: string) => Promise<void>;
    logout: () => Promise<void>;
    changeData: (newData: Partial<Omit<UserType, "id">>) => Promise<void>;
    setGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<UserType | null>(null);
    const userRef = useRef<UserType | null>(null);
    const isLoggingIn = useRef(false);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const setGuest = useCallback(() => {
        setUser({
            id: "guest",
            name: "",
            completedStageIds: [],
            completedOnlineStageIds: [],
        });
    }, []);

    const loginBySession = useCallback(
        async (id: string, initialName?: string) => {
            if (isLoggingIn.current) return;
            isLoggingIn.current = true;
            try {
                // project://src/app/api/user/[id]/route.ts
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${id}`, {
                    cache: "no-store",
                });
                const dbData = await res.json();
                if (res.ok) {
                    setUser(dbData.user);
                } else if (res.status === 404) {
                    // Create user if not found
                    const name = initialName || `Player-${id.slice(0, 5)}`;
                    // project://src/app/api/user/route.ts
                    const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, name }),
                    });
                    const createData = await createRes.json();
                    if (createRes.ok) {
                        setUser(createData.user);
                    } else {
                        alert(createData.message);
                    }
                } else {
                    alert(dbData.message);
                }
            } catch (error) {
                alert(error);
            } finally {
                isLoggingIn.current = false;
            }
        },
        [router],
    );

    const signinBySession = useCallback(
        async (name?: string) => {
            const { data, error } = await signInAnonymously();
            if (error) {
                alert(error);
            } else {
                if (data?.user?.id && name) {
                    await loginBySession(data.user.id, name);
                }
                router.refresh();
            }
        },
        [router, loginBySession],
    );

    const logout = useCallback(async () => {
        const currentUser = userRef.current;
        if (currentUser && currentUser.id !== "guest") {
            try {
                // project://src/app/api/user/[id]/route.ts
                await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${currentUser.id}`, {
                    method: "DELETE",
                });
            } catch (error) {
                alert(error);
            }
        }

        if (currentUser && currentUser.id === "guest") {
            setUser(null);
            router.refresh();
            return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(error.message);
        } else {
            setUser(null);
            router.refresh();
        }
    }, [router]);

    const changeData = useCallback(async (newData: Partial<Omit<UserType, "id">>) => {
        const currentUser = userRef.current;
        if (!currentUser || currentUser.id === "guest") return;
        try {
            // project://src/app/api/user/[id]/route.ts
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${currentUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newData),
            });
            if (res.ok) {
                setUser({ ...currentUser, ...newData });
                if ("name" in newData) alert("Your name has been updated.");
            } else {
                alert((await res.json()).message);
            }
        } catch (error) {
            alert(error);
        }
    }, []);
    return <AuthContext.Provider value={{ user, signinBySession, loginBySession, logout, changeData, setGuest }}>{children}</AuthContext.Provider>;
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

// 設定
interface SettingsContextType {
    settings: SettingsType;
    setLang: (lang: Language) => void;
    setBgm: (bgm: boolean, firstBgm?: BgmPath) => Promise<void>;
    setSfx: (sfx: boolean) => Promise<void>;
    setFont: (font: boolean) => void;
}
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<SettingsType>({ lang: "ja", bgm: true, sfx: true, font: true });

    const setLang = (lang: Language) => {
        setSettings((prev) => ({ ...prev, lang }));
        localStorage.setItem("la", lang);
    };
    const setBgm = async (bgm: boolean, firstBgm?: BgmPath) => {
        setSettings((prev) => ({ ...prev, bgm }));
        if (bgm && !bgmBuffers.size) {
            await loadAllBgm();
            if (firstBgm) playBgm(firstBgm);
        }
        if (!bgm) {
            stopBgm();
            bgmBuffers.clear();
        }
    };
    const setSfx = async (sfx: boolean) => {
        setSettings((prev) => ({ ...prev, sfx }));
        if (sfx && !sfxBuffers.size) await loadAllSfx();
        if (!sfx) {
            sfxBuffers.clear();
        }
    };
    const setFont = (font: boolean) => {
        setSettings((prev) => ({ ...prev, font }));
        localStorage.setItem("font", String(Number(font)));
    };

    return <SettingsContext.Provider value={{ settings, setLang, setBgm, setSfx, setFont }}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
