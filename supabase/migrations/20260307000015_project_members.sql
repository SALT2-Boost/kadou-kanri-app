ALTER TABLE members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT '未設定';

COMMENT ON COLUMN members.role IS
  'メンバーマスタ上の基本ロール';

CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  legacy_source_member_id uuid,
  name text NOT NULL,
  role text NOT NULL DEFAULT '未設定',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE project_members IS
  '案件ごとの配属単位。実メンバー・未確定要員を同じモデルで扱う。';

COMMENT ON COLUMN project_members.member_id IS
  '確定済みの場合のみ members.id を保持する。未確定要員は NULL。';

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_members_project_member
  ON project_members(project_id, member_id)
  WHERE member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_members_project
  ON project_members(project_id);

CREATE INDEX IF NOT EXISTS idx_project_members_member
  ON project_members(member_id);

CREATE TRIGGER project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS project_member_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_member_id uuid NOT NULL REFERENCES project_members(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(project_member_id, skill_id)
);

COMMENT ON TABLE project_member_skills IS
  '案件ごとの配属単位に紐づくスキル要件。';

CREATE INDEX IF NOT EXISTS idx_project_member_skills_project_member
  ON project_member_skills(project_member_id);

CREATE INDEX IF NOT EXISTS idx_project_member_skills_skill
  ON project_member_skills(skill_id);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_member_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project_members"
  ON project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert project_members"
  ON project_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update project_members"
  ON project_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete project_members"
  ON project_members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read project_member_skills"
  ON project_member_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert project_member_skills"
  ON project_member_skills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update project_member_skills"
  ON project_member_skills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete project_member_skills"
  ON project_member_skills FOR DELETE TO authenticated USING (true);

INSERT INTO project_members (
  project_id,
  member_id,
  legacy_source_member_id,
  name,
  role,
  note
)
SELECT DISTINCT
  a.project_id,
  m.id,
  m.id,
  m.name,
  m.role,
  NULL
FROM assignments a
JOIN members m ON m.id = a.member_id
WHERE COALESCE(m.is_placeholder, false) = false
ON CONFLICT DO NOTHING;

INSERT INTO project_members (
  project_id,
  member_id,
  legacy_source_member_id,
  name,
  role,
  note
)
SELECT
  m.placeholder_project_id,
  NULL,
  m.id,
  m.name,
  m.role,
  m.note
FROM members m
WHERE COALESCE(m.is_placeholder, false) = true
  AND m.placeholder_project_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO project_member_skills (project_member_id, skill_id)
SELECT
  pm.id,
  ms.skill_id
FROM project_members pm
JOIN member_skills ms
  ON ms.member_id = pm.legacy_source_member_id
ON CONFLICT DO NOTHING;

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS project_member_id uuid REFERENCES project_members(id) ON DELETE CASCADE;

UPDATE assignments a
SET project_member_id = pm.id
FROM project_members pm
WHERE pm.project_id = a.project_id
  AND pm.legacy_source_member_id = a.member_id
  AND a.project_member_id IS NULL;

ALTER TABLE assignments
  ALTER COLUMN member_id DROP NOT NULL;

ALTER TABLE assignments
  ALTER COLUMN project_member_id SET NOT NULL;

ALTER TABLE assignments
  DROP CONSTRAINT IF EXISTS assignments_member_id_project_id_month_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_project_member_month
  ON assignments(project_member_id, month);

CREATE INDEX IF NOT EXISTS idx_assignments_project_member
  ON assignments(project_member_id);

CREATE OR REPLACE FUNCTION sync_assignment_refs_from_project_member()
RETURNS trigger AS $$
DECLARE
  v_project_id uuid;
  v_member_id uuid;
BEGIN
  SELECT project_id, member_id
    INTO v_project_id, v_member_id
  FROM project_members
  WHERE id = NEW.project_member_id;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'project_member_id % not found', NEW.project_member_id;
  END IF;

  NEW.project_id := v_project_id;
  NEW.member_id := v_member_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assignments_sync_refs ON assignments;

CREATE TRIGGER assignments_sync_refs
  BEFORE INSERT OR UPDATE OF project_member_id ON assignments
  FOR EACH ROW EXECUTE FUNCTION sync_assignment_refs_from_project_member();

UPDATE assignments
SET project_member_id = project_member_id;

ALTER TABLE project_members
  DROP COLUMN legacy_source_member_id;

DROP FUNCTION IF EXISTS upsert_assignments_for_range(uuid, uuid, date, date, integer, text);
DROP FUNCTION IF EXISTS create_placeholder_member_with_assignments(uuid, text, text, uuid[], date, date, integer);
DROP FUNCTION IF EXISTS create_project_placeholders_with_assignments(uuid, date, date, jsonb, integer);

CREATE OR REPLACE FUNCTION upsert_project_member_assignments_for_range(
  p_project_member_id uuid,
  p_start date,
  p_end date,
  p_percentage integer DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_end date := COALESCE(p_end, (date_trunc('month', p_start)::date + INTERVAL '11 months')::date);
  v_month date;
BEGIN
  v_month := date_trunc('month', p_start)::date;
  WHILE v_month <= v_end LOOP
    INSERT INTO assignments (project_member_id, month, percentage, note)
    VALUES (p_project_member_id, v_month, p_percentage, p_note)
    ON CONFLICT (project_member_id, month)
    DO UPDATE SET
      percentage = EXCLUDED.percentage,
      note = EXCLUDED.note,
      updated_at = now();
    v_month := (v_month + INTERVAL '1 month')::date;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  IF p_member_id IS NOT NULL THEN
    SELECT
      COALESCE(NULLIF(trim(p_name), ''), name),
      COALESCE(NULLIF(trim(p_role), ''), role)
    INTO v_name, v_role
    FROM members
    WHERE id = p_member_id;

    IF v_name IS NULL THEN
      RAISE EXCEPTION 'member_id % not found', p_member_id;
    END IF;
  ELSE
    v_name := COALESCE(NULLIF(trim(p_name), ''), '未定要員');
    v_role := COALESCE(NULLIF(trim(p_role), ''), '未設定');
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

CREATE OR REPLACE FUNCTION update_project_member_profile(
  p_project_member_id uuid,
  p_name text,
  p_role text,
  p_note text,
  p_skill_ids uuid[]
)
RETURNS void AS $$
DECLARE
  v_member_id uuid;
  v_skill_id uuid;
BEGIN
  SELECT member_id INTO v_member_id
  FROM project_members
  WHERE id = p_project_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'project_member_id % not found', p_project_member_id;
  END IF;

  UPDATE project_members
  SET
    name = CASE
      WHEN v_member_id IS NULL THEN COALESCE(NULLIF(trim(p_name), ''), name)
      ELSE name
    END,
    role = COALESCE(NULLIF(trim(p_role), ''), role),
    note = p_note
  WHERE id = p_project_member_id;

  DELETE FROM project_member_skills
  WHERE project_member_id = p_project_member_id;

  IF p_skill_ids IS NOT NULL THEN
    FOREACH v_skill_id IN ARRAY p_skill_ids LOOP
      INSERT INTO project_member_skills (project_member_id, skill_id)
      VALUES (p_project_member_id, v_skill_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION confirm_project_member_assignment(
  p_project_member_id uuid,
  p_member_id uuid
)
RETURNS void AS $$
DECLARE
  v_name text;
BEGIN
  SELECT name INTO v_name
  FROM members
  WHERE id = p_member_id;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'member_id % not found', p_member_id;
  END IF;

  UPDATE project_members
  SET
    member_id = p_member_id,
    name = v_name
  WHERE id = p_project_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
