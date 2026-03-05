# 稼働管理アプリ VSA 実装計画

作成日: 2026-03-05

---

## 概要

本ドキュメントは `requirements.md` を元に VSA（Vertical Slice Architecture）で機能を分割し、実装順序・依存関係・作成ファイルを定義する。

---

## Supabase テーブル設計とマイグレーション SQL

ファイル: `supabase/migrations/20260305000000_initial_schema.sql`

```sql
-- ========================================
-- スキルマスタ
-- ========================================
CREATE TABLE skills (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL UNIQUE
);

INSERT INTO skills (name) VALUES
  ('戦略コンサル'),
  ('総合コンサル'),
  ('SIer'),
  ('SWE'),
  ('AIE'),
  ('DS');

-- ========================================
-- メンバー
-- ========================================
CREATE TABLE members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL CHECK (category IN ('社員', '入社予定', 'インターン')),
  note        text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ========================================
-- メンバー × スキル（多対多）
-- ========================================
CREATE TABLE member_skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_id   uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(member_id, skill_id)
);
CREATE INDEX idx_member_skills_member ON member_skills(member_id);
CREATE INDEX idx_member_skills_skill  ON member_skills(skill_id);

-- ========================================
-- 案件
-- ========================================
CREATE TABLE projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  monthly_revenue  integer,
  start_month      date NOT NULL,
  end_month        date,
  status           text NOT NULL DEFAULT '提案'
                     CHECK (status IN ('確定', '提案済', '提案')),
  description      text,
  note             text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX idx_projects_status ON projects(status);

-- ========================================
-- アサイン（月単位レコード）
-- ========================================
CREATE TABLE assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month       date NOT NULL,
  percentage  integer,
  note        text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(member_id, project_id, month)
);
CREATE INDEX idx_assignments_member       ON assignments(member_id);
CREATE INDEX idx_assignments_project      ON assignments(project_id);
CREATE INDEX idx_assignments_month        ON assignments(month);
CREATE INDEX idx_assignments_member_month ON assignments(member_id, month);

-- ========================================
-- updated_at 自動更新トリガー
-- ========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## VSA 機能スライス分割

依存関係の方向: Slice 1, 2 は独立 → Slice 3 は 1+2 に依存 → Slice 4, 5 は 1+2+3 に依存 → Slice 6, 7 はすべてに依存

```
Slice 1 (メンバー管理)
Slice 2 (案件管理)
    └─→ Slice 3 (アサイン管理)
            ├─→ Slice 4 (稼働表 期間ビュー)
            ├─→ Slice 5 (稼働表 月別ビュー)
            └─→ Slice 6 (ダッシュボード)
                    └─→ Slice 7 (データエクスポート)
