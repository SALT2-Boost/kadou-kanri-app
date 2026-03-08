-- role is owned by project_members, not by members.

CREATE OR REPLACE FUNCTION create_project_member_with_assignments(
  p_project_id uuid,
  p_member_id uuid,
  p_name text,
  p_role text,
  p_note text,
  p_skill_ids uuid[],
  p_start date,
  p_end date,
  p_percentage integer DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_project_member_id uuid;
  v_name text;
  v_role text;
  v_skill_id uuid;
BEGIN
  v_role := COALESCE(NULLIF(trim(p_role), ''), '未設定');

  IF p_member_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(trim(p_name), ''), name)
    INTO v_name
    FROM members
    WHERE id = p_member_id;

    IF v_name IS NULL THEN
      RAISE EXCEPTION 'member_id % not found', p_member_id;
    END IF;
  ELSE
    v_name := COALESCE(NULLIF(trim(p_name), ''), '未定要員');
  END IF;

  INSERT INTO project_members (
    project_id,
    member_id,
    name,
    role,
    note
  ) VALUES (
    p_project_id,
    p_member_id,
    v_name,
    v_role,
    p_note
  )
  RETURNING id INTO v_project_member_id;

  IF p_member_id IS NOT NULL AND (p_skill_ids IS NULL OR cardinality(p_skill_ids) = 0) THEN
    INSERT INTO project_member_skills (project_member_id, skill_id)
    SELECT v_project_member_id, ms.skill_id
    FROM member_skills ms
    WHERE ms.member_id = p_member_id
    ON CONFLICT DO NOTHING;
  ELSIF p_skill_ids IS NOT NULL THEN
    FOREACH v_skill_id IN ARRAY p_skill_ids LOOP
      INSERT INTO project_member_skills (project_member_id, skill_id)
      VALUES (v_project_member_id, v_skill_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  PERFORM upsert_project_member_assignments_for_range(
    v_project_member_id,
    p_start,
    p_end,
    p_percentage,
    NULL
  );

  RETURN v_project_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE members
  DROP COLUMN IF EXISTS role;
