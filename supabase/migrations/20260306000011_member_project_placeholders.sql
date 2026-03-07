-- ========================================
-- プロジェクト専用の未定要員（名無し要員）を管理
-- ========================================

ALTER TABLE members
  ADD COLUMN is_placeholder boolean NOT NULL DEFAULT false,
  ADD COLUMN placeholder_project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE members
  ADD CONSTRAINT members_placeholder_requires_project
  CHECK (NOT is_placeholder OR placeholder_project_id IS NOT NULL);

CREATE INDEX idx_members_placeholder_project
  ON members(placeholder_project_id);

COMMENT ON COLUMN members.is_placeholder IS
  'true の場合はプロジェクト専用の名無し要員。';

COMMENT ON COLUMN members.placeholder_project_id IS
  '名無し要員が紐づくプロジェクトID。';