```

---

## Phase 1: 基本 CRUD

### Slice 1: メンバー管理

**概要:** メンバーの一覧表示・作成・編集・スキル紐付けを実装する。他すべてのスライスの土台となる。

**対象画面:** `/members`, `/members/:id`

**関連テーブル:** `members`, `skills`, `member_skills`

**依存スライス:** なし

**作成ファイル:**

```
src/
├── shared/
│   ├── lib/
│   │   └── supabase.ts                    # Supabase クライアント singleton
│   └── types/
│       └── database.ts                    # supabase gen types で生成（または手動定義）
├── features/
│   └── members/
│       ├── api.ts                         # fetchMembers, fetchMember, createMember,
│       │                                  # updateMember, deleteMember,
│       │                                  # fetchSkills, updateMemberSkills
│       ├── hooks.ts                       # useMembers, useMember, useSkills,
│       │                                  # useCreateMember, useUpdateMember,
│       │                                  # useDeleteMember, useUpdateMemberSkills
│       ├── types.ts                       # MemberWithSkills 等の拡張型
│       ├── components/
│       │   ├── MemberList.tsx             # 一覧テーブル（区分・スキルフィルタ、名前検索）
│       │   ├── MemberForm.tsx             # 作成・編集ダイアログ（スキル複数選択）
│       │   └── MemberDetail.tsx          # 詳細ページ（基本情報 + アサイン閲覧）
│       └── index.ts                       # barrel export
├── app/
│   ├── App.tsx                            # ルーター・テーマ・QueryClient 初期化
│   ├── theme.ts                           # MUI テーマ（モノトーン + 青アクセント）
│   └── router.tsx                         # React Router ルート定義（全スライス分）
└── main.tsx
```

**実装順序:**

1. `src/shared/lib/supabase.ts` - Supabase クライアント
2. `src/shared/types/database.ts` - DB 型定義
3. `src/app/theme.ts` - MUI テーマ
4. `src/app/router.tsx` - ルート骨格（全ルートを空コンポーネントで定義）
5. `src/app/App.tsx` - QueryClientProvider, ThemeProvider, RouterProvider
6. `src/features/members/api.ts` - Supabase クエリ関数
7. `src/features/members/hooks.ts` - TanStack Query hooks
8. `src/features/members/types.ts` - 拡張型
9. `src/features/members/components/MemberList.tsx`
10. `src/features/members/components/MemberForm.tsx`
11. `src/features/members/components/MemberDetail.tsx`
12. `src/features/members/index.ts`
13. router.tsx に `/members`, `/members/:id` を接続

**受け入れ条件:**

- [ ] `/members` でメンバー一覧が表示される
- [ ] 区分チェックボックス・スキルチップ・名前検索でフィルタが機能する
- [ ] 「+ 新規メンバー」からダイアログで作成でき、即座に一覧に反映される（楽観的更新）
- [ ] 行クリックで `/members/:id` に遷移し、基本情報をインライン編集できる
- [ ] スキルを複数選択して保存できる
- [ ] メンバー削除ができる

---

### Slice 2: 案件管理

**概要:** 案件の一覧表示・作成・編集・ステータス管理を実装する。アサイン管理（Slice 3）の前提。

**対象画面:** `/projects`, `/projects/:id`（上部の基本情報のみ）

**関連テーブル:** `projects`

**依存スライス:** なし（Slice 1 と並行実装可能）

**作成ファイル:**

```
src/features/projects/
├── api.ts          # fetchProjects, fetchProject, createProject,
│                   # updateProject, deleteProject
├── hooks.ts        # useProjects, useProject, useCreateProject,
│                   # useUpdateProject, useDeleteProject
├── types.ts        # Project 拡張型（必要時）
├── components/
│   ├── ProjectList.tsx      # 一覧テーブル（ステータスフィルタ）
│   ├── ProjectForm.tsx      # 作成・編集ダイアログ
│   └── ProjectDetail.tsx    # 詳細ページ上部（基本情報のみ、Slice 3 でアサイン追加）
└── index.ts
```

**実装順序:**

1. `src/features/projects/api.ts`
2. `src/features/projects/hooks.ts`
3. `src/features/projects/types.ts`
4. `src/features/projects/components/ProjectList.tsx`
5. `src/features/projects/components/ProjectForm.tsx`
6. `src/features/projects/components/ProjectDetail.tsx`（基本情報パートのみ）
7. `src/features/projects/index.ts`
8. router.tsx に `/projects`, `/projects/:id` を接続

**受け入れ条件:**

- [ ] `/projects` で案件一覧が表示される
- [ ] ステータス（確定/提案済/提案）でフィルタできる
- [ ] 「+ 新規案件」から作成でき、即座に一覧に反映される（楽観的更新）
- [ ] 行クリックで `/projects/:id` に遷移し、基本情報をインライン編集できる
- [ ] ステータスをチップ形式で表示・変更できる

---

## Phase 2: コア機能

### Slice 3: アサイン管理

**概要:** 案件詳細画面の下部にアサインテーブルを追加する。メンバーを案件にアサインし、月別稼働%を入力する。

**対象画面:** `/projects/:id`（下部のアサインテーブル）

**関連テーブル:** `assignments`（`members`, `projects` を JOIN）

**依存スライス:** Slice 1（members）, Slice 2（projects）

**作成ファイル:**

```
src/features/assignments/
├── api.ts          # fetchAssignmentsByProject, fetchAssignmentsByMember,
│                   # upsertAssignment, deleteAssignment,
│                   # fetchMemberMonthlyTotals（稼働表用集計）
├── hooks.ts        # useAssignmentsByProject, useAssignmentsByMember,
│                   # useUpsertAssignment, useDeleteAssignment,
│                   # useMemberMonthlyTotals
├── types.ts        # AssignmentWithRelations 等の拡張型
├── components/
│   ├── AssignmentTable.tsx       # メンバー × 月マトリクス（案件詳細下部）
│   ├── AssignMemberDialog.tsx    # メンバー追加ダイアログ（月・%一括入力）
│   └── AssignmentCell.tsx        # セル単体（稼働%直接編集、楽観的更新）
└── index.ts
```

**実装順序:**

1. `src/features/assignments/api.ts`
2. `src/features/assignments/hooks.ts`
3. `src/features/assignments/types.ts`
4. `src/features/assignments/components/AssignmentCell.tsx`
5. `src/features/assignments/components/AssignMemberDialog.tsx`
6. `src/features/assignments/components/AssignmentTable.tsx`
7. `src/features/assignments/index.ts`
8. `ProjectDetail.tsx` にアサインテーブルを組み込む

**受け入れ条件:**

- [ ] 案件詳細画面の下部にアサインテーブル（メンバー × 案件期間の月列）が表示される
- [ ] 「+ メンバー追加」ダイアログでメンバーを選択し、月と稼働%を一括入力できる
- [ ] セルをクリックして稼働%を直接編集でき、楽観的更新で即座に反映される
- [ ] 行削除でアサインを解除できる
- [ ] 同一メンバー・案件・月の重複登録が防止される

---

### Slice 4: メイン稼働表（期間ビュー）

**概要:** コアとなるメイン画面。メンバー × 月のマトリクスで稼働状況を一覧表示する。

**対象画面:** `/`

**関連テーブル:** `members`, `assignments`, `skills`, `member_skills`（READ のみ）

**依存スライス:** Slice 1, 2, 3

**作成ファイル:**

```
src/features/
└── schedule/                            # メイン稼働表専用 feature
    ├── api.ts          # fetchMemberSchedule（members LEFT JOIN assignments で集計）
    ├── hooks.ts        # useMemberSchedule
    ├── types.ts        # ScheduleRow, ScheduleCell 等の表示用型
    ├── components/
    │   ├── SchedulePage.tsx             # ページ全体（ビュー切り替えタブ含む）
    │   ├── PeriodView.tsx               # 期間ビューのルートコンポーネント
    │   ├── ScheduleTable.tsx            # メンバー × 月マトリクステーブル
    │   ├── ScheduleCell.tsx             # セル（色分け、クリックでポップオーバー）
    │   ├── AssignmentPopover.tsx        # 案件内訳ポップオーバー（案件名 × %）
    │   └── ScheduleFilter.tsx          # 区分チェック・スキルチップ・名前検索フィルタ
    └── index.ts
