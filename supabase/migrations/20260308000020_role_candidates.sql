-- Role candidates are editable suggestions, while actual project role values remain free text.

CREATE TABLE IF NOT EXISTS role_candidates (
  name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE role_candidates IS
  'PJ role入力時の候補マスタ。project_members.role 自体は自由入力。';

INSERT INTO role_candidates (name)
VALUES
  ('PM'),
  ('SWE'),
  ('DS'),
  ('AIE'),
  ('SIer'),
  ('戦略コンサル'),
  ('総合コンサル'),
  ('デザイナー'),
  ('その他')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_candidates (name)
SELECT DISTINCT trim(role)
FROM project_members
WHERE trim(COALESCE(role, '')) <> ''
  AND trim(role) <> '未設定'
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_candidates (name)
SELECT DISTINCT trim(target ->> 'role')
FROM projects
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(staffing_targets, '[]'::jsonb)) AS target
WHERE trim(COALESCE(target ->> 'role', '')) <> ''
ON CONFLICT (name) DO NOTHING;

ALTER TABLE role_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read role_candidates" ON role_candidates;
DROP POLICY IF EXISTS "Authenticated users can insert role_candidates" ON role_candidates;
DROP POLICY IF EXISTS "Authenticated users can update role_candidates" ON role_candidates;
DROP POLICY IF EXISTS "Authenticated users can delete role_candidates" ON role_candidates;

CREATE POLICY "Authenticated users can read role_candidates"
  ON role_candidates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert role_candidates"
  ON role_candidates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update role_candidates"
  ON role_candidates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete role_candidates"
  ON role_candidates FOR DELETE TO authenticated USING (true);
