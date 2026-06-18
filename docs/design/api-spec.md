# REST API 一覧

ベース URL: 同一オリジン（例: `https://example.vercel.app`）  
実装: Next.js App Router `src/app/api/**/route.ts`  
機械可読仕様: [api-spec.openapi.yaml](./api-spec.openapi.yaml)

## 認証方式

| 種別 | ヘッダー | 対象 API |
|------|----------|----------|
| なし | — | share GET/POST、help、music-metadata |
| Bearer JWT | `Authorization: Bearer <access_token>` | account/delete、stripe/* |
| Stripe 署名 | `stripe-signature` | stripe/webhook |

---

## 共有

### `POST /api/share`

共有スナップショットを作成する。

**Content-Type:** `application/json` または `multipart/form-data`

**JSON ボディ**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| state | ChoreoState | ✅ | 編集状態 |
| media | ProjectMedia | — | メディア参照 |

**multipart:** `manifest`（JSON 文字列）+ `file:{mediaId}`（Blob）

**成功 200**

```json
{ "shareId": "uuid", "skippedFiles": ["mediaId"] }
```

`skippedFiles` はサイズ超過・失敗時のみ。

---

### `GET /api/share?id={shareId}`

共有データを取得する（閲覧専用）。

**成功 200**

```json
{
  "state": { ... },
  "media": { ... },
  "files": [
    { "id": "...", "kind": "audio", "name": "...", "mimeType": "...", "url": "..." }
  ]
}
```

---

### `POST /api/share/upload-url`

大容量ファイル用の署名付きアップロード URL を発行する。

**ボディ:** `{ "shareId": "uuid", "mediaId": "string" }`

**成功 200:** `{ "signedUrl", "token", "path" }`

---

## ASK AI

### `POST /api/help`

Gemini による操作ヘルプ。

**ボディ**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| messages | `{ role, text }[]` | ✅ | 会話履歴（最大 20 ターン） |
| language | string | — | `ja` / `en` |

**成功 200:** `{ "answer": "..." }`

---

## 音源メタデータ

### `GET /api/music-metadata?url={encodedUrl}`

Spotify / YouTube 等のリンクからタイトル・サムネイルを取得。

**成功 200**

```json
{
  "title": "...",
  "thumbnailUrl": "...",
  "source": "spotify",
  "externalUrl": "..."
}
```

---

## アカウント

### `POST /api/account/delete`

アカウント削除（Stripe 解約・アバター削除・Auth ユーザー削除）。

**認証:** Bearer JWT 必須

**成功 200:** `{ "ok": true }`

---

## Stripe 課金

### `POST /api/stripe/checkout`

Pro プランの Checkout Session を作成。

**認証:** Bearer JWT 必須

**成功 200:** `{ "url": "https://checkout.stripe.com/..." }`

---

### `POST /api/stripe/portal`

Billing Portal Session を作成。

**認証:** Bearer JWT 必須

**成功 200:** `{ "url": "https://billing.stripe.com/..." }`

---

### `GET /api/stripe/subscription`

現在のサブスクリプション詳細。

**認証:** Bearer JWT 必須

**成功 200**

```json
{
  "plan": "free",
  "status": null,
  "currentPeriodStart": null,
  "currentPeriodEnd": null,
  "cancelAtPeriodEnd": false,
  "amountYen": null
}
```

---

### `POST /api/stripe/sync`

Stripe と `profiles.plan` を同期。

**認証:** Bearer JWT 必須

**成功 200:** `{ "plan": "pro" }`

---

### `POST /api/stripe/webhook`

Stripe Webhook 受信（サーバー間）。

**イベント:** `checkout.session.completed`、`customer.subscription.*`

**成功 200:** `{ "received": true }`

---

## エラー形式

すべて `{ "error": "<code_or_message>" }`。詳細は [error-responses.md](./error-responses.md)。
