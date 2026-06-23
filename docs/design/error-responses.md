# エラーレスポンス形式

## 共通形式

すべての API Route は失敗時に JSON で返す。

```json
{
  "error": "<code>"
}
```

| 項目 | 値 |
|------|-----|
| Content-Type | `application/json` |
| ボディキー | `error`（string） |
| コード規則 | **snake_case**（`invalid_body` など） |

定数一覧の実装: `src/lib/apiErrors.ts`

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
| `invalid_body` | 400 | share, help, share/upload-url |
| `unauthorized` | 401 | account/delete, stripe/* |
| `server_error` | 500 | share（DB 失敗時） |

### `/api/share`

| error | HTTP |
|-------|------|
| `missing_state` | 400 |
| `invalid_workspace` | 400 |
| `missing_manifest` | 400 |
| `invalid_manifest` | 400 |
| `missing_id` | 400 |
| `not_found` | 404 |
| `invalid_payload` | 500 |

### `/api/share/upload-url`

| error | HTTP |
|-------|------|
| `missing_share_id_or_media_id` | 400 |
| `share_not_found` | 404 |
| `signed_url_failed` | 500 |

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
| `missing_url` | 400 |
| `invalid_url` | 400 |

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
