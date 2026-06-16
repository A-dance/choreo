import type { ProjectLanguage } from "./uiStrings";

/** ユーザーが使いがちな言い換え → マニュアル上の概念 */
const TERM_GROUPS_JA: string[][] = [
  ["メンバー", "ドット", "丸", "点", "円", "人", "ダンサー", "選手"],
  ["ドットサイズ", "大きさ", "サイズ", "丸の大きさ", "丸を大きく", "丸を小さく", "表示サイズ"],
  ["ばみり", "方眼", "グリッド", "マス", "格子", "横", "縦", "センター"],
  ["セクション", "パート", "章", "ブロック", "タブ", "イントロ", "Aメロ", "サビ", "アウトロ", "Bメロ", "追加", "新しいセクション", "Add section"],
  ["カウント", "拍", "小節", "何拍", "1拍", "2拍", "数字", "拍子", "Add count"],
  ["半カウント", "&", "ハーフ", "半拍", "間", "割る"],
  ["BPM", "テンポ", "速さ", "速度", "曲の速さ"],
  ["再生", "Play", "プレイ", "流す", "動かす", "アニメーション"],
  ["共有", "Share", "リンク", "URL", "送る", "見せる", "閲覧", "LINE", "プレビュー"],
  ["コピー", "ペースト", "貼り付け", "複製", "コピペ", "Copy", "Paste"],
  ["Undo", "元に戻す", "戻す", "戻したい", "取り消し", "間違え", "間違えた", "ミス", "やり直し"],
  ["プロジェクト", "曲", "作品", "データ", "保存", "新規", "サイドバー"],
  ["音源", "メディア", "音楽", "曲リンク", "Spotify", "参考動画", "動画", "YouTube"],
  ["メガファイル", "ギガファイル", "ファイル便", "データ便", "mega", "ドライブ", "Dropbox", "MP3", "直リンク", "使える", "URL"],
  ["ログイン", "アカウント", "マイページ", "パスワード", "Google", "ログアウト", "削除"],
  ["ASK AI", "ヘルプ", "質問", "使い方"],
  ["ステージ", "配置", "フォーメーション", "立ち位置", "位置", "リサイズ", "BACK", "AUDIENCE"],
  ["非表示", "消す", "隠す", "削除", "いなくする", "表示"],
  ["閲覧", "閲覧専用", "閲覧モード", "view", "プレビュー"],
  ["プラン", "Pro", "無料", "アップグレード"],
  ["言語", "日本語", "English", "表示名", "アバター"],
  ["名前", "ネーム", "リネーム", "改名", "名称", "タイトル", "曲名", "表示名"],
];

const TERM_GROUPS_EN: string[][] = [
  ["member", "dot", "circle", "dancer", "person"],
  ["dot size", "size", "bigger", "smaller", "circle size"],
  ["grid", "bamiri", "width", "depth", "center"],
  ["section", "part", "tab", "intro", "chorus", "verse", "add section", "new section"],
  ["count", "beat", "measure", "number", "add count"],
  ["half-count", "half count", "&", "half beat", "between"],
  ["bpm", "tempo", "speed"],
  ["play", "playback", "animate", "run"],
  ["share", "link", "url", "send", "view-only", "line", "preview"],
  ["copy", "paste", "duplicate"],
  ["undo", "revert", "back", "mistake", "wrong", "redo"],
  ["project", "song", "save", "new", "sidebar"],
  ["media", "music", "spotify", "video", "audio"],
  ["mega", "file transfer", "google drive", "dropbox", "mp3", "direct link", "url"],
  ["login", "account", "my page", "password", "google", "sign out"],
  ["ask ai", "help", "how to"],
  ["stage", "formation", "position", "layout", "resize"],
  ["hide", "remove", "delete", "invisible", "show", "restore"],
  ["view", "view-only", "preview", "exit view mode"],
  ["plan", "pro", "free", "upgrade"],
  ["language", "avatar", "profile"],
  ["name", "rename", "title", "display name", "song title"],
];

