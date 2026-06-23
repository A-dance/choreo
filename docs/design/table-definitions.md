# テーブル定義書

データベース: **Supabase PostgreSQL**（`public` スキーマ）  
認証: **Supabase Auth**（`auth.users`）  
ストレージ: **Supabase Storage**

DDL 正本: [`../../supabase/schema.sql`](../../supabase/schema.sql)、[`../../supabase/auth_schema.sql`](../../supabase/auth_schema.sql)

---

## auth.users（Supabase 管理）

| カラム     | 型          | NULL | 説明                                                |
| ---------- | ----------- | ---- | --------------------------------------------------- |
| id         | uuid        | NO   | PK。`profiles.id` / `user_workspaces.user_id` の FK |
| email      | text        | YES  | ログイン用メール                                    |
| created_at | timestamptz | NO   | 登録日時                                            |

> アプリから直接 INSERT しない。Supabase Auth API 経由。

---

## public.profiles

ユーザー表示情報・プラン・Stripe 連携。

| カラム                 | 型          | NULL | デフォルト | 説明                                        |
| ---------------------- | ----------- | ---- | ---------- | ------------------------------------------- |
| id                     | uuid        | NO   | —          | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| display_name           | text        | NO   | `''`       | 表示名                                      |
| language               | text        | NO   | `'en'`     | UI 言語（`ja` / `en`）                      |
| avatar_path            | text        | YES  | —          | Storage `avatars` バケット内パス            |
| plan                   | text        | NO   | `'free'`   | `free` \| `pro`（CHECK 制約）               |
| stripe_customer_id     | text        | YES  | —          | Stripe Customer ID（サーバー更新のみ）      |
| stripe_subscription_id | text        | YES  | —          | Stripe Subscription ID（サーバー更新のみ）  |
| updated_at             | timestamptz | NO   | `now()`    | 最終更新                                    |

**RLS ポリシー**

| 操作   | ポリシー名            | 条件              |
| ------ | --------------------- | ----------------- |
| SELECT | `profiles_select_own` | `auth.uid() = id` |
| INSERT | `profiles_insert_own` | `auth.uid() = id` |
| UPDATE | `profiles_update_own` | `auth.uid() = id` |

**トリガー:** `protect_profile_billing` — クライアントからの UPDATE 時、`plan` / `stripe_*` 列の改ざんを防止（サーバー Service Role は除外）。

---

## public.user_workspaces

ログインユーザー 1 人につき 1 レコード。`localStorage` のワークスペース JSON をミラー。

| カラム     | 型          | NULL | デフォルト | 説明                                             |
| ---------- | ----------- | ---- | ---------- | ------------------------------------------------ |
| user_id    | uuid        | NO   | —          | PK, FK → `auth.users(id)` ON DELETE CASCADE      |
| payload    | jsonb       | NO   | —          | ワークスペース全体（プロジェクト・フォルダー等） |
| updated_at | timestamptz | NO   | `now()`    | 最終同期                                         |

**インデックス:** `user_workspaces_updated_at_idx` (`updated_at DESC`)

**RLS ポリシー**

| 操作   | ポリシー名                   | 条件                   |
| ------ | ---------------------------- | ---------------------- |
| SELECT | `user_workspaces_select_own` | `auth.uid() = user_id` |
| INSERT | `user_workspaces_insert_own` | `auth.uid() = user_id` |
| UPDATE | `user_workspaces_update_own` | `auth.uid() = user_id` |

---

## public.shares

共有リンク用スナップショット。作成は Service Role（API Route）のみ。

| カラム     | 型          | NULL | デフォルト          | 説明                     |
| ---------- | ----------- | ---- | ------------------- | ------------------------ |
| id         | uuid        | NO   | `gen_random_uuid()` | PK。URL の `shareId`     |
| song_title | text        | NO   | `''`                | 曲名（検索・表示用）     |
| payload    | jsonb       | NO   | —                   | `{ v: 1, state, media }` |
| created_at | timestamptz | NO   | `now()`             | 作成日時                 |

**インデックス:** `shares_created_at_idx` (`created_at DESC`)

**RLS ポリシー**

| 操作   | ポリシー名           | 条件                              |
| ------ | -------------------- | --------------------------------- |
| SELECT | `shares_public_read` | `true`（誰でも読み取り可）        |
| INSERT | —                    | Service Role のみ（RLS バイパス） |

**payload 構造（v1）**

```json
{
  "v": 1,
  "state": { "songTitle": "...", "members": [], "counts": [], ... },
  "media": { "audioTracks": [], "referenceVideos": [] }
}
```

---

## storage.buckets

| id            | public | file_size_limit   | 用途             |
| ------------- | ------ | ----------------- | ---------------- |
| `avatars`     | false  | 1,048,576 (1MB)   | ユーザーアバター |
| `share-media` | true   | 52,428,800 (50MB) | 共有用音源・動画 |

---

## storage.objects（RLS）

### avatars

パス規則: `{user_id}/avatar.jpg`

| 操作   | ポリシー             | 条件                                                   |
| ------ | -------------------- | ------------------------------------------------------ |
| SELECT | `avatars_read_own`   | `bucket_id = 'avatars'` かつ フォルダ名 = `auth.uid()` |
| INSERT | `avatars_write_own`  | 同上                                                   |
| UPDATE | `avatars_update_own` | 同上                                                   |
| DELETE | `avatars_delete_own` | 同上                                                   |

### share-media

パス規則: `{shareId}/{mediaId}`

| 操作   | ポリシー                  | 条件                                     |
| ------ | ------------------------- | ---------------------------------------- |
| SELECT | `share_media_public_read` | `bucket_id = 'share-media'`（公開 read） |
| INSERT | —                         | Service Role（API Route）のみ            |

---

## AWS IAM 代替

本プロジェクトは AWS を使用しない。上記 **RLS + Service Role 分離** が IAM 相当の権限制御となる。
