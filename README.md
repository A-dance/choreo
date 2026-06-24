# bamiri — SHARE（choreo）

ダンスフォーメーション（配置）を **人数・空間・移動・BPM** で組み立てる Web アプリです。  
認証・クラウド同期・共有リンク・ASK AI（Gemini）・Stripe Pro 課金に対応しています。

**要件・非機能要件:** [`../CHOREO_要件定義書.md`](../CHOREO_要件定義書.md)（v2.1）  
**操作マニュアル:** [`docs/manual.ja.md`](docs/manual.ja.md) / [`docs/manual.en.md`](docs/manual.en.md)  
**設計書:** [`docs/design/README.md`](docs/design/README.md)（アーキテクチャ・ER・API・Figma 等）

**本番 URL（Vercel）:** [https://choreo-ten.vercel.app](https://choreo-ten.vercel.app)  
**CI:** [GitHub Actions](https://github.com/A-dance/choreo/actions)（lint・format・typecheck・UT・e2e・build）  
**API ドキュメント:** [`docs/design/api-spec.md`](docs/design/api-spec.md)（curl 例・OpenAPI・Postman）

## ドキュメント整備状況（評価チェックリスト）

| 項目                           | 状態 | 参照先                                                                         |
| ------------------------------ | ---- | ------------------------------------------------------------------------------ |
| Markdown 記法で記述            | ✅   | 本 README、`docs/manual.*.md`、`docs/design/`                                  |
| デモ URL                       | ✅   | [choreo-ten.vercel.app](https://choreo-ten.vercel.app)（下記「本番デプロイ」） |
| デモアカウント認証情報         | ✅   | 下記「デモアカウント」                                                         |
| 要件定義の内容                 | ✅   | [`../CHOREO_要件定義書.md`](../CHOREO_要件定義書.md)（v2.1）                   |
| 機能一覧                       | ✅   | 下記「主な機能」                                                               |
| フレームワーク・ライブラリ     | ✅   | 下記「技術スタック」、`package.json`                                           |
| 外部 API の情報                | ✅   | 下記「外部 API・サービス」                                                     |
| 環境構築方法                   | ✅   | 下記「前提条件」「ローカルセットアップ」                                       |
| 実装予定の機能                 | ✅   | 下記「将来実装予定」、要件定義 §1.4                                            |
| アプリ動作 GIF                 | ✅   | 下記「デモ動画」（`npm run docs:capture` で本番から再取得可）                  |
| 画面キャプチャ                 | ✅   | 下記「スクリーンショット」（同上）                                             |
| 前提条件（ツール・バージョン） | ✅   | 下記「前提条件」                                                               |
| プロジェクト概要               | ✅   | 本ページ冒頭                                                                   |
| 環境変数の説明                 | ✅   | [`.env.example`](.env.example)、下記「環境変数」                               |
| 主要エンドポイントと機能       | ✅   | 下記「主要 API エンドポイント」、`docs/design/api-spec.md`                     |
| セットアップ（ローカル・本番） | ✅   | 下記「ローカルセットアップ」「本番デプロイ（Vercel）」                         |

> **画像の更新:** `npm run docs:capture` で本番 URL からログイン画面・エディター・再生 GIF を再取得します（デモワークスペースは `.env.local` がある場合に自動復元）。

## 評価チェックリスト（機能・動作）

### CRUD・認証

| 項目                         | 状態 | 根拠                                                                                                                                          |
| ---------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 全画面がエラーなく表示できる | ✅   | `/` `/login` `/mypage` `/auth/callback` `/auth/reset-password`、`?shareId=` 閲覧。本番 [choreo-ten.vercel.app](https://choreo-ten.vercel.app) |
| 登録（CRUD の C）            | ✅   | `AuthPanel` → `signUpWithPassword`、プロジェクト新規作成 `createProject`                                                                      |
| 表示（CRUD の R）            | ✅   | ワークスペース読込、エディター、共有閲覧 `GET /api/share`                                                                                     |
| 更新（CRUD の U）            | ✅   | 配置・曲名・セクション・フォルダー・プロフィール・クラウド同期（`ChoreoContext`）                                                             |
| 削除（CRUD の D）            | ✅   | プロジェクト／セクション／カウント削除、`POST /api/account/delete`                                                                            |
| サインアップ                 | ✅   | メール＋パスワード新規登録、`getSignUpPasswordIssue` で強度チェック                                                                           |
| ログイン                     | ✅   | `signInWithPassword`、下記「デモアカウント」                                                                                                  |
| ログアウト                   | ✅   | `AuthContext.signOut`（マイページ等）                                                                                                         |
| DB が想定通り構築            | ✅   | [`supabase/schema.sql`](supabase/schema.sql)（`profiles` `user_workspaces` `shares` + RLS）                                                   |
| ソーシャル認証               | ✅/△ | Google OAuth 実装（`signInWithGoogle`）。**Supabase で Google プロバイダ有効化が前提**                                                        |

### 一覧系 UI（検索・フィルター・ソート・ページネーション）

> **ページネーションについて:** 本アプリは管理画面型の一覧ページではなく、サイドバーにプロジェクトを全件表示する構成です。件数は Free 1 件 / Pro 無制限と少なく、**ページ分割 UI は要件外のため N/A（未実装・不要）** とします。

| 項目             | 状態    | 根拠                                                                                                         |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| ページネーション | **N/A** | 上記のとおり。サイドバー全件表示（`ProjectSidebar`）                                                         |
| 検索             | ✅      | サイドバー曲名検索（`filterProjectsByQuery`）                                                                |
| フィルター       | △       | 検索絞り込み＋ブックマーク／フォルダー分類。**複数条件フィルター UI はなし**                                 |
| ソート           | △       | **ドラッグ並べ替え**（セクション `reorderSections`、プロジェクト `reorderProjects`）。列ヘッダーソートはなし |

### UX（メッセージ・バリデーション）

| 項目                   | 状態 | 根拠                                                           |
| ---------------------- | ---- | -------------------------------------------------------------- |
| 操作失敗時のメッセージ | ✅   | 認証 `role="alert"`、ASK AI エラー、共有読込失敗トースト等     |
| 操作成功時のメッセージ | ✅   | `Toast`（コピー／ペースト／削除／Undo 等）、共有「コピー済み」 |
| バリデーション         | ✅   | パスワード 8 文字・大小文字、確認一致、API 側（`apiErrors`）   |

### デモ・本番・CI/CD

| 項目                       | 状態 | 根拠                                                                                                   |
| -------------------------- | ---- | ------------------------------------------------------------------------------------------------------ |
| デモ URL の画面が正常表示  | ✅   | [choreo-ten.vercel.app](https://choreo-ten.vercel.app)                                                 |
| 全機能確認用デモアカウント | ✅   | 下記「デモアカウント」（Pro）                                                                          |
| デモ用データ               | ✅   | `npm run demo:setup`（サンプル曲・フォルダー）                                                         |
| 自動テストが CI で実行     | ✅   | [`.github/workflows/ci.yml`](.github/workflows/ci.yml)（lint / format / typecheck / UT / build / e2e） |
| 主要機能のデモ確認         | ✅   | 本ページ GIF・スクショ、デモアカウント、[`docs/design/api-spec.md`](docs/design/api-spec.md)           |
| デプロイパイプライン       | ✅   | GitHub Actions + Vercel（`main` push で本番）                                                          |
| 本番 URL 稼働              | ✅   | https://choreo-ten.vercel.app                                                                          |

> **E2E 補足:** CI では smoke（ログイン画面・未認証リダイレクト・API 検証）を常時実行。デモログイン試験は `E2E_DEMO_LOGIN=1` + 実 Supabase 設定時のみ（`e2e/demo-login.spec.ts`）。

## 評価チェックリスト（コード品質）

| 項目                           | 状態 | 根拠                                                                                                  |
| ------------------------------ | ---- | ----------------------------------------------------------------------------------------------------- |
| 命名が正確                     | ✅   | `ApiError` 定数、`getStripe()` 等、コンポーネント名の一貫性                                           |
| 型エラーなし                   | ✅   | `npm run typecheck`（`strict: true`）                                                                 |
| 型が正確に定義                 | ✅   | `src/lib/types.ts`、`ApiErrorCode`、Route の interface                                                |
| 環境依存値は環境変数           | ✅   | [`.env.example`](.env.example)、`stripeServer.ts` 等（秘密鍵はサーバー側のみ）                        |
| コメント                       | ✅   | 主要 `lib/`・`apiErrors.ts`、設計書。全ファイル網羅ではない                                           |
| 整形                           | ✅   | Prettier（`npm run format` / `format:check`）、CI で検証                                              |
| 不要パッケージなし             | ✅   | 本番依存は Next / React / Supabase / Stripe のみ                                                      |
| 不要な記述なし                 | ✅   | 大きなデッドコードなし                                                                                |
| CI/CD                          | ✅   | 上記 GitHub Actions                                                                                   |
| 早期リターン                   | ✅   | `/api/help`、`/api/stripe/webhook` 等                                                                 |
| 非同期の例外処理               | ✅   | `try/catch` + `apiErrorResponse`                                                                      |
| DRY                            | ✅   | `src/lib/` 共通ロジック、`apiErrors` でエラー形式統一                                                 |
| 単体テスト                     | ✅   | Vitest（`tests/`、11 ファイル / 49 テスト）                                                           |
| インポートに `@/` エイリアス   | ✅   | `tsconfig.json` `paths`、`@/*` を標準使用                                                             |
| Server Actions                 | ❌   | 未使用（Route Handler + `fetch` 方式）                                                                |
| Route Handler                  | ✅   | `src/app/api/**/route.ts`（10 本）                                                                    |
| クライアントコンポーネント最小 | ✅/△ | 編集 UI 主体のため `"use client"` 多数。`page.tsx` はサーバーコンポーネント                           |
| ログ出力                       | △    | share 等で `console.error`。[`docs/design/logging.md`](docs/design/logging.md)                        |
| e2e テスト                     | ✅   | Playwright（`e2e/smoke.spec.ts` 等）                                                                  |
| ディレクトリ構成               | ✅   | `app/` `components/` `lib/` `context/` — [`docs/design/architecture.md`](docs/design/architecture.md) |

## 評価チェックリスト（設計書・プロダクト）

| 項目                       | 状態 | 参照                                                                                                                                              |
| -------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 簡易アプリ仕様設計シート   | ✅   | [`docs/design/app-spec.md`](docs/design/app-spec.md)                                                                                              |
| ER 図                      | ✅   | [`docs/design/er-diagram.md`](docs/design/er-diagram.md)                                                                                          |
| FE/BE 分離設計             | ✅   | [`docs/design/architecture.md`](docs/design/architecture.md)                                                                                      |
| デザインカンプ             | ✅   | [Figma](https://www.figma.com/make/isn8RQNIhoytYRJfT0Js3I/Share-Link-Screen?t=TW1owFHu1nhlskH4-1)、[`design-comp.md`](docs/design/design-comp.md) |
| シーケンス図               | ✅   | [`docs/design/sequence-diagrams.md`](docs/design/sequence-diagrams.md)                                                                            |
| テーブル定義書             | ✅   | [`docs/design/table-definitions.md`](docs/design/table-definitions.md)                                                                            |
| ログ設計                   | ✅   | [`docs/design/logging.md`](docs/design/logging.md)                                                                                                |
| OpenAPI 準拠 API 仕様      | ✅   | [`api-spec.openapi.yaml`](docs/design/api-spec.openapi.yaml)、[`api-spec.md`](docs/design/api-spec.md)                                            |
| 明確な目的                 | ✅   | 要件定義 §1.1                                                                                                                                     |
| 独自性（クローンではない） | ✅   | 要件定義 §1.3（ばみり・半カウント・BPM・ASK AI 等）                                                                                               |
| LLM API 呼び出し           | ✅   | `POST /api/help` → Gemini                                                                                                                         |
| 問題解決                   | ✅   | 要件定義 §1.2                                                                                                                                     |
| マネタイズ                 | ✅   | Stripe Pro（月 500 円）、要件定義 §4.9                                                                                                            |
| システム要件・制約         | ✅   | 要件定義 §2、§5、[`.env.example`](.env.example)                                                                                                   |
| 非機能要件                 | ✅   | 要件定義 §6（性能・可用性・セキュリティ）                                                                                                         |

詳細な対応表は [`../CHOREO_要件定義書.md`](../CHOREO_要件定義書.md) §10 も参照。

## スクリーンショット

本番（`https://choreo-ten.vercel.app`）・デモアカウントで取得した最新キャプチャです。

| ログイン画面                                      | エディター（デモアカウント）                         |
| ------------------------------------------------- | ---------------------------------------------------- |
| ![ログイン画面](docs/images/screenshot-login.png) | ![エディター画面](docs/images/screenshot-editor.png) |

## デモ動画（GIF）

BPM 再生でカウントが進み、フォーメーションが切り替わる様子（本番デモ・デモアカウントで撮影）。

![BPM 再生デモ](docs/images/demo-playback.gif)

## 前提条件

| ツール      | バージョン                                              |
| ----------- | ------------------------------------------------------- |
| **Node.js** | **20 以上**（CI と `package.json` の `engines` と同じ） |
| **npm**     | 9 以上（`npm ci` / `npm install`）                      |
| ブラウザ    | Chromium / Safari 最新（モバイル・PC）                  |

任意: [Supabase](https://supabase.com/) プロジェクト（認証・同期・共有）、[Stripe](https://stripe.com/)（課金テスト）、[Google AI](https://ai.google.dev/) API キー（ASK AI）

## ローカルセットアップ

```bash
cd choreo
cp .env.example .env.local   # 値を編集
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

```bash
npm run build        # 本番ビルド
npm run start        # 本番サーバー（ローカル）
npm test             # 単体・API テスト（Vitest）
npm run test:coverage
npm run test:e2e     # E2E（要 build 済み）。デモログインは E2E_DEMO_LOGIN=1 + .env.local
```

環境変数の一覧は [`.env.example`](.env.example) を参照してください。

### 環境変数（主要）

| 変数                            | 必須          | 用途                                   |
| ------------------------------- | ------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | 本番・同期時  | Supabase プロジェクト URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番・同期時  | クライアント用 anon キー               |
| `SUPABASE_SERVICE_ROLE_KEY`     | 本番・同期時  | サーバー API（共有・課金・削除）       |
| `NEXT_PUBLIC_APP_URL`           | 本番          | アプリの公開 URL（末尾スラッシュなし） |
| `GEMINI_API_KEY`                | ASK AI 利用時 | `POST /api/help`                       |
| `GEMINI_MODEL`                  | 任意          | 既定 `gemini-2.5-flash`                |
| `STRIPE_SECRET_KEY`             | 課金時        | Checkout / Portal / Webhook            |
| `STRIPE_PRO_PRICE_ID`           | 課金時        | Pro プラン Price ID                    |
| `STRIPE_WEBHOOK_SECRET`         | 課金時        | Webhook 署名検証                       |
| `SUPABASE_DB_URL`               | 任意          | `npm run supabase:setup` 用            |
| `E2E_DEMO_LOGIN`                | 任意          | E2E でデモログイン試験（`1`）          |

### Supabase 初回セットアップ（任意）

```bash
npm run supabase:setup    # schema.sql を SUPABASE_DB_URL へ適用
npm run demo:setup        # デモユーザー + ワークスペース投入
```

## 本番デプロイ（Vercel）

本番は **Vercel** に Git 連携デプロイしています（AWS ECS / Lambda / Fargate は未使用）。

| 項目                              | 値                                                    |
| --------------------------------- | ----------------------------------------------------- |
| **本番 URL**                      | https://choreo-ten.vercel.app                         |
| **`NEXT_PUBLIC_APP_URL`（本番）** | `https://choreo-ten.vercel.app`（末尾スラッシュなし） |

1. [Vercel](https://vercel.com/) で GitHub リポジトリ `A-dance/choreo` を Import
2. **Root Directory:** `choreo`（モノレポの場合はサブディレクトリを指定）
3. **Framework Preset:** Next.js（ビルド: `npm run build`、出力: デフォルト）
4. **Environment Variables** に [`.env.example`](.env.example) の本番用の値を設定
   - 必須: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`（本番は上表の URL）
   - 機能ごと: `GEMINI_API_KEY`, `STRIPE_*`（課金を使う場合）
5. `main` へ push で Production デプロイ（プレビューは PR ごと）

Stripe Webhook は `https://choreo-ten.vercel.app/api/stripe/webhook` を Stripe Dashboard に登録します（ドメイン変更時は URL を合わせて更新）。詳細は [`docs/design/api-spec.md`](docs/design/api-spec.md) を参照。

## AWS デプロイについて

| 項目                         | 本プロジェクト                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| ECS / Fargate / Lambda / RDS | **未採用**                                                                                        |
| 代替構成                     | **Vercel**（フロント + API Routes）+ **Supabase**（Auth / DB / Storage）+ **Stripe** + **Gemini** |

根拠: [`docs/design/architecture.md`](docs/design/architecture.md) の「デプロイ構成（AWS 代替）」、[`docs/design/README.md`](docs/design/README.md) の N/A 一覧。

## デモアカウント

評価・動作確認用の固定アカウントです（ログイン画面に専用ボタンはありません）。

| 項目       | 値                                                    |
| ---------- | ----------------------------------------------------- |
| メール     | `demo@bamiri.share`                                   |
| パスワード | `Demo1234`                                            |
| プラン     | **Pro**（複数プロジェクト・フォルダー共有を試せます） |

`/login` から上記でログインすると、フォルダー「デモセット」内の「サンプル（参考）」「サンプル B」と、その他フォルダーの「その他の曲」が読み込まれます。Free プランの挙動を試す場合はマイページの Stripe Portal で解約するか、`DEMO_PLAN=free npm run demo:user` でプランを戻してください。

Supabase の環境変数（`.env.local`）が設定済みのとき、デモユーザーとデータを再作成するには:

```bash
npm run demo:setup
```

（`demo:user` でアカウント作成、`demo:workspace` でワークスペース投入）

## 外部 API・サービス

| サービス                           | 用途                                                    | 設定（環境変数）                                                    |
| ---------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| **Supabase**                       | 認証・プロフィール・ワークスペース JSON・共有ストレージ | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`               |
| **Stripe**                         | Pro サブスクリプション（Checkout / Portal / Webhook）   | `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` |
| **Google Gemini**                  | ASK AI（`POST /api/help`）                              | `GEMINI_API_KEY`, `GEMINI_MODEL`                                    |
| Spotify / Apple Music / YouTube 等 | 音源リンクのメタデータ取得（`GET /api/music-metadata`） | クライアントから URL を渡すのみ（API キー不要）                     |

REST エンドポイント一覧・curl 例: [`docs/design/api-spec.md`](docs/design/api-spec.md)

## 主要 API エンドポイント

| メソッド | パス                       | 機能                                               |
| -------- | -------------------------- | -------------------------------------------------- |
| `POST`   | `/api/share`               | 共有スナップショット作成（1 曲 or フォルダー単位） |
| `GET`    | `/api/share?id=`           | 共有データ取得（閲覧専用）                         |
| `POST`   | `/api/share/upload-url`    | 共有用メディアのアップロード URL                   |
| `POST`   | `/api/help`                | ASK AI（Gemini）質問応答                           |
| `GET`    | `/api/music-metadata?url=` | 音源 URL のメタデータ取得                          |
| `POST`   | `/api/account/delete`      | アカウント削除（Bearer JWT）                       |
| `POST`   | `/api/stripe/checkout`     | Pro 申込 Checkout セッション                       |
| `POST`   | `/api/stripe/portal`       | Stripe 顧客ポータル                                |
| `GET`    | `/api/stripe/subscription` | サブスクリプション状態                             |
| `POST`   | `/api/stripe/sync`         | 課金状態の同期                                     |
| `POST`   | `/api/stripe/webhook`      | Stripe Webhook                                     |

## 将来実装予定

現バージョンでは **要件定義のスコープ外**（共同編集・PDF 出力等）は [`CHOREO_要件定義書.md`](../CHOREO_要件定義書.md) §1.4 を参照。

運用・品質まわりで検討中の拡張（[`docs/design/logging.md`](docs/design/logging.md) より）:

- 構造化ログ（`{ level, route, error, userId }`）
- Sentry 等のエラートラッキング
- リクエスト ID（`X-Request-Id`）の付与

## 画面構成

```
┌ SmartHeader ────────────────────────────────────────────────┐
│ ≡ / 曲名 / BPM・Grid・Dots / 人数 / Play・Copy・Paste・Undo │
│ Share / ASK AI                                              │
├ StageArea ──────────────────────────────────────────────────┤
│  ステージ（メンバー配置・D&D）  右上: Tool（描画ツール）     │
├ TimelineFooter ─────────────────────────────────────────────┤
│  セクションタブ / カウント行（選択時に赤い × で削除）        │
└─────────────────────────────────────────────────────────────┘
  サイドバー（≡）: PROJECTS・検索・新規・フォルダー・音源・動画
```

| 領域       | コンポーネント   | 役割                                                  |
| ---------- | ---------------- | ----------------------------------------------------- |
| 上部       | `SmartHeader`    | 曲名・BPM/Grid/Dots・人数・再生・コピペ・共有・ASK AI |
| 中央       | `StageArea`      | ステージ・メンバー配置・描画ツール（Tool）            |
| 下部       | `TimelineFooter` | セクションタブ・カウント操作                          |
| サイドバー | `ProjectSidebar` | プロジェクト・フォルダー・検索・音源・参考動画        |
| 共通       | `MemberPanel`    | メンバー名・表示/非表示・削除                         |
| 共通       | `HelpPanel`      | ASK AI チャット                                       |
| 状態       | `ChoreoContext`  | 編集状態・再生・localStorage / クラウド同期           |

## 主な機能

### 認証・アカウント

- メール / Google ログイン、新規登録、パスワード再設定
- **マイページ** … 表示名・アバター・言語・プラン・Stripe Portal
- ログイン時 **クラウド同期**（無料・Pro 共通）

### プロジェクト・フォルダー（サイドバー）

- **PROJECTS** 見出し、**検索…**、**+ 新規プロジェクト**、**フォルダー** ボタン
- ブックマーク / フォルダー / その他 のブロック表示
- ドラッグで並べ替え・フォルダー移動
- プロジェクト名のダブルクリックでリネーム

### フォーメーション編集

- メンバーをドラッグ＆ドロップで配置（方眼スナップ）
- カウント切替時に滑らかにアニメーション
- **Copy** / **Paste** / **Undo**（⌘C / ⌘V / ⌘Z）

### ヘッダーツール

- **BPM**（40〜240）、**Grid** 横/縦（ばみり）、**Dots** サイズ（14〜64 px）
- ラベル・数値は **Play** ボタンと同系の明るい表示

### タイムライン

- セクション（イントロ / Aメロ / サビ 等）のタブ・並べ替え
- セクション名は **ダブルクリック** で編集
- **選択中のセクション**に赤い **×** → 確認後にセクション削除（2 件以上・再生中は非表示）
- カウントの **クリック** で移動・選択
- **選択中のカウント**に赤い **×** → **必ず確認**して削除（再生中は非表示）
- **+** で半カウント（&）挿入、**+ Add count** / **+ Add section**

### BPM 再生

- **Play** または **Space** で再生 / 一時停止
- BPM に合わせてカウント自動進行
- 再生中にカウントクリックでその位置から再開

### ステージ描画（Tool）

- ステージ右上 **Tool** … 矢印・×マーク・ペン（カウントごとに保存）
- アイコンは最初から明るく表示、ホバーで背景が色づく（Play と同様）
- 閲覧専用モードでは非表示

### メンバー管理

- **人数** パネルで人数・名前・表示/非表示・リストから削除

### 共有（Share）

- 1 曲またはフォルダー単位の共有リンク
- 閲覧専用プレビュー

### ASK AI

- ヘッダー **ASK AI** … 操作マニュアルに基づくチャット（Gemini）
- 閲覧専用モードでは利用不可

### メディア

- サイドバー **音源** … Smart link（Spotify 等・ファイル便 URL も登録可）
- **参考動画** … YouTube / Vimeo

### 課金（Pro）

- 無料: プロジェクト 1 件 / Pro: 無制限（Stripe）

### 保存

- 編集内容は **自動保存**（localStorage + ログイン時クラウド）

## キーボードショートカット

詳細は [`docs/manual.ja.md`](docs/manual.ja.md) §11 を参照。

| 操作                       | キー                                         |
| -------------------------- | -------------------------------------------- |
| 前のカウント               | `←` / `[`                                    |
| 次のカウント               | `→` / `]`                                    |
| 再生 / 停止                | `Space`                                      |
| 配置コピー                 | `⌘C` / `Ctrl+C`                              |
| 配置ペースト               | `⌘V` / `Ctrl+V`                              |
| 元に戻す（Undo）           | `⌘Z` / `Ctrl+Z`                              |
| メンバー選択時: 非表示     | `Delete` / `Backspace`                       |
| 未選択時: 現在カウント削除 | `Delete` / `Backspace`（データあり時は確認） |
| 選択解除 / 再生停止        | `Esc`                                        |

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

| 区分           | 採用技術                                                            |
| -------------- | ------------------------------------------------------------------- |
| フレームワーク | **Next.js 16**（App Router）、**React 19**、**TypeScript 5**        |
| スタイル       | Tailwind CSS 4 + カスタム CSS（`globals.css`）                      |
| 認証・DB       | **Supabase**（Auth / PostgreSQL / Storage）                         |
| 課金           | **Stripe**（Checkout / Customer Portal / Webhook）                  |
| AI             | **Google Gemini**（`@google/generative-ai` 相当、`POST /api/help`） |
| 状態           | `ChoreoContext`、localStorage、IndexedDB（メディア）                |
| テスト         | **Vitest**（単体・API）、**Playwright**（e2e）                      |
| CI             | GitHub Actions                                                      |
| ホスティング   | **Vercel**（本番）                                                  |

主要依存: `next`, `react`, `@supabase/supabase-js`, `stripe` — 詳細は [`package.json`](package.json)

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
