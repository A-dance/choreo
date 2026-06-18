# エラーレスポンス形式

## 共通形式

すべての API Route は失敗時に JSON で返す。

```json
{
  "error": "<識別子またはメッセージ>"
}
```

| 項目 | 値 |
|------|-----|
| Content-Type | `application/json` |
| ボディキー | `error`（string） |

## HTTP ステータスと意味

| ステータス | 用途 |
|-----------|------|
| 400 | リクエスト不正（パラメータ不足・JSON パース失敗・バリデーション） |
| 401 | 認証トークンなし・無効 |
| 404 | リソース未存在（share、customer 等） |
| 500 | サーバー内部エラー（DB・Stripe・Storage） |
| 502 | 上流 API 失敗（Gemini） |
| 503 | 環境変数未設定・機能無効 |

## エラーコード一覧（実装準拠）

### 共通

| error | HTTP | 発生 API |
|-------|------|----------|
| `not_configured` | 503 | share, help, account/delete |
| `invalid body` | 400 | share（JSON/multipart パース失敗） |
| `invalid_body` | 400 | help |
| `unauthorized` | 401 | account/delete, stripe/* |

### `/api/share`

| error | HTTP |
|-------|------|
| `missing state` | 400 |
| `missing manifest` | 400 |
| `invalid manifest` | 400 |
| `missing id` | 400 |
| `not found` | 404 |
| `<db message>` | 500 |

### `/api/share/upload-url`

| error | HTTP |
|-------|------|
| `missing shareId or mediaId` | 400 |
| `share not found` | 404 |
| `<storage message>` | 500 |

### `/api/help`

| error | HTTP |
|-------|------|
| `empty_question` | 400 |
| `conversation_too_long` | 400 |
| `<gemini message>` | 502 |
| `empty_response` | 502 |

### `/api/music-metadata`

| error | HTTP |
|-------|------|
| `missing url` | 400 |
| `invalid url` | 400 |

### `/api/stripe/*`

| error | HTTP |
|-------|------|
| `stripe_not_configured` | 503 |
| `<config issue string>` | 503 |
| `no_stripe_customer` | 400 |
| `checkout_session_failed` | 500 |
| `webhook_not_configured` | 503 |
| `missing_signature` | 400 |
| `invalid_signature` | 400 |

## 既知の不統一（将来統一候補）

| 現状 | 推奨統一形 |
|------|-----------|
| `invalid body`（スペース） | `invalid_body` |
| DB/Stripe の生メッセージ | 固定コード + ログに詳細 |

クライアントは `error` 文字列の**完全一致**ではなく、HTTP ステータスを主に判定すること。

## クライアント実装例

```typescript
const res = await fetch("/api/help", { method: "POST", body: JSON.stringify(body) });
if (!res.ok) {
  const { error } = await res.json();
  if (res.status === 503 && error === "not_configured") {
    // 機能無効 UI
  }
  throw new Error(error ?? "request_failed");
}
```