```

**実装順序:**

1. `src/features/schedule/types.ts` - 表示用型を先に設計
2. `src/features/schedule/api.ts` - members LEFT JOIN assignments の集計クエリ
3. `src/features/schedule/hooks.ts`
4. `src/features/schedule/components/ScheduleFilter.tsx`
5. `src/features/schedule/components/AssignmentPopover.tsx`
6. `src/features/schedule/components/ScheduleCell.tsx`（色分けロジック含む）
7. `src/features/schedule/components/ScheduleTable.tsx`
8. `src/features/schedule/components/PeriodView.tsx`
9. `src/features/schedule/components/SchedulePage.tsx`
10. `src/features/schedule/index.ts`
11. router.tsx の `/` に接続

**セルの色分けロジック:**

| 条件 | 表示 |
|------|------|
| 稼働% > 100 | 赤背景（`error.light`） |
| 80 ≦ 稼働% ≦ 100 | 通常（`grey.100`） |
| 1 ≦ 稼働% < 80 | 薄グレー（`grey.50`） |
| 0% / 未アサイン | 空白 |

**受け入れ条件:**

- [ ] `/` で当月起点 6 ヶ月のメンバー × 月マトリクスが表示される
- [ ] 期間を「半年 / 1年」で切り替えられる
- [ ] メンバーが区分（社員 → 入社予定 → インターン）でグルーピングされる
- [ ] セルの色が稼働%に応じて正しく色分けされる
- [ ] セルクリックでポップオーバーが開き、案件名 × 稼働%の内訳が表示される
- [ ] 区分チェックボックス・スキルチップ・名前検索でリアルタイムフィルタが機能する

---

### Slice 5: メイン稼働表（月別ビュー）

**概要:** 期間ビューの別ビュー。選択月に絞って、メンバー × 案件の稼働%マトリクスを表示する。

**対象画面:** `/`（ビュー切り替え後）

**関連テーブル:** `members`, `assignments`, `projects`（READ のみ）

**依存スライス:** Slice 4（SchedulePage の骨格を再利用）

**作成ファイル:**

```
src/features/schedule/components/
└── MonthlyView.tsx     # 月別ビュー（メンバー × 案件列、合計稼働%）
```

**実装順序:**

1. `src/features/schedule/api.ts` に `fetchMonthlyView` を追加
2. `src/features/schedule/hooks.ts` に `useMonthlyView` を追加
3. `src/features/schedule/components/MonthlyView.tsx`
4. `SchedulePage.tsx` にビュー切り替えタブを組み込む

**受け入れ条件:**

- [ ] タブで「期間ビュー / 月別ビュー」を切り替えられる
- [ ] 月別ビューで対象月を選択できる
- [ ] 選択月にアクティブな案件が動的に列として展開される
- [ ] メンバー × 案件セルに稼働%が表示される
- [ ] 合計稼働%列が正しく集計される

---

## Phase 3: 拡張機能

### Slice 6: ダッシュボード

**概要:** 売上推移グラフ・過負荷アラート・未アサインメンバー一覧を提供する管理ビュー。

**対象画面:** `/dashboard`

**関連テーブル:** `assignments`, `projects`, `members`（READ のみ）

**依存スライス:** Slice 1, 2, 3

**追加パッケージ:** `recharts`（グラフ描画）

**作成ファイル:**

```
src/features/dashboard/
├── api.ts          # fetchMonthlyRevenue, fetchOverloadAlerts,
│                   # fetchUnassignedMembers
├── hooks.ts        # useMonthlyRevenue, useOverloadAlerts,
│                   # useUnassignedMembers
├── components/
│   ├── DashboardPage.tsx            # ダッシュボードページ全体
│   ├── RevenueChart.tsx             # 月別売上スタックドバーチャート
│   ├── OverloadAlertList.tsx        # 100%超メンバー × 月一覧
│   └── UnassignedMemberList.tsx     # 未アサインメンバー一覧
└── index.ts
```

**実装順序:**

1. `npm install recharts @types/recharts`
2. `src/features/dashboard/api.ts`
3. `src/features/dashboard/hooks.ts`
4. `src/features/dashboard/components/RevenueChart.tsx`
5. `src/features/dashboard/components/OverloadAlertList.tsx`
6. `src/features/dashboard/components/UnassignedMemberList.tsx`
7. `src/features/dashboard/components/DashboardPage.tsx`
8. `src/features/dashboard/index.ts`
9. router.tsx の `/dashboard` に接続

**受け入れ条件:**

- [ ] 月別売上推移がスタックドバーチャートで表示される（確定/提案済/提案の色分け）
- [ ] 稼働 100% 超のメンバー × 月の一覧が表示される
- [ ] 当月から 3 ヶ月先でアサインが 0 の未アサインメンバー一覧が表示される

---

### Slice 7: データエクスポート

**概要:** DB の全テーブルデータを CSV / JSON 形式でダウンロードする。

**対象画面:** `/export`

**関連テーブル:** 全テーブル（READ のみ）

**依存スライス:** Slice 1, 2, 3

**作成ファイル:**

```
src/features/export/
├── api.ts          # fetchAllMembers, fetchAllProjects,
│                   # fetchAllAssignments, fetchAllSkills
├── hooks.ts        # useExportData
├── utils/
│   └── exportHelpers.ts   # JSON → CSV 変換ユーティリティ
├── components/
│   └── ExportPage.tsx     # テーブル選択・フォーマット選択・ダウンロードボタン
└── index.ts
```

**実装順序:**

1. `src/features/export/api.ts`
2. `src/features/export/utils/exportHelpers.ts`
3. `src/features/export/hooks.ts`
4. `src/features/export/components/ExportPage.tsx`
5. `src/features/export/index.ts`
6. router.tsx の `/export` に接続

**受け入れ条件:**

- [ ] `/export` でエクスポート対象テーブルを選択できる
- [ ] CSV / JSON フォーマットを選択できる
- [ ] ダウンロードボタンでファイルが正しくダウンロードされる
- [ ] 日本語カラム名を含む CSV が文字化けせずに開ける（UTF-8 BOM 付き）

---

## 共有インフラ（全スライス共通）

### `src/shared/` の構成

```
src/shared/
├── lib/
│   └── supabase.ts          # createClient singleton
├── types/
│   └── database.ts          # DB 型（supabase gen types または手動）
├── ui/
│   ├── Layout.tsx            # サイドバー + メインコンテンツレイアウト
│   ├── Sidebar.tsx           # グローバルナビ（折りたたみ可）
│   ├── PageHeader.tsx        # ページタイトル + アクションボタン領域
│   ├── StatusChip.tsx        # 案件ステータスチップ（確定/提案済/提案）
│   ├── SkillChip.tsx         # スキルチップ
│   └── LoadingOverlay.tsx    # ローディング表示
└── hooks/
    └── useDebounce.ts        # 検索フィルタ用デバウンス
```

`Layout.tsx` と `Sidebar.tsx` は Slice 1 の実装時に合わせて作成する。

---

## 実装スケジュール目安

| Slice | 推定時間 | 優先度 |
|-------|---------|--------|
| Slice 1: メンバー管理 | 3〜4h | 最高 |
| Slice 2: 案件管理 | 2〜3h | 最高 |
| Slice 3: アサイン管理 | 3〜4h | 高 |
| Slice 4: 稼働表（期間ビュー） | 4〜5h | 高 |
| Slice 5: 稼働表（月別ビュー） | 2〜3h | 中 |
| Slice 6: ダッシュボード | 3〜4h | 中 |
| Slice 7: データエクスポート | 1〜2h | 低 |

---

## 次のステップ

各 Slice を以下のコマンドで順に実装する。

```
/feature-implementation Slice 1: メンバー管理
/feature-implementation Slice 2: 案件管理
/feature-implementation Slice 3: アサイン管理
/feature-implementation Slice 4: メイン稼働表（期間ビュー）
/feature-implementation Slice 5: メイン稼働表（月別ビュー）
/feature-implementation Slice 6: ダッシュボード
/feature-implementation Slice 7: データエクスポート
```
