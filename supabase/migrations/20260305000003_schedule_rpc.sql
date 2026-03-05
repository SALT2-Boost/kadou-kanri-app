-- ========================================
-- 期間ビュー用 RPC: 1回のクエリで全データを返す
-- ========================================

-- メンバー＋スキルを JSON 配列で返すビュー
CREATE OR REPLACE FUNCTION get_members_with_skills()
RETURNS TABLE (
  id         uuid,
  name       text,
  category   text,
  skills     jsonb
) LANGUAGE sql STABLE AS $$
  SELECT
    m.id,
    m.name,
    m.category,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('skill_id', s.id, 'name', s.name)
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::jsonb
    ) AS skills
  FROM members m
  LEFT JOIN member_skills ms ON ms.member_id = m.id
  LEFT JOIN skills s ON s.id = ms.skill_id
  WHERE m.is_active = true
  GROUP BY m.id, m.name, m.category
  ORDER BY m.category, m.name;
$$;

-- 期間ビュー用: アサイン＋案件名を一括取得
CREATE OR REPLACE FUNCTION get_assignments_for_period(start_month date, end_month date)
RETURNS TABLE (
  member_id    uuid,
  project_id   uuid,
  month        date,
  percentage   integer,
  project_name text
) LANGUAGE sql STABLE AS $$
  SELECT
    a.member_id,
    a.project_id,
    a.month,
    a.percentage,
    p.name AS project_name
  FROM assignments a
  JOIN projects p ON p.id = a.project_id
  WHERE a.month >= start_month
    AND a.month <= end_month;
$$;

-- 月別ビュー用: 特定月のアサイン＋案件名
CREATE OR REPLACE FUNCTION get_assignments_for_month(target_month date)
RETURNS TABLE (
  member_id    uuid,
  project_id   uuid,
  percentage   integer,
  project_name text
) LANGUAGE sql STABLE AS $$
  SELECT
    a.member_id,
    a.project_id,
    a.percentage,
    p.name AS project_name
  FROM assignments a
  JOIN projects p ON p.id = a.project_id
  WHERE a.month = target_month;
$$;
