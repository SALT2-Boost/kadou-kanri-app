---
name: setup-project
description: プロジェクト初期セットアップ。Vite + React + TypeScript + MUI + Supabase 開発環境を構築する。
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Setup Project: Vite + React + MUI + Supabase

## Purpose

稼働管理アプリのフロントエンド開発環境を初期化する。

1. Vite + React + TypeScript プロジェクト作成
2. MUI (Material UI) インストール・テーマ設定
3. Supabase クライアント設定
4. TanStack Query 設定
5. React Router 設定
6. ディレクトリ構造の作成
7. Vitest + Testing Library 設定

## When to use

- プロジェクトを最初から構築するとき
- `/setup-project` を実行したとき

## Prerequisites

- Node.js v18+ がインストールされていること

## Outputs

```
稼働管理アプリ/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── theme.ts
│   │   └── router.tsx
│   ├── features/
│   │   ├── members/
│   │   ├── projects/
│   │   ├── assignments/
│   │   └── dashboard/
│   ├── shared/
│   │   ├── ui/
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   ├── hooks/
│   │   └── types/
│   │       └── database.ts
│   └── main.tsx
├── supabase/
│   └── migrations/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
└── .env.example
```

## Procedure

### Step 1: 既存プロジェクトの確認

```bash
ls package.json 2>/dev/null && echo "FOUND" || echo "NOT_FOUND"
```

- **FOUND**: 「既にプロジェクトが存在します。」と伝えて終了
- **NOT_FOUND**: Step 2 へ

### Step 2: Vite + React プロジェクト初期化

```bash
npm create vite@latest . -- --template react-ts
npm install
```

### Step 3: 依存パッケージインストール

```bash
# MUI
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-data-grid @mui/x-date-pickers

# Supabase
npm install @supabase/supabase-js

# TanStack Query
npm install @tanstack/react-query

# React Router
npm install react-router-dom

# チャートライブラリ（ダッシュボード用）
npm install recharts

# 開発依存
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

### Step 4: ディレクトリ構造作成

```bash
mkdir -p src/app
mkdir -p src/features/{members,projects,assignments,dashboard}/{components,}
mkdir -p src/shared/{ui,lib,hooks,types}
mkdir -p supabase/migrations
```

### Step 5: MUI テーマ設定

`src/app/theme.ts` を作成：
- `palette.primary`: `#1976D2`（青）
- `palette.background.default`: `#FAFAFA`
- モノトーンベースのカラースキーム
- 日本語フォント対応

### Step 6: Supabase クライアント設定

`src/shared/lib/supabase.ts` を作成：
- `createClient` で初期化
- 環境変数 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` を使用

### Step 7: TanStack Query + React Router + MUI を統合した App.tsx

`src/app/App.tsx` を作成：
- `QueryClientProvider`
- `ThemeProvider` + `CssBaseline`
- `BrowserRouter` + ルート定義

### Step 8: ルーター設定

`src/app/router.tsx` を作成：
- `/` → メンバー稼働表
- `/projects` → 案件一覧
- `/projects/:id` → 案件詳細
- `/members` → メンバー一覧
- `/members/:id` → メンバー詳細
- `/dashboard` → ダッシュボード
- `/export` → データエクスポート

### Step 9: レイアウトコンポーネント

`src/shared/ui/Layout.tsx` を作成：
- 左サイドバー（折りたたみ可）
- メインコンテンツエリア
- レスポンシブ対応

### Step 10: 環境変数テンプレート

`.env.example` を作成：
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 11: Vite 設定

`vite.config.ts` を更新：
- パスエイリアス `@/` → `./src/`

### Step 12: TypeScript 設定

`tsconfig.json` を更新：
- パスエイリアス設定
- strict モード

### Step 13: Vitest 設定

`vitest.config.ts` を作成：
- jsdom 環境
- パスエイリアス

### Step 14: package.json スクリプト追加

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest"
  }
}
```

### Step 15: 動作確認

```bash
npm run build
npm run dev
```

### Step 16: 完了メッセージ

```
セットアップが完了しました

配置ファイル:
- src/app/App.tsx          - アプリルート
- src/app/theme.ts         - MUI テーマ（モノトーン + 青アクセント）
- src/app/router.tsx       - ルーティング定義
- src/shared/lib/supabase.ts - Supabase クライアント
- src/shared/ui/Layout.tsx - レイアウト（サイドバー付き）

次のステップ:
1. .env に Supabase の接続情報を設定
2. planner エージェントで実装計画を策定
   「planner で実装計画を立ててください」
```

## Constraints

- `.env` ファイルは `.gitignore` に含めること
- Supabase の接続情報はハードコードしない
