---
name: feature-implementation
description: Feature の Supabase クエリ ~ React UI までを一気通貫で実装する
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash
  - Agent
---

# Feature Implementation: Supabase + React 一気通貫実装

## Purpose

VSA（Vertical Slice Architecture）に基づき、1つの機能スライスを
Supabase クエリ ~ TanStack Query hooks ~ MUI コンポーネントまで一貫して実装する。

## Input

- $ARGUMENTS: 実装対象のスライス名
  - 例: `Slice 1: メンバー管理 CRUD`
  - 例: `Slice 2: 案件管理`
  - 例: `Slice 3: アサイン編集`

スライス名は `docs/detail-plan.md` に記載された計画から取得する。

## When to use

- `/feature-implementation {スライス名}` を実行したとき
- 特定の機能を実装したいとき

## Prerequisites

- `/setup-project` が完了していること
- Supabase プロジェクトが作成され、`.env` に接続情報が設定されていること
- `docs/detail-plan.md` が生成されていること（推奨）

## 実装フロー

```
Phase 1: データ層
├─ api.ts: Supabase クエリ関数
├─ types.ts: Feature 固有型（必要時のみ）
└─ hooks.ts: TanStack Query hooks
    ↓
Phase 2: UI 層
├─ components/: MUI コンポーネント群
├─ index.ts: barrel export
└─ ルーターへの接続
    ↓
Phase 3: 検証
├─ TypeScript 型チェック
├─ 動作確認
└─ テスト（必要に応じて）
```

## Procedure

### Step 1: 要件確認

1. `requirements.md` から対象スライスの要件を確認
2. `docs/detail-plan.md` が存在すれば、スコープを確認
3. 既存コードを確認し、パターンを把握

### Step 2: api.ts 作成（Supabase クエリ）

対象: `src/features/{feature-name}/api.ts`

```typescript
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/shared/types/database';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];

// Query Keys
export const memberKeys = {
  all: ['members'] as const,
  list: (filters?: Record<string, unknown>) => [...memberKeys.all, 'list', filters] as const,
  detail: (id: string) => [...memberKeys.all, 'detail', id] as const,
};

// Supabase クエリ関数
export async function fetchMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*, member_skills(skill_id, skills(name))')
    .eq('is_active', true)
    .order('category')
    .order('name');

  if (error) throw error;
  return data;
}

export async function fetchMemberById(id: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*, member_skills(skill_id, skills(name))')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createMember(member: MemberInsert) {
  const { data, error } = await supabase
    .from('members')
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Step 3: hooks.ts 作成（TanStack Query）

対象: `src/features/{feature-name}/hooks.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberKeys, fetchMembers, fetchMemberById, createMember } from './api';

export function useMembers() {
  return useQuery({
    queryKey: memberKeys.list(),
    queryFn: fetchMembers,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => fetchMemberById(id),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
```

### Step 4: コンポーネント作成

対象: `src/features/{feature-name}/components/`

- **一覧コンポーネント**: DataGrid / Table でデータ表示
- **フォームコンポーネント**: 作成・編集用
- **詳細コンポーネント**: 個別データ表示

MUI コンポーネントを使用し、sx プロップでスタイリング。

### Step 5: index.ts 作成（barrel export）

```typescript
export { MemberList } from './components/MemberList';
export { MemberForm } from './components/MemberForm';
export { MemberDetail } from './components/MemberDetail';
export { useMembers, useMember, useCreateMember } from './hooks';
export { memberKeys } from './api';
```

### Step 6: ルーター接続

`src/app/router.tsx` にルートを追加・更新。

### Step 7: 品質チェック

```bash
# 型チェック
npm run typecheck

# Lint
npm run lint

# テスト（あれば）
npm run test -- --run
```

### Step 8: 完了報告

実装完了時は以下を報告:

1. 作成/変更したファイル一覧
2. 追加したコンポーネント / hooks
3. Supabase クエリの内容
4. 型チェック・lint 結果

## パターンガイド

### 楽観的更新

```typescript
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAssignment,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: assignmentKeys.all });
      const previous = queryClient.getQueryData(assignmentKeys.list());
      // 楽観的に更新
      queryClient.setQueryData(assignmentKeys.list(), (old) =>
        old?.map((item) => item.id === newData.id ? { ...item, ...newData } : item)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // ロールバック
      queryClient.setQueryData(assignmentKeys.list(), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}
```

### Supabase Realtime

```typescript
import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useAssignmentsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['assignments'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}
```

## Constraints

- `src/shared/` のコードは必要最小限の変更のみ
- feature 間の直接 import は禁止（index.ts 経由）
- Supabase クエリはエラーハンドリング必須
- MUI コンポーネントを使用（素の HTML タグを避ける）
