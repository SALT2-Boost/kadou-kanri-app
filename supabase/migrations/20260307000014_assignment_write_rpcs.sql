-- ========================================
-- 書き込み系RPCの追加（トランザクション境界をDBへ集約）
-- ========================================

CREATE OR REPLACE FUNCTION upsert_assignments_for_range(
  p_member_id uuid,
  p_project_id uuid,
  p_start date,
  p_end date,
  p_percentage integer DEFAULT NULL,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end date;
  v_month date;
BEGIN
  v_end := COALESCE(p_end, (p_start + INTERVAL '11 month')::date);
  v_month := p_start;

  WHILE v_month <= v_end LOOP
    INSERT INTO assignments (member_id, project_id, month, percentage, note)
    VALUES (p_member_id, p_project_id, v_month, p_percentage, p_note)
    ON CONFLICT (member_id, project_id, month)
    DO UPDATE SET
      percentage = EXCLUDED.percentage,
      note = EXCLUDED.note;

    v_month := (v_month + INTERVAL '1 month')::date;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION create_placeholder_member_with_assignments(
  p_project_id uuid,
  p_name text,
  p_note text,
  p_skill_ids uuid[],
  p_start date,
  p_end date,
  p_percentage integer DEFAULT 100
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_skill_id uuid;
BEGIN
  INSERT INTO members (
    name,
    category,
    note,
    is_active,
    is_placeholder,
    placeholder_project_id
  )
  VALUES (
    p_name,
    '未定枠',
    p_note,
    true,
    true,
    p_project_id
  )
  RETURNING id INTO v_member_id;

  IF p_skill_ids IS NOT NULL THEN
    FOREACH v_skill_id IN ARRAY p_skill_ids LOOP
      INSERT INTO member_skills (member_id, skill_id)
      VALUES (v_member_id, v_skill_id)
      ON CONFLICT (member_id, skill_id) DO NOTHING;
    END LOOP;
  END IF;

  PERFORM upsert_assignments_for_range(
    v_member_id,
    p_project_id,
    p_start,
    p_end,
    p_percentage,
    NULL
  );

  RETURN v_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_project_placeholders_with_assignments(
  p_project_id uuid,
  p_start date,
  p_end date,
  p_placeholders jsonb,
  p_percentage integer DEFAULT 100
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_placeholder jsonb;
  v_name text;
  v_note text;
  v_skill_ids uuid[];
BEGIN
  FOR v_placeholder IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_placeholders, '[]'::jsonb))
  LOOP
    v_name := COALESCE(NULLIF(v_placeholder->>'name', ''), '未定要員');
    v_note := NULLIF(v_placeholder->>'note', '');
    v_skill_ids := ARRAY(
      SELECT value::uuid
      FROM jsonb_array_elements_text(COALESCE(v_placeholder->'skill_ids', '[]'::jsonb))
    );

    PERFORM create_placeholder_member_with_assignments(
      p_project_id,
      v_name,
      v_note,
      v_skill_ids,
      p_start,
      p_end,
      p_percentage
    );
  END LOOP;
END;
$$;
