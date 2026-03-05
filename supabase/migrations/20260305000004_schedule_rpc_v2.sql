-- ========================================
-- 旧RPC関数を削除し、1往復で済む新RPC関数に置き換え
-- ========================================

-- 旧関数を削除
DROP FUNCTION IF EXISTS get_members_with_skills();
DROP FUNCTION IF EXISTS get_assignments_for_period(date, date);
DROP FUNCTION IF EXISTS get_assignments_for_month(date);

-- 期間ビュー用: メンバー+スキル+アサインを1回のRPCで返す
CREATE OR REPLACE FUNCTION get_schedule_for_period(start_month date, end_month date)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'members', (
      SELECT COALESCE(jsonb_agg(to_jsonb(m_row) ORDER BY m_row.category, m_row.name), '[]'::jsonb)
      FROM (
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
      ) m_row
    ),
    'assignments', (
      SELECT COALESCE(jsonb_agg(to_jsonb(a_row)), '[]'::jsonb)
      FROM (
        SELECT
          a.member_id,
          a.project_id,
          a.month,
          a.percentage,
          p.name AS project_name
        FROM assignments a
        JOIN projects p ON p.id = a.project_id
        WHERE a.month >= start_month AND a.month <= end_month
      ) a_row
    )
  );
$$;

-- 月別ビュー用: メンバー+スキル+アサインを1回のRPCで返す
CREATE OR REPLACE FUNCTION get_schedule_for_month(target_month date)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'members', (
      SELECT COALESCE(jsonb_agg(to_jsonb(m_row) ORDER BY m_row.category, m_row.name), '[]'::jsonb)
      FROM (
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
      ) m_row
    ),
    'assignments', (
      SELECT COALESCE(jsonb_agg(to_jsonb(a_row)), '[]'::jsonb)
      FROM (
        SELECT
          a.member_id,
          a.project_id,
          a.percentage,
          p.name AS project_name
        FROM assignments a
        JOIN projects p ON p.id = a.project_id
        WHERE a.month = target_month
      ) a_row
    )
  );
$$;
