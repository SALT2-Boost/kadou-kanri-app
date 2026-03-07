-- ========================================
-- 1. PJカテゴリー追加
-- 2. ステータス「提案」→「提案予定」にリネーム
-- ========================================

-- PJカテゴリー
ALTER TABLE projects
  ADD COLUMN category text NOT NULL DEFAULT 'その他';

COMMENT ON COLUMN projects.category IS
  'PJカテゴリー: 戦コン / AIエージェント / システムリプレイス / その他';

-- ステータスのCHECK制約を更新してから値を変更
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

UPDATE projects SET status = '提案予定' WHERE status = '提案';

ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('確定', '提案済', '提案予定'));
