# 開発規約

## React + TypeScript

- 関数コンポーネント + hooks のみ使用（class コンポーネント禁止）
- `interface` を優先（`type` は union 等で必要な場合のみ）
- `any` 禁止、`unknown` を使用
- props の型は inline で定義（小さい場合）または同ファイル内で `interface` 定義

## MUI

- レイアウトは `Box`, `Stack`, `Grid` を使用
- スタイリングは `sx` プロップ（CSS ファイルを作らない）
- 色はテーマトークン参照（`'primary.main'`, `'grey.100'` 等）
- アイコンは `@mui/icons-material` から import

## Supabase

- クライアントは `src/shared/lib/supabase.ts` の singleton を使用
- DB 型は `src/shared/types/database.ts`（`supabase gen types` で生成）
- エラーハンドリング: `const { data, error } = await ...` パターン必須
- RLS は Supabase Dashboard で設定

## TanStack Query

- Query Key は feature ごとに `xxxKeys` オブジェクトで一元管理
- 楽観的更新を使用（パフォーマンス要件: 編集→即座に画面反映）
- `enabled` オプションで条件付きフェッチ
- `staleTime` はデフォルト 0（リアルタイム性重視）

## ファイル構成

- feature 内は `api.ts` → `hooks.ts` → `components/` → `index.ts`
- feature 間の直接 import 禁止（`index.ts` 経由）
- shared は全 feature から参照可能
- 1 ファイル 1 エクスポート（コンポーネント）

## 命名規則

- コンポーネント: PascalCase（`MemberList.tsx`）
- hooks: camelCase `use` プレフィックス（`useMembers`）
- Supabase クエリ関数: camelCase `fetch/create/update/delete` プレフィックス
- ファイル名: コンポーネント → PascalCase、その他 → camelCase

## Git

- コミットメッセージ: `{type}: {description}`
- type: `feat`, `fix`, `refactor`, `test`, `chore`, `style`
