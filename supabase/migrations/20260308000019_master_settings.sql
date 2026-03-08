-- Master settings for project categories and skill management.

CREATE TABLE IF NOT EXISTS project_categories (
  name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE project_categories IS
  '案件で利用するPJカテゴリのマスタ';

INSERT INTO project_categories (name)
VALUES
  ('戦コン'),
  ('AIエージェント'),
  ('システムリプレイス'),
  ('データサイエンス'),
  ('その他')
ON CONFLICT (name) DO NOTHING;

INSERT INTO project_categories (name)
SELECT DISTINCT category
FROM projects
WHERE category IS NOT NULL
ON CONFLICT (name) DO NOTHING;

ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read project_categories" ON project_categories;
DROP POLICY IF EXISTS "Authenticated users can insert project_categories" ON project_categories;
DROP POLICY IF EXISTS "Authenticated users can update project_categories" ON project_categories;
DROP POLICY IF EXISTS "Authenticated users can delete project_categories" ON project_categories;

CREATE POLICY "Authenticated users can read project_categories"
  ON project_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert project_categories"
  ON project_categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_categories"
  ON project_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project_categories"
  ON project_categories FOR DELETE TO authenticated USING (true);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can update skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can delete skills" ON skills;

CREATE POLICY "Authenticated users can insert skills"
  ON skills FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update skills"
  ON skills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete skills"
  ON skills FOR DELETE TO authenticated USING (true);

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_category_check;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_category_fkey;

ALTER TABLE projects
  ADD CONSTRAINT projects_category_fkey
  FOREIGN KEY (category)
  REFERENCES project_categories(name)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
