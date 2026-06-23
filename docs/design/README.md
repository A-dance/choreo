# bamiri — SHARE 設計書一覧

本ディレクトリは評価・開発用の設計ドキュメントです。  
製品要件の正本は [`CHOREO_要件定義書.md`](../../../CHOREO_要件定義書.md)（親ディレクトリ）および [`../manual.ja.md`](../manual.ja.md) です。

| ドキュメント | 内容 |
|-------------|------|
| [app-spec.md](./app-spec.md) | 簡易アプリ仕様設計シート |
| [architecture.md](./architecture.md) | アーキテクチャ図・フロント/バックエンド分離 |
| [er-diagram.md](./er-diagram.md) | ER 図 |
| [sequence-diagrams.md](./sequence-diagrams.md) | シーケンス図（共有・課金・ASK AI） |
| [table-definitions.md](./table-definitions.md) | テーブル定義書 |
| [api-spec.md](./api-spec.md) | REST API 一覧・curl 例 |
| [api-spec.openapi.yaml](./api-spec.openapi.yaml) | OpenAPI 3.0 仕様（Swagger Editor で試験可） |
| [postman-collection.json](./postman-collection.json) | Postman コレクション |
| [error-responses.md](./error-responses.md) | エラーレスポンス形式 |
| [logging.md](./logging.md) | ログ設計 |
| [design-comp.md](./design-comp.md) | デザインカンプ（Figma） |

## 採用スタックにより N/A とする項目

| 評価項目 | 理由 |
|----------|------|
| AWS IAM ロール・ポリシー | AWS 未使用。Supabase RLS で代替（[table-definitions.md](./table-definitions.md)） |
| VPC / サブネット / セキュリティグループ | Vercel + Supabase マネージド。自前 VPC なし |
| IaC（Terraform / CDK） | 未採用。インフラは Vercel / Supabase ダッシュボード管理 |
| Hono 構成 | 未採用。Next.js App Router Route Handlers を使用 |
| AWS 構成図（ECS, Lambda, RDS 等） | 未採用。代替は [architecture.md](./architecture.md) |
