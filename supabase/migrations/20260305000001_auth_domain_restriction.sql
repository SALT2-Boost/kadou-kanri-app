-- ========================================
-- ドメイン制限: @boostconsulting.co.jp のみ許可
-- サインアップ時に不正ドメインのユーザーを自動削除するトリガー
-- ========================================

CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email NOT LIKE '%@boostconsulting.co.jp' THEN
    -- 許可されていないドメインの場合、ユーザーを削除
    DELETE FROM auth.users WHERE id = NEW.id;
    RAISE EXCEPTION 'Email domain not allowed. Only @boostconsulting.co.jp is permitted.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users にトリガーを作成（新規ユーザー作成時に発火）
CREATE TRIGGER enforce_email_domain
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION check_email_domain();

-- ========================================
-- RLS: 認証済みユーザーのみアクセス可能
-- ========================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全データにアクセス可能（単一組織のため）
CREATE POLICY "Authenticated users can read members"
  ON members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert members"
  ON members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update members"
  ON members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete members"
  ON members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read skills"
  ON skills FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read member_skills"
  ON member_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert member_skills"
  ON member_skills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete member_skills"
  ON member_skills FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read assignments"
  ON assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assignments"
  ON assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assignments"
  ON assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete assignments"
  ON assignments FOR DELETE TO authenticated USING (true);
