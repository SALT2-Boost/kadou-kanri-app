# 稼働管理アプリ 要件定義

## 1. 概要

Salt-2のコンサルタント・インターンの案件別稼働状況を一元管理するWebアプリ。Excelの二重管理・数式の壊れやすさを解消し、シンプルな表形式でリアルタイムに編集・閲覧できる。

## 2. 技術スタック

| レイヤー | 技術 | 理由 |
|---|---|---|
| フロントエンド | React (Vite) + TypeScript | コンポーネント分割、型安全 |
| UIライブラリ | MUI (Material UI) | 豊富なコンポーネント、DataGrid、テーマカスタマイズ |
| バックエンド/DB | Supabase (PostgreSQL) | 認証・リアルタイム・ホスティング込み |
| デプロイ | Vercel | Next.jsとの相性、プレビューデプロイ |

### 2.1 デザイントーン

- ベース：黒・白・グレーのモノトーン
- アクセント：青（#1976D2）は超重要な要素のみ（CTAボタン、アラート数値、選択中タブ）
- MUI テーマで `palette.primary` を青、それ以外はグレースケールに統一
- 余白を広めに取り、情報密度が高い表でも圧迫感を出さない

### 2.2 パフォーマンス要件

- 初回ロード：2秒以内（Vercel Edge + コード分割）
- 画面遷移：体感即時（React Router + データプリフェッチ）
- テーブル操作（ソート・フィルタ）：100ms以内
- Supabaseクエリ：インデックス設計で50ms以内
- 楽観的更新（Optimistic UI）：編集→即座に画面反映→バックグラウンドでDB保存

## 3. データモデル

### 3.1 テーブル設計

```sql
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
-- スキル（マスタ）
-- ========================================
CREATE TABLE skills (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL UNIQUE
);
-- 初期データ: '戦略コンサル', '総合コンサル', 'SIer', 'SWE', 'AIE', 'DS'

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
CREATE INDEX idx_member_skills_skill ON member_skills(skill_id);

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
-- アサイン（月単位レコード = source of truth）
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
CREATE INDEX idx_assignments_member ON assignments(member_id);
CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_assignments_month ON assignments(month);
CREATE INDEX idx_assignments_member_month ON assignments(member_id, month);
```

### 3.2 設計判断

**スキルを別テーブル（多対多）にした理由：**
- 1メンバーが複数スキルを持てる（戦略コンサル + SWE 等）
- `member_skills` JOINで「SWEスキルを持つ人だけ」「SWEかつAIE」等のフィルタが効率的
- スキル種別の追加・変更がマスタ側だけで完結
- 将来「案件の要求スキル」とのマッチングにも使える

**アサインを月単位レコードにした理由：**
- 月ごとに稼働%が変動するケースに自然に対応
- 集計クエリがシンプル：`WHERE month = '2026-03-01'` でその月の全アサインが取れる
- `(member_id, project_id, month)` のUNIQUE制約で重複防止

**案件ステータスの3段階：**
- `提案` → まだクライアントに出していない
- `提案済` → 提案済みだが確定前
- `確定` → 受注確定

### 3.3 主要クエリ例

```sql
-- 人別月次稼働率（メイン画面・期間ビュー用）
SELECT m.id, m.name, m.category, a.month, SUM(a.percentage) AS total_pct
FROM members m
LEFT JOIN assignments a ON m.id = a.member_id
WHERE a.month BETWEEN '2026-03-01' AND '2026-08-01'
GROUP BY m.id, m.name, m.category, a.month
ORDER BY m.category, m.name, a.month;

-- 特定スキルでフィルタ（AND: SWEかつAIE）
SELECT m.*
FROM members m
WHERE EXISTS (SELECT 1 FROM member_skills ms JOIN skills s ON ms.skill_id = s.id
              WHERE ms.member_id = m.id AND s.name = 'SWE')
  AND EXISTS (SELECT 1 FROM member_skills ms JOIN skills s ON ms.skill_id = s.id
              WHERE ms.member_id = m.id AND s.name = 'AIE');

-- 特定スキルでフィルタ（OR: SWEまたはAIE）
SELECT DISTINCT m.*
FROM members m
JOIN member_skills ms ON m.id = ms.member_id
JOIN skills s ON ms.skill_id = s.id
WHERE s.name IN ('SWE', 'AIE');

-- 案件別月次体制（案件詳細画面用）
SELECT p.name, p.monthly_revenue, a.month, m.name AS member_name,
       a.percentage, a.note
FROM projects p
JOIN assignments a ON p.id = a.project_id
JOIN members m ON a.member_id = m.id
WHERE p.id = $1
ORDER BY a.month, m.name;

-- 月別売上（ダッシュボード用）
SELECT a.month,
       SUM(CASE WHEN p.status = '確定' THEN p.monthly_revenue ELSE 0 END) AS confirmed,
       SUM(CASE WHEN p.status = '提案済' THEN p.monthly_revenue ELSE 0 END) AS proposed,
       SUM(CASE WHEN p.status = '提案' THEN p.monthly_revenue ELSE 0 END) AS draft
FROM (SELECT DISTINCT project_id, month FROM assignments) a
JOIN projects p ON a.project_id = p.id
WHERE p.monthly_revenue IS NOT NULL
GROUP BY a.month
ORDER BY a.month;
```

