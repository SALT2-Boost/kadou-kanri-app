-- ========================================
-- 案件に「希望スペック構成比」を保持
-- ========================================

ALTER TABLE projects
  ADD COLUMN staffing_targets jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE projects
  ADD CONSTRAINT projects_staffing_targets_is_array
  CHECK (jsonb_typeof(staffing_targets) = 'array');

COMMENT ON COLUMN projects.staffing_targets IS
  'アサイン前の希望体制。[{ "spec": "SWE経験3年以上", "percentage": 40 }] の配列。';