/** 質問パターン → 必ず含めるマニュアル見出しのキーワード */
const FORCE_HEADING_JA: Array<{ re: RegExp; keys: string[] }> = [
  { re: /戻し|undo|間違|取り消|元に戻|ミス|やり直/i, keys: ["10.", "Undo", "コピー"] },
  { re: /コピー|ペースト|貼り付/i, keys: ["10.", "コピー"] },
  { re: /セクション.*追加|パート.*追加|add section/i, keys: ["8.", "セクション", "追加"] },
  { re: /カウント.*追加|拍.*増|add count/i, keys: ["8.", "カウント", "追加"] },
  { re: /半カウント|半拍|&/i, keys: ["8.", "半カウント"] },
  { re: /ドット|丸.*大き|丸.*小さ/i, keys: ["5.", "ドット"] },
  { re: /共有|リンク|share/i, keys: ["12.", "共有"] },
  { re: /音源|spotify|曲.*追加/i, keys: ["13.", "音源"] },
  { re: /メガファイル|ギガファイル|ファイル便|データ便|mega\.nz|megaファイル|ドライブ|dropbox|mp3|直リンク|使える.*url|url.*使える/i, keys: ["13.", "音源", "使え", "対応"] },
  { re: /動画|youtube|参考動画/i, keys: ["13.", "参考動画"] },
  { re: /ログイン|パスワード|アカウント/i, keys: ["3.", "ログイン"] },
  { re: /名前|ネーム|改名|リネーム|名称/i, keys: ["メンバー", "曲名", "セクション", "表示名", "音源", "タイトル"] },
];

const FORCE_HEADING_EN: Array<{ re: RegExp; keys: string[] }> = [
  { re: /undo|mistake|wrong|revert|go back/i, keys: ["10.", "Copy", "undo"] },
  { re: /add section|new section/i, keys: ["8.", "Add section"] },
  { re: /add count|more beat/i, keys: ["8.", "Add count"] },
  { re: /half.?count|&/i, keys: ["8.", "Half-count"] },
  { re: /dot size|bigger|smaller/i, keys: ["5.", "Dot size"] },
  { re: /share|link/i, keys: ["12.", "Share"] },
  { re: /music|spotify|audio link/i, keys: ["13.", "Music"] },
  { re: /mega|file.?bin|file transfer|google drive|dropbox|mp3|direct link|can i use.*url/i, keys: ["13.", "Not supported", "Music"] },
  { re: /login|password|account/i, keys: ["3.", "Login"] },
  { re: /name|rename|title/i, keys: ["Member", "Song", "Section", "display", "Media", "title"] },
];

const QUICK_REF_JA = `
## 内部用クイックリファレンス（回答にそのまま使う。ユーザーに「参照」とは言わない）
| やりたいこと | 操作 |
|-------------|------|
| 元に戻す（Undo） | ヘッダー Undo または ⌘Z（Ctrl+Z） |
| 配置をコピー | Copy または ⌘C |
| 配置をペースト | Paste または ⌘V |
| セクション追加 | 下部 + Add section |
| カウント追加 | + Add count |
| 半カウント（&） | カウント間の + |
| 丸の大きさ変更 | ヘッダー ドット 欄（14〜64） |
| メンバー非表示（この拍だけ） | メンバー選択 → Delete |
| 共有リンク作成 | ヘッダー Share |
`.trim();

const QUICK_REF_EN = `
## Internal quick reference (use in answers; do not tell users to "see" this)
| Goal | Action |
|------|--------|
| Undo | Header Undo or ⌘Z (Ctrl+Z) |
| Copy formation | Copy or ⌘C |
| Paste formation | Paste or ⌘V |
| Add section | + Add section |
| Add count | + Add count |
| Half-count (&) | + between counts |
| Dot size | Header Dots field (14–64) |
| Hide member (this count) | Select member → Delete |
| Share link | Header Share |
`.trim();

function termGroups(language: ProjectLanguage): string[][] {
  return language === "ja" ? TERM_GROUPS_JA : TERM_GROUPS_EN;
}

