# ER 図（エンティティ関連図）

データベース: **Supabase PostgreSQL** + **Supabase Auth** + **Storage**

## ER 図

```mermaid
erDiagram
  AUTH_USERS ||--o| PROFILES : "1:1"
  AUTH_USERS ||--o| USER_WORKSPACES : "1:1"
  SHARES ||--o{ SHARE_MEDIA_OBJECTS : "1:N (Storage)"

  AUTH_USERS {
    uuid id PK
    string email
    timestamptz created_at
  }

  PROFILES {
    uuid id PK,FK
    text display_name
    text language
    text avatar_path
    text plan "free|pro"
    text stripe_customer_id
    text stripe_subscription_id
    timestamptz updated_at
  }

  USER_WORKSPACES {
    uuid user_id PK,FK
    jsonb payload "Workspace JSON"
    timestamptz updated_at
  }

  SHARES {
    uuid id PK
    text song_title
    jsonb payload "state+media"
    timestamptz created_at
  }

  SHARE_MEDIA_OBJECTS {
    text path PK "shareId/mediaId"
    blob content
  }
```

## Storage バケット

| バケット | 公開 | 用途 | RLS |
|----------|------|------|-----|
| `avatars` | 非公開 | ユーザーアバター | 本人のみ read/write |
| `share-media` | 公開 read | 共有用メディアファイル | 公開 read のみ |

## クライアント側（非 RDB）

| 保存先 | 内容 |
|--------|------|
| `localStorage` (`choreo-v3-workspace`) | ワークスペース全体（オフライン正本） |
| IndexedDB | ローカルアップロード音源・動画 blob |

## DDL 参照

- [`../../supabase/schema.sql`](../../supabase/schema.sql)
- [`../../supabase/auth_schema.sql`](../../supabase/auth_schema.sql)
- テーブル定義の詳細: [table-definitions.md](./table-definitions.md)