## 4. 画面構成

### 4.1 メイン画面：メンバー稼働表 `/` （デフォルト）

核となるビュー。メンバー × 月の稼働状況を一覧で把握する。

**期間ビュー（デフォルト）：**
- デフォルト表示：当月起点で6ヶ月間。ドロップダウンで「半年 / 1年」切り替え
- 行：メンバー（区分でグルーピング：社員 → 入社予定 → インターン）
- 列：メンバー名 / スキルタグ / 月1 / 月2 / ... / 月N
- セル：その月の合計稼働%
  - 100%超 → 赤背景
  - 80〜100% → 通常
  - 1〜79% → 薄グレー
  - 0%/未アサイン → 空白
- セルクリック → ポップオーバーで内訳表示（案件名 × %のリスト）
- フィルタ：区分チェックボックス、スキルチップ選択、名前検索

**月別ビュー（切り替え）：**
- 表示月を1つ選択
- 行：メンバー
- 列：メンバー名 / スキル / 案件1 / 案件2 / ... / 合計稼働%
- その月にアクティブな案件が列として動的に展開される

### 4.2 案件管理画面 `/projects`

**案件一覧テーブル：**
- 列：案件名、月額売上（万円）、期間、ステータス（チップ表示）、概要
- ステータスでフィルタ（確定/提案済/提案）
- 「+ 新規案件」ボタン → 作成ダイアログ
- 行クリック → 案件詳細へ

**案件詳細 `/projects/:id`：**
- 上部：案件基本情報（インライン編集可）
  - 案件名、月額売上、期間、ステータス、概要、備考
- 下部：アサインテーブル
  - 行：アサインされたメンバー
  - 列：メンバー名 / 月1 / 月2 / ... （案件期間分）
  - セル：稼働%（直接編集可）
  - 「+ メンバー追加」→ メンバー選択ダイアログ → 月と%を一括入力
  - 行削除でアサイン解除

### 4.3 メンバー管理画面 `/members`

**一覧テーブル：**
- 列：名前、区分、スキル（タグ表示）、備考、現在稼働率
- 区分・スキルでフィルタ
- 「+ 新規メンバー」ボタン
- 行クリック → メンバー詳細

**メンバー詳細 `/members/:id`：**
- 基本情報編集（名前、区分、スキル選択〔複数可〕、備考）
- このメンバーのアサイン一覧（案件名 × 月 × % のテーブル。閲覧用、編集は案件詳細から）

### 4.4 ダッシュボード `/dashboard`

- 月別売上推移グラフ（スタックドバー：確定/提案済/提案）
- 過負荷アラート：100%超のメンバー × 月の一覧
- 未アサインメンバー一覧（当月〜3ヶ月先でアサインが0の人）
- 稼働率ヒートマップ（メンバー × 月のマトリクス、色で濃淡）

## 5. 画面遷移

```
/                  → メンバー稼働表（メイン・期間ビュー）
/projects          → 案件一覧
/projects/:id      → 案件詳細 + アサイン編集
/members           → メンバー一覧
/members/:id       → メンバー詳細
/dashboard         → ダッシュボード（売上・アラート）
/export            → データエクスポート
```

グローバルナビ：左サイドバー（折りたたみ可）。モバイルではハンバーガーメニュー。

## 6. データフロー

```
案件登録 ──→ projects テーブル
                │
                ├── 案件詳細画面でアサイン入力
                │         │
                │         ▼
                │   assignments テーブル（月 × メンバー × %）
                │         │
                │         ├──→ メイン稼働表に自動反映
                │         ├──→ メンバー詳細に自動反映
                │         └──→ ダッシュボードに自動反映
                │
メンバー登録 ──→ members テーブル
                    │
                    └── member_skills テーブル（スキル紐付け）
```

原則：アサインは案件詳細画面から入力。「この案件に誰をアサインするか」という自然な業務フローに合わせる。

## 7. レスポンシブ対応

- PC（1200px+）：サイドバー常時表示、テーブルはフル幅
- タブレット（768〜1199px）：サイドバー折りたたみ、テーブルは横スクロール
- モバイル（〜767px）：ハンバーガーメニュー、テーブルはカード表示に切り替え or 横スクロール
- 期間ビューのヒートマップはタッチ操作対応（タップで内訳表示）

## 8. 非機能要件

- 認証：Supabase Auth（Google OAuth or マジックリンク）。初期は後回しでもOK
- 初期は単一組織（Salt-2）のみ
- **データエクスポート：** `/export` 画面からCSV / JSON形式でDB全テーブルをダウンロード可能（将来の別システム統合用）
- パフォーマンス：50メンバー×30案件×12ヶ月 = 最大18,000行程度のassignments。Supabaseで十分
- 楽観的更新でサクサク動作

## 9. 未決定事項

- 認証の優先度（MVP時点で入れるか後回しか）
- Supabaseプロジェクトの作成・接続情報
- 初期データの移行方法（現在のExcelから自動投入するか手動か）
