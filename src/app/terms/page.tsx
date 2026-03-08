"use client";

import { useSettings } from "../context";
import { LeftSvg } from "../components";
import { useRouter } from "next/navigation";

const translations = {
    ja: {
        title: "利用規約",
        intro: "本規約は、開発者が提供するゲーム「Block Lockd」（以下「本サービス」といいます）の利用条件を定めるものです。",
        s1Title: "1. ステージデータ",
        s1Content: "ユーザーは、本サービスのステージエディター機能を利用して作成したデータ（以下「ステージデータ」といいます）をサーバーに保存、または公開することができます。公開されたデータは、他のユーザーがプレイすることを許諾したものとみなします。",
        s2Title: "2. データの削除について（重要）",
        s2Content: "開発者は、運営上の都合や不適切な内容と判断した場合、ユーザーに事前に通知することなく、かつ理由を開示することなく、ステージデータを削除または非公開にする権利を有します。",
        s2List: ["公序良俗に反する場合", "第三者の権利を侵害している場合", "サーバー容量の削減やシステム最適化が必要な場合", "その他、開発者が不適切と判断した場合"],
        s2Note: "※削除されたデータの復元には一切応じられません。",
        s3Title: "3. 禁止事項",
        s3Content: "サーバーへの過度な負荷をかける行為、運営を妨害する行為、他者への嫌がらせ、不適切なステージタイトルの設定等を禁止します。",
        s4Title: "4. 免責事項",
        s4Content: "開発者は、本サービスに起因してユーザーに生じたあらゆる損害や、データの消失について一切の責任を負いません。",
        date: "2026年3月5日 制定",
    },
    us: {
        title: "Terms of Service",
        intro: "These terms govern the use of the game 'Block Lockd' (hereinafter referred to as 'the Service') provided by the developer.",
        s1Title: "1. Stage Data",
        s1Content: "Users can save or publish data created using the Service's stage editor function (hereinafter referred to as 'Stage Data') to the server. Published data is deemed to have been permitted for other users to play.",
        s2Title: "2. Deletion of Data (Important)",
        s2Content: "The developer reserves the right to delete or make Stage Data private without prior notice to the user and without disclosing the reason if it is deemed necessary for operational reasons or due to inappropriate content.",
        s2List: ["In case of violation of public order and morals", "In case of infringement of third-party rights", "When server capacity reduction or system optimization is required", "Other cases where the developer deems it inappropriate"],
        s2Note: "*Deleted data cannot be restored under any circumstances.",
        s3Title: "3. Prohibited Acts",
        s3Content: "Excessive load on the server, interference with operations, harassment of others, setting inappropriate stage titles, etc., are prohibited.",
        s4Title: "4. Disclaimer",
        s4Content: "The developer assumes no responsibility for any damage caused to the user arising from the Service or for the loss of data.",
        date: "Enacted March 5, 2026",
    },
    gb: {
        title: "Terms of Service",
        intro: "These terms govern the use of the game 'Block Lockd' (hereinafter referred to as 'the Service') provided by the developer.",
        s1Title: "1. Stage Data",
        s1Content: "Users can save or publish data created using the Service's stage editor function (hereinafter referred to as 'Stage Data') to the server. Published data is deemed to have been permitted for other users to play.",
        s2Title: "2. Deletion of Data (Important)",
        s2Content: "The developer reserves the right to delete or make Stage Data private without prior notice to the user and without disclosing the reason if it is deemed necessary for operational reasons or due to inappropriate content.",
        s2List: ["In case of violation of public order and morals", "In case of infringement of third-party rights", "When server capacity reduction or system optimization is required", "Other cases where the developer deems it inappropriate"],
        s2Note: "*Deleted data cannot be restored under any circumstances.",
        s3Title: "3. Prohibited Acts",
        s3Content: "Excessive load on the server, interference with operations, harassment of others, setting inappropriate stage titles, etc., are prohibited.",
        s4Title: "4. Disclaimer",
        s4Content: "The developer assumes no responsibility for any damage caused to the user arising from the Service or for the loss of data.",
        date: "Enacted March 5, 2026",
    },
    cn: {
        title: "服务条款",
        intro: "本条款规定了开发者提供的游戏“Block Lockd”（以下简称“本服务”）的使用条件。",
        s1Title: "1. 关卡数据",
        s1Content: "用户可以使用本服务的关卡编辑器功能创建数据（以下简称“关卡数据”）并将其保存或发布到服务器。发布的数据被视为已允许其他用户游玩。",
        s2Title: "2. 关于数据删除（重要）",
        s2Content: "如果出于运营需要 or 判定内容不当，开发者保留在不事先通知用户且不透露原因的情况下删除或隐藏关卡数据的权利。",
        s2List: ["违反公序良俗的情况", "侵害第三方权利的情况", "需要减少服务器容量或进行系统优化时", "开发者认为不当的其他情况"],
        s2Note: "※删除的数据在任何情况下都无法恢复。",
        s3Title: "3. 禁止事项",
        s3Content: "禁止对服务器造成过度负荷、干扰运营、骚扰他人、设置不当关卡标题等行为。",
        s4Title: "4. 免责声明",
        s4Content: "开发者对因本服务给用户造成的任何损害或数据丢失不承担任何责任。",
        date: "2026年3月5日 制定",
    },
    tw: {
        title: "使用條款",
        intro: "本條款規定了開發者提供的遊戲「Block Lockd」（以下簡稱「本服務」）的使用條件。",
        s1Title: "1. 關卡資料",
        s1Content: "使用者可以使用本服務的關卡編輯器功能建立資料（以下簡稱「關卡資料」）並將其儲存或發布到伺服器。發布的資料被視為已允許其他使用者遊玩。",
        s2Title: "2. 關於資料刪除（重要）",
        s2Content: "如果出於營運需要或判定內容不當，開發者保留在不事先通知使用者且不透露原因的情況下刪除或隱藏關卡資料的權利。",
        s2List: ["違反公序良俗的情況", "侵害第三方權利的情況", "需要減少伺服器容量或進行系統優化時", "開發者認為不當的其他情況"],
        s2Note: "※刪除的資料在任何情況下都無法恢復。",
        s3Title: "3. 禁止事項",
        s3Content: "禁止對伺服器造成過度負荷、干擾營運、騷擾他人、設置不當關卡標題等行為。",
        s4Title: "4. 免責聲明",
        s4Content: "開發者對因本服務給使用者造成的任何損害或資料遺失不承擔任何責任。",
        date: "2026年3月5日 制定",
    },
};