function forceHeadings(language: ProjectLanguage) {
  return language === "ja" ? FORCE_HEADING_JA : FORCE_HEADING_EN;
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function termMatchesText(term: string, text: string): boolean {
  if (!term) return false;
  return text.includes(normalizeForMatch(term));
}

/** 質問から検索用キーワードを広げる */
export function expandQueryTerms(
  question: string,
  language: ProjectLanguage,
): string[] {
  const q = normalizeForMatch(question);
  const terms = new Set<string>();

  for (const token of q.split(/[\s、。．.!?？！,]+/).filter(Boolean)) {
    if (token.length >= 1) terms.add(token);
  }
  terms.add(q);

  for (const group of termGroups(language)) {
    const normalizedGroup = group.map(normalizeForMatch);
    const hit = normalizedGroup.some(
      (g) => q.includes(g) || [...terms].some((t) => t.includes(g) || g.includes(t)),
    );
    if (hit) {
      for (const g of normalizedGroup) terms.add(g);
    }
  }

  return [...terms];
}

interface ManualSection {
  heading: string;
  body: string;
}

function splitManual(manual: string): ManualSection[] {
  const parts = manual.split(/\n(?=## )/);
  return parts.map((part) => {
    const lines = part.trim().split("\n");
    const heading = lines[0]?.replace(/^##\s*/, "").trim() ?? "";
    return { heading, body: part.trim() };
  });
}

function scoreSection(section: ManualSection, terms: string[]): number {
  const text = normalizeForMatch(section.body);
  let score = 0;
  for (const term of terms) {
    if (term.length < 2 && !["&"].includes(term)) continue;
    if (termMatchesText(term, text)) {
      score += term.length >= 4 ? 3 : 2;
    }
  }
  if (/^1[.\s]/.test(section.heading) || section.heading.includes("概要")) {
    score += 1;
  }
  return score;
}

function sectionForced(section: ManualSection, question: string, language: ProjectLanguage): boolean {
  const q = normalizeForMatch(question);
  const h = normalizeForMatch(section.heading);
  for (const { re, keys } of forceHeadings(language)) {
    if (!re.test(q)) continue;
    if (keys.some((k) => h.includes(normalizeForMatch(k)))) return true;
  }
  return false;
}

/**
 * 質問に関連するマニュアル節を抽出。ヒットが弱いときは全文。
 */
export function retrieveRelevantManual(
  manual: string,
  question: string,
  language: ProjectLanguage,
): string {
  const terms = expandQueryTerms(question, language);
  const sections = splitManual(manual);
  if (sections.length === 0) return manual;

  const scored = sections
    .map((section) => ({
      section,
      score: scoreSection(section, terms),
      forced: sectionForced(section, question, language),
    }))
    .sort((a, b) => b.score - a.score);

  const hasForced = scored.some((s) => s.forced);
  const topScore = scored[0]?.score ?? 0;
  if (topScore <= 0 && !hasForced) return manual;

  const picked = new Set<ManualSection>();
  for (const { section, score, forced } of scored) {
    if (forced || score > 0) picked.add(section);
    if (picked.size >= 10) break;
  }

  const overview = sections.find((s) => /^1[.\s]/.test(s.heading));
  if (overview) picked.add(overview);

  const excerpt = [...picked]
    .sort(
      (a, b) =>
        sections.findIndex((s) => s.heading === a.heading) -
        sections.findIndex((s) => s.heading === b.heading),
    )
    .map((s) => s.body)
    .join("\n\n---\n\n");

  if (excerpt.length < 1200 && topScore < 3 && !hasForced) return manual;
  return excerpt;
}

export function buildQuickReference(language: ProjectLanguage): string {
  return language === "ja" ? QUICK_REF_JA : QUICK_REF_EN;
}

const DISAMBIGUATION_JA = `
## 曖昧な質問への対応（内部用）
次のような短い質問は、複数の操作に当てはまります。文脈から特定できないときは、候補を番号付きで出して選んでもらってください。選ばれたらその手順だけ詳しく答える。

「名前を変更したい」「名前変えたい」など:
1. ダンサー（メンバー）の名前 → ヘッダー「人数」→ メンバーパネルで名前欄を編集
2. 曲名（このプロジェクトのタイトル）→ ヘッダー左の曲名入力欄
3. セクション名（イントロ・サビなど）→ 下部のセクションタブをダブルクリック
4. 自分のアカウント表示名 → マイページの表示名
5. 音源・参考動画のタイトル → サイドバー「音源」または「参考動画」→ タイトル欄

「削除したい」なども同様に、メンバー / カウント / セクション / プロジェクト など候補を出す。

回答例の書き方:
どの名前を変更しますか？当てはまる番号か名前を教えてください。
1. メンバー（ダンサー）の名前
2. 曲名（プロジェクト名）
3. セクション名
4. アカウントの表示名
5. 音源・動画のタイトル
`.trim();

const DISAMBIGUATION_EN = `
## Ambiguous questions (internal)
If a short question matches multiple features, list numbered options and ask which one. Then answer only for that choice.

"change the name" / "rename":
1. Member (dancer) name → header Members → edit name in panel
2. Song / project title → song title field in header
3. Section name → double-click section tab at bottom
4. Account display name → My page
5. Music / video title → sidebar Music or Reference videos

Same pattern for "delete", "add", etc. when ambiguous.
`.trim();

export function buildDisambiguationHint(language: ProjectLanguage): string {
  return language === "ja" ? DISAMBIGUATION_JA : DISAMBIGUATION_EN;
}

export function buildGlossaryHint(language: ProjectLanguage): string {
  if (language === "ja") {
    return `## 用語の言い換え（質問の解釈に使う。回答に章番号は書かない）
ユーザーは次のような言い方で質問することがあります。マニュアル上の用語に読み替え、操作手順をそのまま回答に書いてください。
- 「間違えた・戻したい・ミスした」→ ヘッダー Undo または ⌘Z（Ctrl+Z）
- 「丸・点・人を大きく/小さく」→ ヘッダーの ドット 欄（14〜64）
- 「サビを増やしたい・パート追加」→ 下部 + Add section
- 「拍を増やす・カウント追加」→ + Add count
- 「&・半拍・間を入れる」→ カウント間の + で半カウント
- 「立ち位置・配置・フォーメーション」→ ステージ上でメンバーをドラッグ
- 「1拍だけ消したい」→ メンバー選択 → Delete
- 「曲を送りたい・リンク」→ ヘッダー Share
- 「方眼・マス目」→ ヘッダー ばみり の横・縦
- 「ログイン・パスワード忘れ」→ ログイン画面 忘れた方はこちら
- 「音源・曲を貼りたい」→ サイドバー 音源（http(s) URL なら基本OK。Spotify 等がおすすめ）
- 「メガファイル便・ギガファイル便・ファイル便」→ 音源に追加可。ただしアプリ内再生は Spotify/YouTube Music が主。外部リンクで開く
- 「動画・振付動画」→ サイドバー 参考動画（YouTube / Vimeo のみ）
- 「共有リンクで見るだけ」→ 閲覧専用（編集不可）
- 「Pro・2個目のプロジェクト」→ 無料は1件まで、Proで無制限
- 「アカウント削除」→ マイページ アカウントを削除
- 「名前を変えたい」（どれか不明）→ 上の「曖昧な質問」に従い候補を提示。特定できれば: メンバー名=人数パネル / 曲名=ヘッダー曲名欄 / セクション=タブダブルクリック / 表示名=マイページ

マニュアルに該当する操作は必ず案内する。「マニュアルに記載がない」とだけ答えない。`;
  }
  return `## Term aliases (interpret questions; do not cite section numbers in replies)
- "mistake / go back / undo" → header Undo or ⌘Z
- "bigger/smaller circles" → header Dots field (14–64)
- "add section" → + Add section
- "add count" → + Add count
- "half beat / &" → + between counts
- "share / link" → header Share
- "music link" → sidebar Music (most http(s) URLs work; streaming links recommended)
- "file-bin / mega URL for music" → can add as Smart link; opens externally; Spotify/YouTube Music for in-app preview
- "reference video" → sidebar Reference videos (YouTube / Vimeo only)

Explain fully in your answer. Do not say "not documented" when the manual covers it.`;
}
