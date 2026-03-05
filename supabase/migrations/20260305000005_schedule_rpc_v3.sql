-- ========================================
-- RPC v3: テーブル返しのシンプルな関数に変更
-- jsonb集約は大量データで問題が出るため、テーブル返しで確実に全件返す
-- ========================================

DROP FUNCTION IF EXISTS get_schedule_for_period(date, date);
DROP FUNCTION IF EXISTS get_schedule_for_month(date);

-- メンバー+スキル（JSON集約）を返す
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
      (SELECT jsonb_agg(jsonb_build_object('skill_id', s.id, 'name', s.name))
       FROM member_skills ms JOIN skills s ON s.id = ms.skill_id
       WHERE ms.member_id = m.id),
      '[]'::jsonb
    ) AS skills
  FROM members m
  WHERE m.is_active = true
  ORDER BY m.category, m.name;
$$;

-- 期間ビュー用アサイン（JOIN済み）
CREATE OR REPLACE FUNCTION get_assignments_in_range(start_month date, end_month date)
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
  WHERE a.month >= start_month AND a.month <= end_month;
$$;

-- 月別ビュー用アサイン（JOIN済み）
CREATE OR REPLACE FUNCTION get_assignments_in_month(target_month date)
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
