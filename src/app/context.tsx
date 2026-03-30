"use client";

import { Language, SettingsType } from "@/constants";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { bgmBuffers, BgmPath, loadAllBgm, loadAllSfx, playBgm, sfxBuffers, stopBgm } from "@/game/base";

// UI (Popup)
interface PopupData {
    children: ReactNode;
    onOk?: () => void;
    onCancel?: () => void;
}

interface PopupContextType {
    showAlert: (message: ReactNode) => void;
    showConfirm: (message: ReactNode, onOk: () => void, onCancel?: () => void) => void;
    showPopup: (data: PopupData) => void;
    hidePopup: () => void;
    popupData: PopupData | null;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider = ({ children }: { children: ReactNode }) => {
    const [popupData, setPopupData] = useState<PopupData | null>(null);

    const showPopup = useCallback((data: PopupData) => {
        setPopupData(data);
    }, []);

    const hidePopup = useCallback(() => {
        setPopupData(null);
    }, []);

    const showAlert = useCallback(
        (message: ReactNode) => {
            showPopup({
                children: typeof message === "string" ? <p>{message}</p> : message,
                onOk: hidePopup,
            });
        },
        [showPopup, hidePopup],
    );

    const showConfirm = useCallback(
        (message: ReactNode, onOk: () => void, onCancel?: () => void) => {
            showPopup({
                children: typeof message === "string" ? <p>{message}</p> : message,
                onOk: () => {
                    onOk();
                    hidePopup();
                },
                onCancel: () => {
                    if (onCancel) onCancel();
                    hidePopup();
                },
            });
        },
        [showPopup, hidePopup],
    );

    return <PopupContext.Provider value={{ showAlert, showConfirm, showPopup, hidePopup, popupData }}>{children}</PopupContext.Provider>;
};

export const usePopup = () => {
    const context = useContext(PopupContext);
    if (context === undefined) {
        throw new Error("usePopup must be used within a PopupProvider");
    }
    return context;
};

// 設定
interface SettingsContextType {
    settings: SettingsType;
    setLang: (lang: Language) => void;
    setBgm: (bgm: boolean, firstBgm?: BgmPath, onProgress?: (loaded: number, total: number) => void) => Promise<void>;
    setSfx: (sfx: boolean, onProgress?: (loaded: number, total: number) => void) => Promise<void>;
    setFont: (font: boolean) => void;
}
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<SettingsType>({ lang: "ja", bgm: true, sfx: true, font: true });

    const setLang = (lang: Language) => {
        setSettings((prev) => ({ ...prev, lang }));
        localStorage.setItem("la", lang);
    };
    const setBgm = async (bgm: boolean, firstBgm?: BgmPath, onProgress?: (loaded: number, total: number) => void) => {
        setSettings((prev) => ({ ...prev, bgm }));
        if (bgm && !bgmBuffers.size) {
            await loadAllBgm(onProgress);
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
