import { Language } from "@/constants";

const TRANSLATOR_MAP_ENTRIES = [
    ["プレイ", { us: "Play", gb: "Play", cn: "开始", tw: "開始" }],
    ["作成", { us: "Create", gb: "Create", cn: "创作", tw: "創作" }],
    ["オンライン", { us: "Online", gb: "Online", cn: "线上", tw: "線上" }],
    ["設定", { us: "Settings", gb: "Settings", cn: "设置", tw: "設定" }],
    ["ニックネームを入力してください", { us: "Enter your nickname", gb: "Enter your nickname", cn: "输入昵称", tw: "輸入暱稱" }],
    ["ユーザー情報", { us: "User info", gb: "User info", cn: "用户信息", tw: "使用者資訊" }],
    ["スタート", { us: "Start", gb: "Start", cn: "开始", tw: "開始" }],
    ["言語", { us: "Language", gb: "Language", cn: "语言", tw: "語言" }],
    ["表示", { us: "Display", gb: "Display", cn: "显示", tw: "顯示" }],
    ["フォント", { us: "Font", gb: "Font", cn: "字体", tw: "字體" }],
    ["オーディオ", { us: "Audio", gb: "Audio", cn: "音频", tw: "音訊" }],
    ["音楽", { us: "Music", gb: "Music", cn: "音乐", tw: "音樂" }],
    ["効果音", { us: "Sound Effects", gb: "Sound Effects", cn: "音效", tw: "音效" }],
    ["クレジット", { us: "Credits", gb: "Credits", cn: "鸣谢", tw: "鳴謝" }],
    ["データ削除", { us: "Delete data", gb: "Delete data", cn: "删除数据", tw: "刪除資料" }],
    ["本当にデータを削除しますか？", { us: "Do you really want to delete the data?", gb: "Do you really want to delete the data?", cn: "真的要删除数据吗？", tw: "真的要刪除資料嗎？" }],
    ["ログイン", { us: "Log In", gb: "Log In", cn: "登录", tw: "登入" }],
    ["ユーザー名とパスワードは必須です。", { us: "Username and password are required.", gb: "Username and password are required.", cn: "用户名和密码为必填项。", tw: "使用者名稱與密碼為必填。" }],
    ["ユーザー名", { us: "Username", gb: "Username", cn: "用户名", tw: "使用者名稱" }],
    ["パスワード", { us: "Password", gb: "Password", cn: "密码", tw: "密碼" }],
    ["新規アカウントを作成", { us: "Create Account", gb: "Create Account", cn: "创建账号", tw: "建立帳號" }],
    ["新規登録", { us: "Sign Up", gb: "Sign Up", cn: "注册", tw: "註冊" }],
    ["登録", { us: "Register", gb: "Register", cn: "注册", tw: "註冊" }],
    ["マイステージ", { us: "My Stages", gb: "My Stages", cn: "我的关卡", tw: "我的關卡" }],
    ["ステージに何も設置されていません。", { us: "There is nothing placed in this stage.", gb: "There is nothing placed in this stage.", cn: "此关卡中尚未放置任何物体。", tw: "此關卡中尚未放置任何物體。" }],
    ["無題", { us: "Untitled", gb: "Untitled", cn: "未命名", tw: "未命名" }],
    ["変更を保存しますか？", { us: "Save changes?", gb: "Save changes?", cn: "要保存更改吗？", tw: "要儲存變更嗎？" }],
    ["本当にこのステージを削除しますか？", { us: "Are you sure you want to delete this stage?", gb: "Are you sure you want to delete this stage?", cn: "确定要删除此关卡吗？", tw: "確定要刪除此關卡嗎？" }],
    ["ステージを削除しました。", { us: "Stage deleted.", gb: "Stage deleted.", cn: "关卡已删除。", tw: "關卡已刪除。" }],
    ["概要", { us: "Overview", gb: "Overview", cn: "概要", tw: "概要" }],
    ["ステージ", { us: "Stage", gb: "Stage", cn: "关卡", tw: "關卡" }],
    ["テスト", { us: "Test", gb: "Test", cn: "测试", tw: "測試" }],
    ["ステージ編集", { us: "Stage Editor", gb: "Stage Editor", cn: "关卡编辑", tw: "關卡編輯" }],
    ["新規作成", { us: "New", gb: "New", cn: "新建", tw: "新建" }],
    ["タイトルを入力", { us: "Enter a title", gb: "Enter a title", cn: "输入标题", tw: "輸入標題" }],
    ["説明を入力", { us: "Enter a description", gb: "Enter a description", cn: "输入说明", tw: "輸入說明" }],
    ["公開", { us: "Publish", gb: "Publish", cn: "发布", tw: "發布" }],
    ["ステージを公開するには、ステージをクリアしてください。", { us: "Clear the stage to publish it.", gb: "Clear the stage to publish it.", cn: "通关后才能发布关卡。", tw: "通關後才能發布關卡。" }],
    ["スナップ：", { us: "Snap:", gb: "Snap:", cn: "对齐：", tw: "對齊：" }],
    ["作成する", { us: "Create", gb: "Create", cn: "创建", tw: "建立" }],
    ["作成", { us: "Created", gb: "Created", cn: "创建时间", tw: "建立時間" }],
    ["更新する", { us: "Update", gb: "Update", cn: "更新", tw: "更新" }],
    ["更新", { us: "Updated", gb: "Updated", cn: "更新时间", tw: "更新時間" }],
    ["ヒント", { us: "Hint", gb: "Hint", cn: "提示", tw: "提示" }],
    ["オンラインステージ", { us: "Online Stages", gb: "Online Stages", cn: "在线关卡", tw: "線上關卡" }],
    ["クリア済ステージのみ表示", { us: "Show Cleared Stages Only", gb: "Show Cleared Stages Only", cn: "仅显示已通关关卡", tw: "僅顯示已通關關卡" }],
    ["ステージを選択", { us: "Select a Stage", gb: "Select a Stage", cn: "选择关卡", tw: "選擇關卡" }],
    [
        "矢印キーで左右移動・ジャンプ\n上下キーでハシゴを上り下りできる\nステージの外へ脱出しよう",
        {
            us: "Use arrow keys to move and jump.\nUse Up/Down to climb ladders.\nEscape the stage.",
            gb: "Use arrow keys to move and jump.\nUse Up/Down to climb ladders.\nEscape the stage.",
            cn: "使用方向键移动和跳跃。\n上下键可爬梯子。\n逃离关卡。",
            tw: "使用方向鍵移動與跳躍。\n上下鍵可爬梯子。\n逃離關卡。",
        },
    ],
    ["鍵を取ると、それと同じ色のブロックが消える", { us: "Picking up a key removes blocks of the same color.", gb: "Picking up a key removes blocks of the same colour.", cn: "拾取钥匙会消除同色方块。", tw: "取得鑰匙會消除同色方塊。" }],
    [
        "既に消えているブロックは、その色の鍵を取ると復活する",
        {
            us: "If blocks are already gone, taking the same color key brings them back.",
            gb: "If blocks are already gone, taking the same colour key brings them back.",
            cn: "已消失的方块在取得同色钥匙后会复活。",
            tw: "已消失的方塊在取得同色鑰匙後會復活。",
        },
    ],
    ["鍵は全て取るとは限らない", { us: "You don't need to collect every key.", gb: "You don't need to collect every key.", cn: "不一定要拿到所有钥匙。", tw: "不一定要取得所有鑰匙。" }],
    [
        "同じ色の鍵を取るたび、その色のブロックの状態が切り替わる",
        { us: "Each time you take a key, blocks of that color toggle their state.", gb: "Each time you take a key, blocks of that colour toggle their state.", cn: "每次取得同色钥匙都会切换方块状态。", tw: "每次取得同色鑰匙都會切換方塊狀態。" },
    ],
    [
        "一方通行ブロック\n矢印の逆の向きに進むことはできない\n色がついているものは、その色の鍵を取ると向きが180°切り替わる",
        {
            us: "One-Way Block\nYou cannot move against the arrow.\nColored ones rotate 180 degrees when you take the matching key.",
            gb: "One-Way Block\nYou cannot move against the arrow.\nColoured ones rotate 180 degrees when you take the matching key.",
            cn: "单向方块\n无法逆着箭头前进。\n有颜色的方块在取得钥匙后会旋转180度。",
            tw: "單向方塊\n無法逆著箭頭前進。\n有顏色的方塊在取得鑰匙後會旋轉180度。",
        },
    ],
    ["2つの黄色の鍵を取るタイミングが大事", { us: "The timing of the two yellow keys is important.", gb: "The timing of the two yellow keys is important.", cn: "取得两把黄色钥匙的时机很重要。", tw: "取得兩把黃色鑰匙的時機很重要。" }],
    ["自分で考えよう", { us: "Figure it out yourself.", gb: "Figure it out yourself.", cn: "自己想想吧。", tw: "自己想想吧。" }],
    [
        "ポータル\n同じアルファベットが書かれたポータル同士を行き来できる",
        { us: "Portal\nTravel between portals with the same letter.", gb: "Portal\nTravel between portals with the same letter.", cn: "传送门\n相同字母的传送门可以互通。", tw: "傳送門\n相同字母的傳送門可以互通。" },
    ],
    [
        "レバー\nその色のブロックの状態を何度でも切り替えることができる",
        { us: "Lever\nToggle blocks of that color any number of times.", gb: "Lever\nToggle blocks of that colour any number of times.", cn: "拉杆\n可无限次切换对应颜色方块的状态。", tw: "拉桿\n可無限次切換對應顏色方塊的狀態。" },
    ],
    ["一度に両方のプレイヤーが動く", { us: "Both players move at the same time.", gb: "Both players move at the same time.", cn: "两个玩家同时行动。", tw: "兩名玩家同時行動。" }],
    [
        "押しブロック\n左右に押せる\nジャンプで上に押し上げることもできる\n複数まとめて押せる\nポータルでテレポートする",
        {
            us: "Push Block\nPush left or right.\nJump to push upward.\nPush multiple blocks at once.\nTeleports through portals.",
            gb: "Push Block\nPush left or right.\nJump to push upward.\nPush multiple blocks at once.\nTeleports through portals.",
            cn: "推动方块\n可左右推动。\n跳跃可向上顶。\n可同时推动多个。\n可通过传送门传送。",
            tw: "推動方塊\n可左右推動。\n跳躍可向上頂。\n可同時推動多個。\n可透過傳送門傳送。",
        },
    ],
    ["階段を作ろう", { us: "Build a staircase.", gb: "Build a staircase.", cn: "搭建阶梯吧。", tw: "搭建階梯吧。" }],
    [
        "ボタン\n押し始めた瞬間と、離した瞬間に、その色のブロックの状態を切り替える\nプレイヤーまたは押しブロックで押せる",
        {
            us: "Button\nToggles blocks when pressed and released.\nCan be pressed by players or push blocks.",
            gb: "Button\nToggles blocks when pressed and released.\nCan be pressed by players or push blocks.",
            cn: "按钮\n按下和松开时切换方块状态。\n玩家或推动方块均可触发。",
            tw: "按鈕\n按下和放開時切換方塊狀態。\n玩家或推動方塊皆可觸發。",
        },
    ],
    ["協力してジャンプしよう", { us: "Jump together.", gb: "Jump together.", cn: "合作跳跃吧。", tw: "一起跳躍吧。" }],
    ["スピードが大事", { us: "Speed matters.", gb: "Speed matters.", cn: "速度很重要。", tw: "速度很重要。" }],
    [
        "駆動ブロック\n動力を与えられると矢印部分が光り、その方向に動き始める\nプレイヤーや押しブロックは押される\n壁に当たると止まる\nもう一度動力を与えられると元に戻り、止まる",
        {
            us: "Move Block\nWhen powered, it lights up and moves in the arrow's direction.\nPushes players and blocks.\nStops when it hits a wall.\nPower it again to return and stop.",
            gb: "Move Block\nWhen powered, it lights up and moves in the arrow's direction.\nPushes players and blocks.\nStops when it hits a wall.\nPower it again to return and stop.",
            cn: "驱动方块\n通电后沿箭头方向移动并发光。\n会推动玩家和方块。\n撞到墙壁后停止。\n再次通电会返回并停止。",
            tw: "驅動方塊\n通電後沿箭頭方向移動並發光。\n會推動玩家與方塊。\n撞到牆壁後停止。\n再次通電會返回並停止。",
        },
    ],
    ["操作には慣れてきたかな?", { us: "Getting used to the controls?", gb: "Getting used to the controls?", cn: "已经熟悉操作了吗？", tw: "已經熟悉操作了嗎？" }],
    ["ブロックをポータル間に跨らせた状態で静止させてみよう", { us: "Try stopping a block while it straddles a portal.", gb: "Try stopping a block while it straddles a portal.", cn: "试着让方块停在传送门之间。", tw: "試著讓方塊停在傳送門之間。" }],
] as const;

export type TranslatableString = (typeof TRANSLATOR_MAP_ENTRIES)[number][0];
const TRANSLATOR_MAP = new Map<TranslatableString, { us: string; gb: string; cn: string; tw: string }>(TRANSLATOR_MAP_ENTRIES);
export const translate = (str: TranslatableString, lang: Language) => {
    if (lang === "ja") return str;
    else return TRANSLATOR_MAP.get(str)?.[lang] || "";
};
