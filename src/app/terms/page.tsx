"use client";

import { Suspense, useEffect } from "react";
import { useSettings } from "../context";
import { useSearchParams } from "next/navigation";
import { parseLanguage } from "../translate";

const translations = {
  ja: {
    title: "利用規約",
    intro:
      "本規約は、開発者が提供するゲーム「Block Lockd」（以下「本サービス」といいます）の利用条件を定めるものです。",
    s1Title: "1. ステージデータ",
    s1Content:
      "ユーザーは、本サービスのステージエディター機能を利用して作成したデータ（以下「ステージデータ」といいます）をサーバーに保存、または公開することができます。公開されたデータは、他のユーザーがプレイすることや複製することを許諾したものとみなします。また、開発者は本サービスの広報・宣伝等の目的で、公開されたステージデータを無償で利用できるものとします。",
    s2Title: "2. データの削除について",
    s2Content:
      "開発者は、運営上の都合や不適切な内容と判断した場合、ユーザーに事前に通知することなく、かつ理由を開示することなく、ステージデータを削除または非公開にする権利を有します。",
    s2List: [
      "公序良俗に反する場合",
      "第三者の権利を侵害している場合",
      "サーバー容量の削減やシステム最適化が必要な場合",
      "その他、開発者が不適切と判断した場合",
    ],
    s2Note: "※削除されたデータの復元には一切応じられません。",
    s3Title: "3. アカウントの管理と利用停止",
    s3Content:
      "ユーザーは、自身のアカウント情報を適切に管理する責任を負い、第三者への譲渡や貸与はできません。禁止事項への違反や不正行為が確認された場合、開発者は事前の通知なくアカウントの停止または削除を行うことができます。",
    s4Title: "4. 知的財産権",
    s4Content:
      "本サービスに含まれるプログラム、画像、音楽、UI等の著作権その他一切の権利は、開発者または正当な権利者に帰属します。また、ユーザーは自身が作成・公開するステージデータが第三者の知的財産権その他の権利を侵害していないことを保証するものとします。",
    s5Title: "5. プレイ動画・配信に関するガイドライン",
    s5Content:
      "本サービスのプレイ動画の投稿、生配信、スクリーンショットのSNS共有は、個人利用・非営利目的（プラットフォーム標準の収益化機能を含む）に限り、原則として自由に許可されます。ただし、公序良俗に反する態様や、本サービスのイメージを著しく損なう利用は禁止します。",
    s6Title: "6. 禁止事項",
    s6Content:
      "サーバーへの過度な負荷をかける行為、運営を妨害する行為、他者への嫌がらせ、不適切なステージタイトルの設定、不正なチート行為等を禁止します。",
    s7Title: "7. サービスの変更・中断・終了",
    s7Content:
      "開発者は、メンテナンス、障害対応、天災、その他運営上の都合により、事前の予告なく本サービスの提供を一時停止、内容変更、または終了できるものとします。これらに伴いユーザーに生じた損害や不利益について、開発者は一切の責任を負いません。",
    s8Title: "8. 免責事項",
    s8Content:
      "開発者は、本サービスに起因してユーザーに生じたあらゆる損害や、データの消失について一切の責任を負いません。",
    s9Title: "9. 本規約の変更",
    s9Content:
      "開発者は、必要と判断した場合には、ユーザーへの事前の予告なくいつでも本規約を変更できるものとします。変更後の規約は、本サービス上に掲載された時点から効力を生じるものとします。",
    s10Title: "10. 準拠法および管轄裁判所",
    s10Content:
      "本規約の解釈にあたっては日本法を準拠法とします。本サービスに関して紛争が生じた場合には、開発者の所在地を管轄する裁判所を専属的合意管轄裁判所とします。",
    date: "2026年3月5日 制定",
    dateUpdated: "2026年9月1日 改定",
  },
  us: {
    title: "Terms of Service",
    intro:
      "These terms govern the use of the game 'Block Lockd' (hereinafter referred to as 'the Service') provided by the developer.",
    s1Title: "1. Stage Data",
    s1Content:
      "Users can save or publish data created using the Service's stage editor function (hereinafter referred to as 'Stage Data') to the server. Published data is deemed to have been permitted for other users to play and duplicate. Furthermore, the developer may use published Stage Data free of charge for promotional and publicity purposes of the Service.",
    s2Title: "2. Deletion of Data",
    s2Content:
      "The developer reserves the right to delete or make Stage Data private without prior notice to the user and without disclosing the reason if it is deemed necessary for operational reasons or due to inappropriate content.",
    s2List: [
      "In case of violation of public order and morals",
      "In case of infringement of third-party rights",
      "When server capacity reduction or system optimization is required",
      "Other cases where the developer deems it inappropriate",
    ],
    s2Note: "*Deleted data cannot be restored under any circumstances.",
    s3Title: "3. Account Management & Termination",
    s3Content:
      "Users are responsible for properly managing their account information and may not transfer or lend it to any third party. If any violation of prohibited acts or fraudulent behavior is confirmed, the developer may suspend or delete the account without prior notice.",
    s4Title: "4. Intellectual Property Rights",
    s4Content:
      "All copyrights and intellectual property rights in programs, images, music, UI, and other contents of the Service belong to the developer or legitimate rights holders. Users warrant that their created and published Stage Data does not infringe upon any third-party intellectual property or other rights.",
    s5Title: "5. Gameplay Video & Streaming Guidelines",
    s5Content:
      "Posting gameplay videos, live streaming, and sharing screenshots on social media are permitted for personal and non-commercial purposes (including standard platform monetization features). However, usage that violates public order and morals or significantly damages the Service's reputation is strictly prohibited.",
    s6Title: "6. Prohibited Acts",
    s6Content:
      "Excessive load on the server, interference with operations, harassment of others, setting inappropriate stage titles, cheating, etc., are prohibited.",
    s7Title: "7. Service Modification, Suspension & Termination",
    s7Content:
      "The developer may temporarily suspend, modify, or terminate the Service without prior notice due to maintenance, system failures, natural disasters, or other operational reasons. The developer assumes no liability for any disadvantages caused to users as a result.",
    s8Title: "8. Disclaimer",
    s8Content:
      "The developer assumes no responsibility for any damage caused to the user arising from the Service or for the loss of data.",
    s9Title: "9. Changes to Terms",
    s9Content:
      "The developer reserves the right to modify these Terms at any time without prior notice whenever deemed necessary. The modified Terms shall become effective upon being posted within the Service.",
    s10Title: "10. Governing Law & Jurisdiction",
    s10Content:
      "These Terms shall be governed by and construed in accordance with the laws of Japan. In the event of any dispute arising from the Service, the court having jurisdiction over the developer's location shall be the exclusive agreed court of first instance.",
    date: "Enacted March 5, 2026",
    dateUpdated: "Updated September 1, 2026",
  },
  gb: {
    title: "Terms of Service",
    intro:
      "These terms govern the use of the game 'Block Lockd' (hereinafter referred to as 'the Service') provided by the developer.",
    s1Title: "1. Stage Data",
    s1Content:
      "Users can save or publish data created using the Service's stage editor function (hereinafter referred to as 'Stage Data') to the server. Published data is deemed to have been permitted for other users to play and duplicate. Furthermore, the developer may use published Stage Data free of charge for promotional and publicity purposes of the Service.",
    s2Title: "2. Deletion of Data",
    s2Content:
      "The developer reserves the right to delete or make Stage Data private without prior notice to the user and without disclosing the reason if it is deemed necessary for operational reasons or due to inappropriate content.",
    s2List: [
      "In case of violation of public order and morals",
      "In case of infringement of third-party rights",
      "When server capacity reduction or system optimization is required",
      "Other cases where the developer deems it inappropriate",
    ],
    s2Note: "*Deleted data cannot be restored under any circumstances.",
    s3Title: "3. Account Management & Termination",
    s3Content:
      "Users are responsible for properly managing their account information and may not transfer or lend it to any third party. If any violation of prohibited acts or fraudulent behavior is confirmed, the developer may suspend or delete the account without prior notice.",
    s4Title: "4. Intellectual Property Rights",
    s4Content:
      "All copyrights and intellectual property rights in programs, images, music, UI, and other contents of the Service belong to the developer or legitimate rights holders. Users warrant that their created and published Stage Data does not infringe upon any third-party intellectual property or other rights.",
    s5Title: "5. Gameplay Video & Streaming Guidelines",
    s5Content:
      "Posting gameplay videos, live streaming, and sharing screenshots on social media are permitted for personal and non-commercial purposes (including standard platform monetisation features). However, usage that violates public order and morals or significantly damages the Service's reputation is strictly prohibited.",
    s6Title: "6. Prohibited Acts",
    s6Content:
      "Excessive load on the server, interference with operations, harassment of others, setting inappropriate stage titles, cheating, etc., are prohibited.",
    s7Title: "7. Service Modification, Suspension & Termination",
    s7Content:
      "The developer may temporarily suspend, modify, or terminate the Service without prior notice due to maintenance, system failures, natural disasters, or other operational reasons. The developer assumes no liability for any disadvantages caused to users as a result.",
    s8Title: "8. Disclaimer",
    s8Content:
      "The developer assumes no responsibility for any damage caused to the user arising from the Service or for the loss of data.",
    s9Title: "9. Changes to Terms",
    s9Content:
      "The developer reserves the right to modify these Terms at any time without prior notice whenever deemed necessary. The modified Terms shall become effective upon being posted within the Service.",
    s10Title: "10. Governing Law & Jurisdiction",
    s10Content:
      "These Terms shall be governed by and construed in accordance with the laws of Japan. In the event of any dispute arising from the Service, the court having jurisdiction over the developer's location shall be the exclusive agreed court of first instance.",
    date: "Enacted March 5, 2026",
    dateUpdated: "Updated September 1, 2026",
  },
  cn: {
    title: "服务条款",
    intro:
      "本条款规定了开发者提供的游戏“Block Lockd”（以下简称“本服务”）的使用条件。",
    s1Title: "1. 关卡数据",
    s1Content:
      "用户可以使用本服务的关卡编辑器功能创建数据（以下简称“关卡数据”）并将其保存或发布到服务器。发布的数据被视为已允许其他用户游玩和复制。此外，开发者可出于本服务的宣传与推广等目的，免费使用已发布的关卡数据。",
    s2Title: "2. 关于数据删除",
    s2Content:
      "如果出于运营需要 or 判定内容不当，开发者保留在不事先通知用户且不透露原因的情况下删除或隐藏关卡数据的权利。",
    s2List: [
      "违反公序良俗的情况",
      "侵害第三方权利的情况",
      "需要减少服务器容量或进行系统优化时",
      "开发者认为不当的其他情况",
    ],
    s2Note: "※删除的数据在任何情况下都无法恢复。",
    s3Title: "3. 账号管理与停用",
    s3Content:
      "用户有责任妥善管理自己的账号信息，不得将其转让或出借给第三方。若确认存在违反禁止事项或违规作弊行为，开发者可在不事先通知的情况下暂停或删除该账号。",
    s4Title: "4. 知识产权",
    s4Content:
      "本服务所包含的程序、图像、音乐、界面等所有著作权及其他权利均归开发者或合法权利人所有。同时，用户应保证其创建并发布的关卡数据不侵害第三方的知识产权及其他合法权益。",
    s5Title: "5. 游戏视频与直播指南",
    s5Content:
      "原则上允许以个人及非商业目的（包括使用平台标准的盈利功能）发布本服务的游玩视频、进行在线直播以及在社交媒体上分享截图。但严禁以违反公序良俗或严重损害本服务形象的方式进行传播。",
    s6Title: "6. 禁止事项",
    s6Content:
      "禁止对服务器造成过度负荷、干扰运营、骚扰他人、设置不当关卡标题、作弊等行为。",
    s7Title: "7. 服务的变更、中断与终止",
    s7Content:
      "因系统维护、故障排查、自然灾害或其他运营需要，开发者可在不事先通知的情况下暂停、变更或终止本服务。对于由此给用户造成的任何损失，开发者不承担任何责任。",
    s8Title: "8. 免责声明",
    s8Content: "开发者对因本服务给用户造成的任何损害或数据丢失不承担任何责任。",
    s9Title: "9. 条款变更",
    s9Content:
      "开发者保留在必要时无需事先通知用户即可随时修改本条款的权利。修改后的条款自发布于本服务之日起生效。",
    s10Title: "10. 适用法律与管辖法院",
    s10Content:
      "本条款的解释均适用日本法律。因本服务产生任何纠纷时，以开发者所在地具有管辖权的法院为专属第一审管辖法院。",
    date: "2026年3月5日 制定",
    dateUpdated: "2026年9月1日 改定",
  },
  tw: {
    title: "使用條款",
    intro:
      "本條款規定了開發者提供的遊戲「Block Lockd」（以下簡稱「本服務」）的使用條件。",
    s1Title: "1. 關卡資料",
    s1Content:
      "使用者可以使用本服務的關卡編輯器功能建立資料（以下簡稱「關卡資料」）並將其儲存或發布到伺服器。發布的資料被視為已允許其他使用者遊玩與複製。此外，開發者可基於本服務的宣傳與推廣等目的，免費使用已發布的關卡資料。",
    s2Title: "2. 關於資料刪除",
    s2Content:
      "如果出於營運需要或判定內容不當，開發者保留在不事先通知使用者且不透露原因的情況下刪除或隱藏關卡資料的權利。",
    s2List: [
      "違反公序良俗的情況",
      "侵害第三方權利的情況",
      "需要減少伺服器容量或進行系統優化時",
      "開發者認為不當的其他情況",
    ],
    s2Note: "※刪除的資料在任何情況下都無法恢復。",
    s3Title: "3. 帳號管理與停用",
    s3Content:
      "使用者有責任妥善保管自己的帳號資訊，不得將其轉讓或出借給第三方。若確認存在違反禁止事項或違規作弊行為，開發者可在不事先通知的情況下暫停或刪除該帳號。",
    s4Title: "4. 智慧財產權",
    s4Content:
      "本服務所包含的程式、圖像、音樂、介面等所有著作權及其他權利均歸開發者或合法權利人所有。同時，使用者應保證其建立並發布的關卡資料不侵害第三方的智慧財產權及其他合法權益。",
    s5Title: "5. 遊戲實況與直播指南",
    s5Content:
      "原則上允許基於個人及非營利目的（包含使用平台標準的營利功能）發布本服務的遊玩影片、進行線上實況直播以及在社群媒體上分享截圖。但嚴禁以違反公序良俗或嚴重損害本服務形象的方式進行傳播。",
    s6Title: "6. 禁止事項",
    s6Content:
      "禁止對伺服器造成過度負荷、干擾營運、騷擾他人、設置不當關卡標題、作弊等行為。",
    s7Title: "7. 服務的變更、中斷與終止",
    s7Content:
      "因系統維護、故障排除、自然災害或其他營運需要，開發者可在不事先通知的情況下暫停、變更或終止本服務。對於由此給使用者造成的任何損失，開發者不承擔任何責任。",
    s8Title: "8. 免責聲明",
    s8Content:
      "開發者對因本服務給使用者造成的任何損害或資料遺失不承擔任何責任。",
    s9Title: "9. 條款變更",
    s9Content:
      "開發者保留在必要時無需事先通知使用者即可隨時修改本條款的權利。修改後的條款自發布於本服務之日起生效。",
    s10Title: "10. 準據法與管轄法院",
    s10Content:
      "本條款之解釋均適用日本法律。因本服務產生任何紛爭時，以開發者所在地具有管轄權之法院為專屬第一審管轄法院。",
    date: "2026年3月5日 制定",
    dateUpdated: "2026年9月1日 改定",
  },
};

