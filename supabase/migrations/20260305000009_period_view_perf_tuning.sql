-- ========================================
-- 期間ビュー性能改善
-- 1) メンバー取得のN+1サブクエリを排除
-- 2) 期間集計専用RPCを追加
-- 3) 期間集計向け部分インデックスを追加
-- ========================================

CREATE OR REPLACE FUNCTION get_members_with_skills()
RETURNS TABLE (
  id         uuid,
  name       text,
  category   text,
  skills     jsonb
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH skills_by_member AS (
    SELECT
      ms.member_id,
      jsonb_agg(
        jsonb_build_object('skill_id', s.id, 'name', s.name)
        ORDER BY s.name
      ) AS skills
    FROM member_skills ms
    JOIN skills s ON s.id = ms.skill_id
    GROUP BY ms.member_id
  )
  SELECT
    m.id,
    m.name,
    m.category,
    COALESCE(sbm.skills, '[]'::jsonb) AS skills
  FROM members m
  LEFT JOIN skills_by_member sbm ON sbm.member_id = m.id
  WHERE m.is_active = true
  ORDER BY m.category, m.name;
$$;

CREATE OR REPLACE FUNCTION get_period_totals(p_start date, p_end date)
RETURNS TABLE (
  member_id uuid,
  month     date,
  total     integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    a.member_id,
    a.month,
    SUM(a.percentage)::integer AS total
  FROM assignments a
  WHERE a.month >= p_start
    AND a.month <= p_end
    AND a.percentage > 0
  GROUP BY a.member_id, a.month
  ORDER BY a.member_id, a.month;
$$;

CREATE INDEX IF NOT EXISTS idx_assignments_month_member_positive
  ON assignments (month, member_id)
  WHERE percentage > 0;
