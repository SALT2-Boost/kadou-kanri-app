-- ========================================
-- RPC関数をSECURITY DEFINERに変更
-- RLSはテーブルレベルで認証済みユーザーに許可しているが、
-- RPC経由の場合はINVOKERだとanon roleで実行される。
-- SECURITY DEFINERで関数作成者（postgres）権限で実行する。
-- ========================================

CREATE OR REPLACE FUNCTION get_members_with_skills()
RETURNS TABLE (
  id         uuid,
  name       text,
  category   text,
  skills     jsonb
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
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

CREATE OR REPLACE FUNCTION get_assignments_in_range(p_start date, p_end date)
RETURNS TABLE (
  member_id    uuid,
  project_id   uuid,
  month        date,
  percentage   integer,
  project_name text
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.member_id,
    a.project_id,
    a.month,
    a.percentage,
    p.name AS project_name
  FROM assignments a
  JOIN projects p ON p.id = a.project_id
  WHERE a.month >= p_start AND a.month <= p_end;
$$;

CREATE OR REPLACE FUNCTION get_assignments_in_month(target_month date)
RETURNS TABLE (
  member_id    uuid,
  project_id   uuid,
  percentage   integer,
  project_name text
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.member_id,
    a.project_id,
    a.percentage,
    p.name AS project_name
  FROM assignments a
  JOIN projects p ON p.id = a.project_id
  WHERE a.month = target_month;
$$;
