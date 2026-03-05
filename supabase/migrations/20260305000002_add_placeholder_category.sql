-- ========================================
-- 未定枠カテゴリの追加
-- ========================================

-- CHECK 制約を更新（DROP + ADD）
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_category_check;
ALTER TABLE members ADD CONSTRAINT members_category_check
  CHECK (category IN ('社員', '入社予定', 'インターン', '未定枠'));
