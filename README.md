# CHOREO

ダンスフォーメーション（配置）を **人数・空間・移動・BPM** で組み立てる Web アプリです。  
ステップ名入力や Markdown 出力などは含まず、**ステージ上の配置** に特化しています。

## 起動

```bash
cd choreo
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

```bash
npm run build   # 本番ビルド
npm run start   # 本番サーバー
```

## 画面構成

```
┌ SmartHeader ─────────────────────────────────────────┐
│ 曲名 / BPM / ばみり / 人数 / 保存 / コピー / 再生   │
├ StageArea ───────────────────────────────────────────┤
│  ステージ（メンバー配置・D&D・選択）                  │
├ TimelineFooter ──────────────────────────────────────┤
│  Now · 位置表示 / セクション・カウントタイムライン   │
└──────────────────────────────────────────────────────┘
```

| 領域 | コンポーネント | 役割 |
|------|----------------|------|
| 上部 | `SmartHeader` | 曲名・BPM・ばみり・人数・保存・配置コピペ・再生 |
| 中央 | `StageArea` | ステージ・メンバー丸ポチ・ドラッグ配置 |
| 下部 | `TimelineFooter` | 現在位置（Now）・セクション／カウント操作 |
| 共通 | `MemberPanel` | メンバー名・表示/非表示・削除・復元 |
| 共通 | `ChoreoContext` | 状態管理・再生ループ・localStorage 永続化 |

## 主な機能

### フォーメーション編集
- メンバーをドラッグ＆ドロップで配置（% 座標）
- カウント切替時に滑らかにアニメーション
- 配置の **コピー / ペースト**（⌘C / ⌘V）

### タイムライン
- セクション（イントロ / Aメロ / サビ / アウトロ 等）を横スクロールで管理
- 各セクション **8 カウント**（アウトロは 1 カウント）
- カウント間に **＆（半カウント）** を挿入可能（拍は増やさず後半で移動）
- **+ Add section** でセクション追加
- セクション名はダブルクリックで編集

### BPM 再生
- BPM に合わせてカウントを自動進行
- **一定テンポ**（1 拍 = 60/BPM 秒）。＆ がある場合のみ移動タイミングが前半/後半に分かれる
- 再生中にカウントをクリックすると **その位置から再開**

### メンバー管理
- 人数の変更・名前編集
- **非表示** … 編集中の位置だけステージに出さない
- **削除** … リストから外す（削除済みから **表示** で復元）
- ステージ上で丸ポチをクリックして選択 → Delete / Backspace で削除

### ステージ
- **ばみり**（横・縦）で方眼グリッドを調整
- ステージ枠をドラッグして **横幅・高さ** を独立調整
- 床に 0 番・1 番… の番号付き方眼を表示

### 保存
- 編集内容は **localStorage** に自動保存（キー: `choreo-v2-state`）
- **保存** ボタン / ⌘S で明示保存

## キーボードショートカット

| 操作 | キー |
|------|------|
| 前のカウント | `←` / `[` |
| 次のカウント | `→` / `]` |
| 再生 / 停止 | `Space` |
| 保存 | `⌘S` / `Ctrl+S` |
| 配置コピー | `⌘C` / `Ctrl+C` |
| 配置ペースト | `⌘V` / `Ctrl+V` |
| 選択解除 / 再生停止 | `Esc` |
| 選択メンバーを削除 | `Delete` / `Backspace` |

## プロジェクト構成

```
choreo/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ChoreoApp.tsx    # シェル（Header + Stage + Footer）
│   │   ├── SmartHeader.tsx
│   │   ├── StageArea.tsx
│   │   ├── StageFloor.tsx   # 方眼・ばみり番号
│   │   ├── TimelineFooter.tsx
│   │   ├── MemberPanel.tsx
│   │   ├── KeyboardShortcuts.tsx
│   │   └── Toast.tsx
│   ├── context/
│   │   └── ChoreoContext.tsx
│   └── lib/
│       ├── types.ts
│       ├── constants.ts
│       ├── choreoUtils.ts   # 配置・再生・永続化
│       ├── sectionUtils.ts  # セクション・＆スロット
│       └── gridUtils.ts     # 方眼・ステージサイズ
└── package.json
```

## データモデル（概要）

```typescript
ChoreoState {
  songTitle: string
  sections: Section[]       // 各セクションに count / & スロット
  members: Member[]
  removedMembers: Member[]  // 削除済み（復元用）
  bpm: number
  currentCount: number      // グローバルスロット index（1 始まり）
  countData: Record<number, CountData>
  stage: { bamiriHalfWidth, bamiriDepth, scaleW, scaleH }
}
```

## 技術スタック

- **Next.js 16**（App Router）
- **React 19** / **TypeScript**
- 状態: React Context + localStorage
- スタイル: カスタム CSS（`globals.css`）

## レガシー

- `../choreo_prototype.html` … 初期プロトタイプ（単体 HTML）
- `../CHOREO_要件定義書.md` … 要件定義書（Markdown・エディタで読める）
- `../CHOREO_要件定義書.docx` … 要件定義書（Word 用。Cursor では文字化けするので MD を参照）

### 要件定義書（.docx）の再生成

プロジェクトルートで:

```bash
cd ..   # choreo/ から上へ
.venv/bin/python gen_requirements.py
```

初回のみ venv が無い場合:

```bash
python3 -m venv .venv
.venv/bin/pip install python-docx
.venv/bin/python gen_requirements.py
```
