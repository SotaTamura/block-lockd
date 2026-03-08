"use client";

import { useSettings } from "../context";
import { LeftSvg, RightSvg } from "../components";
import { TranslatableString, translate } from "../translate";
import { useEffect } from "react";
import { BGM_PATHS, bgmBuffers, BgmPath, loadAudio, playBgm, playSfx, sfxBuffers, SfxPath } from "@/game/base";
import { useRouter } from "next/navigation";

function AudioPlayer({ path, disabled }: { path: BgmPath | SfxPath; disabled: boolean }) {
    return (
        <button
            onClick={async () => {
                if (BGM_PATHS.includes(path as BgmPath)) {
                    if (!bgmBuffers.has(path as BgmPath)) bgmBuffers.set(path as BgmPath, await loadAudio(path));
                    playBgm(path as BgmPath);
                } else {
                    if (!sfxBuffers.has(path as SfxPath)) sfxBuffers.set(path as SfxPath, await loadAudio(path));
                    playSfx(path as SfxPath, null);
                }
            }}
            disabled={disabled}
            className={`miniBtn flex items-center justify-center transition-all ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
            style={{ width: "8dvmin", height: "6dvmin" }}>
            <div className="w-full h-full flex items-center justify-center scale-90">
                <RightSvg />
            </div>
        </button>
    );
}

export default function Credits() {
    const { settings } = useSettings();
    const { lang, bgm, sfx } = settings;
    const t = (str: TranslatableString) => translate(str, lang);
    const router = useRouter();

    useEffect(() => {
        playBgm("/menu.mp3");
    }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="btn back" onClick={router.back}>
                <LeftSvg />
            </div>
            <div className="flex flex-col items-center grow overflow-y-auto py-10 px-4">
                <div
                    className="bg-[#bbb] border-2 border-[#333] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.4)]"
                    style={{
                        padding: "5dvmin",
                        width: "min(95vw, 600px)",
                        maxWidth: "600px",
                    }}>
                    <h1 className="font-bold text-center border-b-2 border-[#444] mb-4 pb-2 text-[#222] drop-shadow-sm" style={{ fontSize: "9dvmin" }}>
                        {t("クレジット")}
                    </h1>
                    <div className="flex flex-col gap-8 text-left" style={{ fontSize: "4.5dvmin" }}>
                        <div className="bg-black/5 p-4 border border-black/10">
                            <div className="font-bold text-[#444] opacity-70 mb-2 text-[length:4dvmin] border-b border-black/10 pb-1">{t("フォント")}</div>
                            <div className="flex flex-col gap-1">
                                <div className="font-bold text-[#222]">マキナス 4 Square</div>
                                <div className="text-[length:3.5dvmin] text-[#444]">by もじワク研究</div>
                                <a href="https://moji-waku.com/makinas/" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline opacity-80 text-[length:3.8dvmin] break-all mt-1">
                                    https://moji-waku.com/makinas/
                                </a>
                            </div>
                        </div>

                        <div className="bg-black/5 p-4 border border-black/10">
                            <div className="font-bold text-[#444] opacity-70 mb-4 text-[length:4dvmin] border-b border-black/10 pb-1">{t("音楽")}</div>

                            <div className="mb-6">
                                <div className="font-bold text-[#222]">甘茶の音楽工房</div>
                                <a href="https://amachamusic.chagasi.com/" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline opacity-80 text-[length:3.8dvmin] break-all mb-3 block">
                                    amachamusic.chagasi.com
                                </a>
                                <div className="flex flex-col gap-2">
                                    {[
                                        ["BlueNoise", "/bgm0.mp3"],
                                        ["チェス", "/bgm1.mp3"],
                                        ["エナジー", "/bgm2.mp3"],
                                        ["シンプルスタイル", "/menu.mp3"],
                                    ].map(([name, path]) => (
                                        <div key={path} className="flex items-center justify-between bg-white/40 p-2 border border-black/5 pl-3 w-full shadow-sm">
                                            <span className="truncate text-[#222] font-medium text-[length:3.8dvmin]">{name}</span>
                                            <AudioPlayer path={path as BgmPath} disabled={!bgm} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="font-bold text-[#222]">DOVA-SYNDROME</div>
                                <a href="https://www.dova-s.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline opacity-80 text-[length:3.8dvmin] break-all mb-3 block">
                                    dova-s.jp
                                </a>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { name: "simulate oo", author: "EN_OKAWA", path: "/bgm3.mp3", url: "https://dova-s.jp/bgm/play10461.html" },
                                        { name: "アンドロイドの涙", author: "shimtone", path: "/bgm4.mp3", url: "https://dova-s.jp/bgm/play22968.html" },
                                        { name: "ブルーボトル", author: "かずち", path: "/bgm5.mp3", url: "https://dova-s.jp/bgm/play3352.html" },
                                        { name: "徘徊", author: "table_1", path: "/bgm6.mp3", url: "https://dova-s.jp/bgm/play7641.html" },
                                    ].map((track) => (
                                        <div key={track.path} className="bg-white/40 p-3 border border-black/5 w-full shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-bold text-[#222] text-[length:3.8dvmin] truncate">{track.name}</span>
                                                    <span className="text-[length:3.2dvmin] text-[#555]">by {track.author}</span>
                                                </div>
                                                <AudioPlayer path={track.path as BgmPath} disabled={!bgm} />
                                            </div>
                                            <a href={track.url} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline opacity-60 text-[length:2.8dvmin] break-all block">
                                                {track.url}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/5 p-4 border border-black/10">
                            <div className="font-bold text-[#444] opacity-70 mb-4 text-[length:4dvmin] border-b border-black/10 pb-1">{t("効果音")}</div>

                            <div className="mb-6">
                                <div className="font-bold text-[#222]">効果音ラボ</div>
                                <a href="https://soundeffect-lab.info/" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline opacity-80 text-[length:3.8dvmin] break-all mb-3 block">
                                    soundeffect-lab.info
                                </a>
                                <div className="flex flex-col gap-2">
                                    {[
                                        ["決定ボタンを押す2", "/button.mp3"],
                                        ["決定ボタンを押す21", "/goal.mp3"],
                                        ["下駄で歩く", "/ladder.mp3"],
                                        ["電子レンジを閉める", "/lever.mp3"],
                                        ["対戦カード表示1", "/restart.mp3"],
                                        ["アスファルトの上を走る1", "/walk.mp3"],
                                        ["ジャンプの着地", "/landing.mp3"],
                                        ["重いものを引きずる", "/pushblock.mp3"],
                                        ["暗黒魔法", "/portal.mp3"],
                                    ].map(([name, path]) => (
                                        <div key={path} className="flex items-center justify-between bg-white/40 p-2 border border-black/5 pl-3 w-full shadow-sm">
                                            <span className="truncate text-[#222] font-medium text-[length:3.8dvmin]">{name}</span>
                                            <AudioPlayer path={path as SfxPath} disabled={!sfx} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="font-bold text-[#222]">OtoLogic</div>
                                <a href="https://otologic.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline opacity-80 text-[length:3.8dvmin] break-all mb-3 block">
                                    otologic.jp
                                </a>
                                <div className="flex flex-col gap-2">
                                    {[
                                        ["スライドホイッスル03-09", "/jump.mp3"],
                                        ["木琴03-08(単音-2)", "/key.mp3"],
                                        ["叩く05-2(弱)", "/pushblocklanding.mp3"],
                                    ].map(([name, path]) => (
                                        <div key={path} className="flex items-center justify-between bg-white/40 p-2 border border-black/5 pl-3 w-full shadow-sm">
                                            <span className="truncate text-[#222] font-medium text-[length:3.8dvmin]">{name}</span>
                                            <AudioPlayer path={path as SfxPath} disabled={!sfx} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
