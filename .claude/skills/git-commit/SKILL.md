---
name: git-commit
description: コード品質チェック（formatter/linter/typecheck/test）を実行してから git commit する
allowed-tools:
  - Bash
  - Read
---

# git-commit: コード品質チェック & Commit

コードの品質を確保してから git commit を実行するスキル。

## Procedure

### Step 1: 変更内容確認

```bash
git status
git diff --stat
```

変更ファイルをユーザーに表示し、コミット対象を確認する。

### Step 2: 品質チェック

```bash
# Lint
npm run lint

# TypeScript 型チェック
npm run typecheck

# テスト
npm run test -- --run
```

エラーがあれば詳細を表示し、修正を促す。
すべて成功したら Step 3 へ。

### Step 3: Git commit 実行

```bash
git add -A
git commit -m "{COMMIT_MESSAGE}"
```

コミットメッセージの生成:
1. ユーザーが指定した場合 → そのまま使用
2. 指定がない場合 → 変更内容から自動生成

メッセージテンプレート:
```
{type}: {brief description}

- {変更内容の箇条書き}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

type: `feat`, `fix`, `refactor`, `test`, `chore`, `style`

### Step 4: 完了メッセージ

```
すべてのチェックが合格しました

実行したチェック:
- ESLint (linter)
- TypeScript (型チェック)
- Vitest (テスト)

Commit: {COMMIT_HASH}
```

## Constraints

- チェック失敗時は commit しない
- `.env` ファイルが含まれていないか確認
- 変更なしの場合はその旨を伝えて終了
