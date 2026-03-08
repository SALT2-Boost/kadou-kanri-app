-- Add member company and extend project category options.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT 'ブーストコンサルティング';

UPDATE members
SET company = 'ブーストコンサルティング'
WHERE company IS NULL;

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_company_check;

ALTER TABLE members
  ADD CONSTRAINT members_company_check
  CHECK (company IN ('SALT2', 'ブーストコンサルティング'));

COMMENT ON COLUMN members.company IS
  '所属会社: SALT2 / ブーストコンサルティング';

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_category_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_category_check
  CHECK (category IN ('戦コン', 'AIエージェント', 'システムリプレイス', 'データサイエンス', 'その他'));

COMMENT ON COLUMN projects.category IS
  'PJカテゴリー: 戦コン / AIエージェント / システムリプレイス / データサイエンス / その他';