const FONT_MAP: Record<string, string> = {
  cn: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", "Noto Sans SC", "Noto Sans CJK SC", "Source Han Sans SC", "Heiti SC", sans-serif',
  tw: '"PingFang TC", "Hiragino Sans TC", "Microsoft JhengHei", "Noto Sans TC", "Noto Sans CJK TC", "Source Han Sans TC", "Heiti TC", sans-serif',
  ja: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif',
  us: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  gb: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const HTML_LANG_MAP: Record<string, string> = {
  cn: "zh-Hans",
  tw: "zh-Hant",
  ja: "ja",
  us: "en-US",
  gb: "en-GB",
};

function TermsContent() {
  const { settings, setLang } = useSettings();
  const searchParams = useSearchParams();

  const queryLang = parseLanguage(
    searchParams.get("lang") ||
      searchParams.get("la") ||
      searchParams.get("locale") ||
      searchParams.get("language"),
  );

  const lang = queryLang || settings.lang;
  const t = translations[lang] || translations.us;

  useEffect(() => {
    if (queryLang && queryLang !== settings.lang) {
      setLang(queryLang);
    }
  }, [queryLang, settings.lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG_MAP[lang] || "ja";
  }, [lang]);

  return (
    <div
      className={`h-full flex flex-col font-${lang}`}
      lang={HTML_LANG_MAP[lang] || "ja"}
      style={{ fontFamily: FONT_MAP[lang] }}
    >
      <div className="flex flex-col items-center grow overflow-y-auto py-10 px-4">
        <h1
          className="font-bold text-center border-b-2 border-white mb-4 pb-2 text-white drop-shadow-sm"
          style={{ fontSize: "8dvmin" }}
        >
          {t.title}
        </h1>

        <div className="bg-white w-full p-10">
          <div className="flex flex-col gap-6 text-left text-[#333]">
            <p className="font-medium text-[#444] leading-relaxed">{t.intro}</p>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s1Title}
              </h2>
              <p className="text-[#333] font-bold">{t.s1Content}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s2Title}
              </h2>
              <p className="font-bold text-[#333]">{t.s2Content}</p>
              <ul className="list-disc ml-6">
                {t.s2List.map((item: string, i: number) => (
                  <li key={i} className="text-[#333] font-bold">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="italic text-[#333] font-bold">{t.s2Note}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s3Title}
              </h2>
              <p className="leading-relaxed text-[#333]">{t.s3Content}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s4Title}
              </h2>
              <p className="leading-relaxed text-[#333]">{t.s4Content}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s5Title}
              </h2>
              <p className="leading-relaxed text-[#333]">{t.s5Content}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s6Title}
              </h2>
              <p className="leading-relaxed text-[#333]">{t.s6Content}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s7Title}
              </h2>
              <p className="leading-relaxed text-[#333]">{t.s7Content}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s8Title}
              </h2>
              <p className="leading-relaxed text-[#333]">{t.s8Content}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s9Title}
              </h2>
              <p className="leading-relaxed text-[#333]">{t.s9Content}</p>
            </section>

            <section>
              <h2 className="font-bold border-l-4 border-gray-700 pl-3 mb-2 text-[#333]">
                {t.s10Title}
              </h2>
              <p className="leading-relaxed text-[#333]">{t.s10Content}</p>
            </section>

            <section className="text-right mt-4 opacity-60 font-medium">
              <p className="text-[#333]">{t.date}</p>
              <p className="text-[#333]">{t.dateUpdated}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Terms() {
  return (
    <Suspense fallback={null}>
      <TermsContent />
    </Suspense>
  );
}
