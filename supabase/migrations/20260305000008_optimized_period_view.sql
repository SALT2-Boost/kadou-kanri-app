-- 期間ビュー最適化: DB側で集約し、1回のRPCで最小限のデータを返す
CREATE OR REPLACE FUNCTION get_period_view(p_start date, p_end date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'members', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'name', m.name,
          'category', m.category,
          'skills', COALESCE(
            (SELECT jsonb_agg(s.name)
             FROM member_skills ms JOIN skills s ON s.id = ms.skill_id
             WHERE ms.member_id = m.id),
            '[]'::jsonb
          )
        ) ORDER BY m.category, m.name
      ), '[]'::jsonb)
      FROM members m WHERE m.is_active = true
    ),
    'cells', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'member_id', sub.member_id,
          'month', sub.month,
          'total', sub.total
        )
      ), '[]'::jsonb)
      FROM (
        SELECT member_id, month, SUM(percentage) AS total
        FROM assignments
        WHERE month >= p_start AND month <= p_end AND percentage > 0
        GROUP BY member_id, month
      ) sub
    ),
    'skills', (
      SELECT COALESCE(jsonb_agg(s.name ORDER BY s.name), '[]'::jsonb)
      FROM skills s
    )
  );
$$;
