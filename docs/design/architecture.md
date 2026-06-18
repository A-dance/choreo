# アーキテクチャ設計・フロントエンド / バックエンド分離

## 1. 全体構成図

```mermaid
flowchart TB
  subgraph Client["クライアント（ブラウザ）"]
    UI["React UI<br/>components/"]
    CTX["ChoreoContext<br/>ProfileContext"]
    LS["localStorage / IndexedDB"]
    UI --> CTX
    CTX --> LS
  end

  subgraph Vercel["Vercel（Next.js 16）"]
    subgraph FE["フロントエンド層"]
      Pages["app/page.tsx, login, mypage"]
      Comp["components/*"]
    end
    subgraph BE["バックエンド層（API Routes）"]
      API_HELP["POST /api/help"]
      API_SHARE["GET/POST /api/share"]
      API_STRIPE["/api/stripe/*"]
      API_ACCT["POST /api/account/delete"]
      API_META["GET /api/music-metadata"]
    end
    LIB["lib/* ドメインロジック"]
    FE --> Comp
    Comp --> CTX
    FE --> API_HELP
    FE --> API_SHARE
    FE --> API_STRIPE
    API_HELP --> LIB
    API_SHARE --> LIB
    API_STRIPE --> LIB
  end

  subgraph External["外部サービス"]
    SB[(Supabase<br/>Auth / PostgreSQL / Storage)]
    ST[Stripe]
    GM[Google Gemini API]
  end

  CTX -->|JWT| SB
  API_SHARE --> SB
  API_STRIPE --> ST
  API_HELP --> GM
  API_ACCT --> SB
```

## 2. フロントエンド / バックエンド分離方針

本プロジェクトは **Next.js モノリス** だが、責務は明確に分離している。

| 層 | ディレクトリ | 責務 | 実行環境 |
|----|-------------|------|----------|
| **フロントエンド** | `src/components/`, `src/context/`, `src/app/**/page.tsx` | UI 描画・ユーザー操作・クライアント状態 | ブラウザ（CSR） |
| **バックエンド** | `src/app/api/**/route.ts` | 認証検証・外部 API 呼び出し・DB 書き込み | Node.js（サーバー） |
| **共有ドメイン** | `src/lib/` | 型定義・ビジネスロジック・バリデーション | FE/BE 両方から import |

### 分離ルール

1. **秘密鍵はバックエンドのみ** — `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` は `route.ts` / `lib/*Server.ts` のみ
2. **DB 直接書き込みは API 経由** — クライアントは Supabase Anon Key + RLS で本人データのみ。共有作成は Service Role
3. **UI は API クライアント** — `fetch('/api/...')` でバックエンドを呼び出す
4. **オフライン編集** — フロントエンドが `localStorage` を正とし、ログイン時にクラウドへ同期

## 3. デプロイ構成（AWS 代替）

| コンポーネント | サービス | 役割 |
|---------------|----------|------|
| CDN + SSR/API | Vercel | Next.js ホスティング |
| RDB + Auth | Supabase PostgreSQL | ユーザーデータ・共有 |
| オブジェクト | Supabase Storage | アバター・共有メディア |
| 決済 | Stripe | Checkout / Portal / Webhook |
| LLM | Google AI (Gemini) | ASK AI |

> AWS（ECS / Lambda / RDS / VPC）は採用しない。上記マネージド構成を [architecture.md](./architecture.md) で代替とする。

## 4. データフロー概要

```mermaid
flowchart LR
  User -->|編集| FE
  FE -->|自動保存| LS
  FE -->|ログイン時| SB
  User -->|Share| FE
  FE -->|POST /api/share| BE
  BE -->|insert| SB
  BE -->|shareId| FE
  Visitor -->|shareId| FE
  FE -->|GET /api/share| BE
  BE -->|payload| FE
```
