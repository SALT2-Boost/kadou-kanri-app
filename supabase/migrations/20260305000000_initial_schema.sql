-- ========================================
-- スキルマスタ
-- ========================================
CREATE TABLE skills (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL UNIQUE
);

INSERT INTO skills (name) VALUES
  ('戦略コンサル'),
  ('総合コンサル'),
  ('SIer'),
  ('SWE'),
  ('AIE'),
  ('DS');

-- ========================================
-- メンバー
-- ========================================
CREATE TABLE members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL CHECK (category IN ('社員', '入社予定', 'インターン')),
  note        text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ========================================
-- メンバー × スキル（多対多）
-- ========================================
CREATE TABLE member_skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_id   uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(member_id, skill_id)
);
CREATE INDEX idx_member_skills_member ON member_skills(member_id);
CREATE INDEX idx_member_skills_skill  ON member_skills(skill_id);

-- ========================================
-- 案件
-- ========================================
CREATE TABLE projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  monthly_revenue  integer,
  start_month      date NOT NULL,
  end_month        date,
  status           text NOT NULL DEFAULT '提案'
                     CHECK (status IN ('確定', '提案済', '提案')),
  description      text,
  note             text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX idx_projects_status ON projects(status);

-- ========================================
-- アサイン（月単位レコード）
-- ========================================
CREATE TABLE assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month       date NOT NULL,
  percentage  integer,
  note        text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(member_id, project_id, month)
);
CREATE INDEX idx_assignments_member       ON assignments(member_id);
CREATE INDEX idx_assignments_project      ON assignments(project_id);
CREATE INDEX idx_assignments_month        ON assignments(month);
CREATE INDEX idx_assignments_member_month ON assignments(member_id, month);

-- ========================================
-- updated_at 自動更新トリガー
-- ========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
