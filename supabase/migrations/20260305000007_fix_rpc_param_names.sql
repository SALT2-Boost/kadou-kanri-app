-- ========================================
-- RPC引数名がprojectsテーブルのカラム名(start_month/end_month)と衝突する問題を修正
-- ========================================

-- 旧関数を削除して再作成（引数名変更のためDROP必須）
DROP FUNCTION IF EXISTS get_assignments_in_range(date, date);
DROP FUNCTION IF EXISTS get_assignments_in_month(date);

CREATE FUNCTION get_assignments_in_range(p_start date, p_end date)
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

CREATE FUNCTION get_assignments_in_month(p_month date)
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
  WHERE a.month = p_month;
$$;