export default function Terms() {
    const { settings } = useSettings();
    const lang = settings.lang;
    const t = translations[lang] || translations.us;
    const router = useRouter();

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
                    <h1 className="font-bold text-center border-b-2 border-[#444] mb-4 pb-2 text-[#222] drop-shadow-sm" style={{ fontSize: "8dvmin" }}>
                        {t.title}
                    </h1>

                    <div className="flex flex-col gap-6 text-left text-[#333]" style={{ fontSize: "3.5dvmin", fontFamily: "sans-serif" }}>
                        <p className="font-medium text-[#444] leading-relaxed">{t.intro}</p>

                        <section className="bg-black/5 p-4 border border-black/10">
                            <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#222]">{t.s1Title}</h2>
                            <p className="leading-relaxed">{t.s1Content}</p>
                        </section>

                        <section className="bg-red-50 border-2 border-red-200 p-4 shadow-sm">
                            <h2 className="font-bold border-l-4 border-red-600 pl-3 mb-2 text-red-700">{t.s2Title}</h2>
                            <p className="font-bold text-red-800 mb-3">{t.s2Content}</p>
                            <ul className="list-disc ml-6 space-y-1">
                                {t.s2List.map((item: string, i: number) => (
                                    <li key={i} className="text-red-700 font-medium">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-3 text-[length:3dvmin] italic text-red-600 font-bold border-t border-red-200 pt-2">{t.s2Note}</p>
                        </section>

                        <section className="bg-black/5 p-4 border border-black/10">
                            <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#222]">{t.s3Title}</h2>
                            <p className="leading-relaxed">{t.s3Content}</p>
                        </section>

                        <section className="bg-black/5 p-4 border border-black/10">
                            <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#222]">{t.s4Title}</h2>
                            <p className="leading-relaxed">{t.s4Content}</p>
                        </section>

                        <section className="text-right mt-4 opacity-60 font-medium">
                            <p>{t.date}</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
