import fs from "fs";
import path from "path";
import {
  buildDisambiguationHint,
  buildGlossaryHint,
  buildQuickReference,
} from "./helpRetrieval";
import type { ProjectLanguage } from "./uiStrings";

const MEDIA_URL_FAQ_JA = `
## 音源・動画のURL可否（内部用。「使える？」と聞かれたら必ず参照）

音源（サイドバー「音源」）:
- http(s) の URL なら基本的に追加できます（Smart link として登録）。メガファイル便・ギガファイル便などのファイル共有便 URL も追加可能です。
- おすすめ・プレビュー対応: Spotify、Apple Music、YouTube Music、Linkfire（lnk.to 等）、TuneCore LinkShare、song.link など
- アプリ内で音楽を再生できるのは主に Spotify と YouTube Music のプレビュー。それ以外（ファイル共有便・Apple Music・Linkfire 等）は外部リンクアイコンからブラウザで開く形
- ファイル共有便の URL を貼っても、アプリ内で MP3 を直接再生することはできません。リンクの保存・共有用です
- うまく読み取れない場合は URL 全体をコピーして貼り付けてください

参考動画（サイドバー「参考動画」）:
- YouTube / Vimeo の URL のみ対応（ファイル共有便の動画 URL は非対応）

「メガファイル便のURLは音源に使える？」への回答例:
使えます。サイドバーの音源に URL を貼って追加できます。ただしアプリ内で音楽を再生するのは Spotify と YouTube Music が主で、メガファイル便のリンクは外部サイトを開く形になります。練習中にアプリ内で曲を流したい場合は Spotify や YouTube Music のリンクがおすすめです。
`.trim();

const MEDIA_URL_FAQ_EN = `
## Media URL support (internal — use for "can I use this URL?")

Music (sidebar Music):
- Most http(s) URLs can be added as a Smart link, including file-sharing sites.
- Best experience: Spotify, Apple Music, YouTube Music, Linkfire, TuneCore, song.link
- In-app audio preview mainly for Spotify and YouTube Music; other links open externally
- File-sharing URLs are saved as bookmarks — no in-app MP3 playback

Reference videos: YouTube and Vimeo only.

Example for file-bin URLs: Yes, you can add them to Music, but they open externally; use Spotify/YouTube Music for in-app preview.
`.trim();

function buildMediaUrlHint(language: ProjectLanguage): string {
  return language === "ja" ? MEDIA_URL_FAQ_JA : MEDIA_URL_FAQ_EN;
}

const manualCache: Partial<Record<ProjectLanguage, string>> = {};

function readManualFile(language: ProjectLanguage): string {
  if (process.env.NODE_ENV === "development") {
    delete manualCache[language];
  }
  const cached = manualCache[language];
  if (cached) return cached;

  const fileName = language === "ja" ? "manual.ja.md" : "manual.en.md";
  const filePath = path.join(process.cwd(), "docs", fileName);
  const text = fs.readFileSync(filePath, "utf8").trim();
  manualCache[language] = text;
  return text;
}

export function getHelpKnowledge(language: ProjectLanguage): string {
  return readManualFile(language);
}

/** 回答表示用：Markdown の太字記号などを除去 */
export function formatHelpAnswer(text: string): string {
  return text
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

export function buildHelpSystemPrompt(language: ProjectLanguage): string {
  const manual = getHelpKnowledge(language);
  const quickRef = buildQuickReference(language);
  const glossary = buildGlossaryHint(language);

  if (language === "ja") {
    return `あなたはダンスフォーメーション編集アプリ「bamiri — SHARE」のヘルプアシスタントです。

## 回答の方針
- 利用者は口語・略語・曖昧な表現で質問します。意図を汲み取り、下のマニュアル内容に基づいてその場で完結する回答をしてください。
- 例：「間違えた」「戻したい」→ ヘッダーの Undo または ⌘Z（Ctrl+Z）で直前の操作を元に戻せる、と手順付きで説明する。
- ユーザーにマニュアル・章番号・「詳しくは〜を参照」を案内しないでください。マニュアルはあなた用の内部資料です。必要な説明はすべて回答本文に書いてください。
- 存在しない機能だけ「できません」と伝え、近い操作があれば補足してください。
- 手順は番号付きで、UIのボタン名をそのまま書いてください。簡潔に、読みやすく。
- 回答はプレーンテキストのみ。Markdown（**太字**、# 見出し、箇条書きの * など）は使わないでください。ボタン名は「Undo」のようにそのまま書く。
- 質問が曖昧で、マニュアル上に複数の解釈があるときは、いきなり「分かりません」と答えないでください。候補を番号付きで提示し、どれか選んでもらう（例：「名前を変更したい」→ メンバー名 / 曲名 / セクション名 / 表示名 など）。ユーザーが番号や短い返答で選んだら、その操作だけ手順を説明する。
- 「〇〇のURLは使える？」のような可否の質問には、最初にはっきり「使えます」「使えません」と答えてから、理由と代替案（使えるサービスの例）を書く。

${quickRef}

${glossary}

${buildDisambiguationHint(language)}

${buildMediaUrlHint(language)}

--- 内部用マニュアル（ユーザーへの回答で章番号や「マニュアル参照」とは書かない） ---
${manual}`;
  }

  return `You are the help assistant for "bamiri — SHARE", a dance formation editor.

## How to answer
- Give complete, self-contained plain-text answers using the manual below (internal reference).
- Example: "made a mistake" → explain header Undo or ⌘Z step by step.
- Never tell users to read the manual or section numbers. Put everything in your reply.
- Do not invent features. Use numbered steps and exact UI labels. Be concise.
- Plain text only. No Markdown (no **bold**, # headings, etc.). Write button names like Undo as-is.
- If the question is ambiguous and the manual allows multiple interpretations, do not refuse. Offer numbered options (e.g. rename member vs song title vs section) and ask which one. After the user picks, give steps for that choice only.
- For "can I use this URL?" questions, start with a clear yes or no, then explain why and suggest supported alternatives.

${quickRef}

${glossary}

${buildDisambiguationHint(language)}

${buildMediaUrlHint(language)}

--- Internal manual (do not cite to users) ---
${manual}`;
}
