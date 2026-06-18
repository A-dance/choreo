# ログ設計

## 方針

| 原則 | 内容 |
|------|------|
| 実行環境 | Vercel Serverless（Next.js Route Handlers） |
| 出力先 | `stdout` / `stderr` → Vercel Logs |
| 形式 | プレーンテキスト（構造化 JSON は未採用） |
| 秘密情報 | API キー・JWT・Webhook 本文はログに出さない |

## ログプレフィックス

| プレフィックス | モジュール | 例 |
|---------------|-----------|-----|
| `[share]` | `/api/share`, `/api/share/upload-url` | `[share] storage upload failed: mediaId ...` |
| `[share] db insert failed:` | share POST | DB エラーメッセージ |
| `[share] signed upload url failed:` | upload-url | Storage エラー |

Stripe / help / account 系は現状 **エラー時のみ** `console.error` または暗黙の Vercel ランタイムログ。

## ログレベル使い分け

| レベル | 用途 | 例 |
|--------|------|-----|
| `console.error` | 復旧可能な失敗（ファイルスキップ、DB エラー） | share アップロード失敗 |
| 未ログ（成功） | 正常系 | share 作成成功、help 応答 |
| Vercel 自動 | 未処理例外・タイムアウト | 500 レスポンス |

## 記録してはいけない情報

- `Authorization` ヘッダー全体
- `GEMINI_API_KEY` / `STRIPE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- Stripe Webhook の raw body（署名検証前）
- ユーザーのワークスペース `payload` 全文

## 監視・運用

| 項目 | 手段 |
|------|------|
| API エラー率 | Vercel Dashboard → Logs / Analytics |
| Stripe 課金 | Stripe Dashboard → Webhooks（配信失敗アラート） |
| Supabase | Dashboard → Logs / Database health |
| アラート | Vercel / Stripe の通知設定（本番運用時） |

## 将来拡張（未実装）

- 構造化ログ（`{ level, route, error, userId }`）
- Sentry 等のエラートラッキング
- リクエスト ID の `X-Request-Id` 付与

現時点では **MVP 規模のため `console.error` + Vercel Logs で十分** とする。
