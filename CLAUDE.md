# 稼働管理アプリ - 開発ガイド

Salt-2 のコンサルタント・インターンの案件別稼働状況を一元管理する Web アプリ。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React (Vite) + TypeScript |
| UI ライブラリ | MUI (Material UI) v5 |
| バックエンド/DB | Supabase (PostgreSQL + Auth + Realtime) |
| 状態管理 | TanStack Query (サーバー状態) |
| ルーティング | React Router v6 |
| デプロイ | Vercel |

## ディレクトリ構造

```
稼働管理アプリ/
├── CLAUDE.md
├── requirements.md
├── .claude/
│   ├── skills/           # Claude Code スキル
│   ├── agents/           # エージェント定義
│   └── rules/            # 開発ルール
├── src/
│   ├── app/              # アプリ初期化（App.tsx, theme, router）
│   ├── features/         # 機能単位モジュール
│   │   ├── members/      # メンバー管理
│   │   ├── projects/     # 案件管理
│   │   ├── assignments/  # アサイン管理
│   │   └── dashboard/    # ダッシュボード
│   ├── shared/           # 共有モジュール
│   │   ├── ui/           # 汎用 UI コンポーネント
│   │   ├── lib/          # Supabase クライアント等
│   │   ├── hooks/        # 汎用 hooks
│   │   └── types/        # 共通型定義（DB 型含む）
│   └── main.tsx
├── supabase/
│   └── migrations/       # SQL マイグレーション
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## デザイントーン

- ベース: 黒・白・グレーのモノトーン
- アクセント: 青 (#1976D2) は CTA ボタン、アラート数値、選択中タブのみ
- MUI テーマで `palette.primary` を青、それ以外はグレースケール
- 余白を広めに取り、情報密度が高い表でも圧迫感を出さない

## 開発フロー

### Phase 0: 初期セットアップ

```
/setup-project
```

Vite + React + MUI + Supabase プロジェクトを初期化。

### Phase 1: 実装計画

```
planner エージェントで実装計画を立ててください
```

requirements.md から VSA スライスを分割し `docs/detail-plan.md` を生成。

### Phase 2: 機能実装

```
/feature-implementation Slice 1: {機能名}
```

### Phase 3: コミット

```
/git-commit
```

## Feature モジュール構成

```
features/{feature-name}/
├── api.ts           # Supabase クエリ関数
├── hooks.ts         # TanStack Query hooks
├── types.ts         # Feature 固有型（必要時のみ）
├── components/      # Feature 専用コンポーネント
│   ├── XxxList.tsx
│   ├── XxxForm.tsx
│   └── XxxDetail.tsx
└── index.ts         # barrel export
```

## 重要なルール

### Supabase

- `src/shared/lib/supabase.ts` でクライアントを一元管理
- DB 型は `supabase gen types` で自動生成 → `src/shared/types/database.ts`
- RLS（Row Level Security）は Supabase Dashboard で設定

### React / TypeScript

- MUI コンポーネントを活用（素の HTML タグを避ける）
- スタイリングは `sx` プロップを使用
- feature 間の直接 import は禁止（`index.ts` 経由）
- 楽観的更新（Optimistic UI）を積極的に使用

### データフェッチ

- TanStack Query で全サーバー状態を管理
- Supabase Realtime でリアルタイム同期（必要な画面のみ）
- query key は feature ごとに `xxxKeys` オブジェクトで管理

## スキル一覧

| スキル | 用途 |
|-------|------|
| `/setup-project` | プロジェクト初期化（Vite + React + MUI + Supabase） |
| `/feature-implementation {スライス名}` | Feature の Supabase クエリ ~ UI 実装 |
| `/git-commit` | 品質チェック後にコミット |

## エージェント一覧

| エージェント | 役割 |
|------------|------|
| **planner** | VSA 実装計画を策定し `docs/detail-plan.md` を生成 |
| **feature-builder** | Feature 実装を一気通貫でコーディネート |
| **frontend-component-builder** | MUI ベースの UI コンポーネント構築 |

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run lint         # ESLint
npm run typecheck    # TypeScript 型チェック
npm run test         # Vitest テスト
```
