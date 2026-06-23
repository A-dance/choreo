# デザインカンプ

## Figma（共有リンク）

**Share Link Screen / UI デザイン**

https://www.figma.com/make/isn8RQNIhoytYRJfT0Js3I/Share-Link-Screen?t=TW1owFHu1nhlskH4-1

## 実装との対応

| Figma / デザイン要素 | 実装                                                        |
| -------------------- | ----------------------------------------------------------- |
| 共有ダイアログ       | `src/components/ShareDialog.tsx`                            |
| ログイン画面         | `src/components/AuthPanel.tsx`（`auth-panel-figma` クラス） |
| ブランドロゴ         | `src/components/BrandLogo.tsx`                              |
| カラー・タイポ       | `src/app/globals.css`（CSS 変数 `--accent`, `--bg*` 等）    |

## デザイン方針

- ダーク UI ベース
- アクセント: 紫（`#7c5cfc`）
- ヘッダー操作はアイコン + 英語ラベル（Play, Share, ASK AI 等）
- ステージは BACK / AUDIENCE ラベル付き

## 更新ルール

- UI 変更時は Figma を先に更新し、本ドキュメントのリンクを維持する
- 実装のみの微調整は `globals.css` で行い、差分が大きい場合は Figma を追従
