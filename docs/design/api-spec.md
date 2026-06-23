# REST API 一覧

ベース URL: 同一オリジン（例: `https://choreo-ten.vercel.app`）  
実装: Next.js App Router `src/app/api/**/route.ts`  
機械可読仕様: [api-spec.openapi.yaml](./api-spec.openapi.yaml)  
Postman: [postman-collection.json](./postman-collection.json)  
Swagger UI: [Swagger Editor](https://editor.swagger.io/) に `api-spec.openapi.yaml` を貼り付けて試験可能

## 認証方式

| 種別        | ヘッダー                               | 対象 API                             |
| ----------- | -------------------------------------- | ------------------------------------ |
| なし        | —                                      | share GET/POST、help、music-metadata |
| Bearer JWT  | `Authorization: Bearer <access_token>` | account/delete、stripe/\*            |
| Stripe 署名 | `stripe-signature`                     | stripe/webhook                       |

---

## 共有

### `POST /api/share`

共有スナップショットを作成する。**1曲**または**フォルダー単位（複数曲）**のいずれか。

**Content-Type:** `application/json` または `multipart/form-data`

#### パターン A — 1曲（v1）

| フィールド | 型           | 必須 | 説明         |
| ---------- | ------------ | ---- | ------------ |
| state      | ChoreoState  | ✅   | 編集状態     |
| media      | ProjectMedia | —    | メディア参照 |

#### パターン B — フォルダー / 複数曲（v2）

| フィールド | 型        | 必須 | 説明                                       |
| ---------- | --------- | ---- | ------------------------------------------ |
| workspace  | Workspace | ✅   | `folders` + `projects` + `activeProjectId` |

`workspace` を送ると DB には `payload.v = 2` で保存される。

**multipart（v1 のみ）:** `manifest`（JSON 文字列: `{ state, media }`）+ `file:{mediaId}`（Blob）

**成功 200**

```json
{ "shareId": "uuid", "skippedFiles": ["mediaId"] }
```

`skippedFiles` はサイズ超過・失敗時のみ。

**curl 例（1曲）**

```bash
curl -sS -X POST "https://choreo-ten.vercel.app/api/share" \
  -H "Content-Type: application/json" \
  -d '{"state":{"songTitle":"Demo","sections":[],"members":[],"removedMembers":[],"bpm":120,"currentCount":1,"countData":{},"stage":{"bamiriHalfWidth":4,"bamiriDepth":5,"scaleW":85,"scaleH":88,"memberDotPx":null},"nextId":1,"isPlaying":false,"language":"ja"},"media":{"audioTracks":[],"referenceVideos":[]}}'
```

**curl 例（フォルダー共有）**

```bash
curl -sS -X POST "https://choreo-ten.vercel.app/api/share" \
  -H "Content-Type: application/json" \
  -d @folder-workspace.json
```

`folder-workspace.json` は `{ "workspace": { "version": 2, "activeProjectId": "...", "folders": [...], "projects": [...] } }` 形式。

---

### `GET /api/share?id={shareId}`

共有データを取得する（閲覧専用）。

**成功 200 — 1曲（v1）**

```json
{
  "state": { ... },
  "media": { ... },
  "files": [
    { "id": "...", "kind": "audio", "name": "...", "mimeType": "...", "url": "..." }
  ]
}
```

**成功 200 — フォルダー（v2）**

```json
{
  "workspace": {
    "version": 2,
    "activeProjectId": "...",
    "folders": [ { "id", "name", "createdAt" } ],
    "projects": [ { "id", "state", "media", "folderId", ... } ]
  },
  "state": { ... },
  "media": { ... },
  "files": [ ... ]
}
```

`state` / `media` はアクティブ曲の内容。`files` は全プロジェクト分をフラットに返す。

**curl 例**

```bash
curl -sS "https://choreo-ten.vercel.app/api/share?id=YOUR_SHARE_UUID"
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

| フィールド | 型                 | 必須 | 説明                       |
| ---------- | ------------------ | ---- | -------------------------- |
| messages   | `{ role, text }[]` | ✅   | 会話履歴（最大 20 ターン） |
| language   | string             | —    | `ja` / `en`                |

**成功 200:** `{ "answer": "..." }`

**curl 例**

```bash
curl -sS -X POST "https://choreo-ten.vercel.app/api/help" \
  -H "Content-Type: application/json" \
  -d '{"language":"ja","messages":[{"role":"user","text":"カウントを進めるには？"}]}'
```

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

**curl 例**

```bash
curl -sS "https://choreo-ten.vercel.app/api/music-metadata?url=ENCODED_URL"
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

すべて `{ "error": "<code>" }`（**snake_case 統一**）。詳細は [error-responses.md](./error-responses.md)。

| HTTP | 代表的な `error`                                                |
| ---- | --------------------------------------------------------------- |
| 400  | `invalid_body`, `missing_state`, `missing_id`, `empty_question` |
| 401  | `unauthorized`                                                  |
| 404  | `not_found`, `share_not_found`                                  |
| 500  | `server_error`, `signed_url_failed`                             |
| 502  | `empty_response`                                                |
| 503  | `not_configured`                                                |
