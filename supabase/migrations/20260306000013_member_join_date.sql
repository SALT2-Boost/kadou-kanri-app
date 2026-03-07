-- 入社予定社員の入社時期を管理
ALTER TABLE members
  ADD COLUMN join_date date;

COMMENT ON COLUMN members.join_date IS
  '入社予定時期。category が「入社予定」の場合に使用。';
