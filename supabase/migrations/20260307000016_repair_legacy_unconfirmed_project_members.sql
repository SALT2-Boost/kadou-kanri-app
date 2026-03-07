-- Repair legacy placeholder-like rows after project_members migration.
-- Keep the legacy members rows for traceability, but treat them as unconfirmed
-- staffing rows at the project_members layer.

WITH single_member_skill_role AS (
  SELECT
    ms.member_id,
    MIN(s.name) AS role_name
  FROM member_skills ms
  JOIN skills s ON s.id = ms.skill_id
  GROUP BY ms.member_id
  HAVING COUNT(*) = 1
)
UPDATE members m
SET
  role = sms.role_name,
  updated_at = now()
FROM single_member_skill_role sms
WHERE m.id = sms.member_id
  AND COALESCE(NULLIF(trim(m.role), ''), '未設定') = '未設定';

UPDATE members
SET
  role = CASE
    WHEN name ~ '^未定要員\\(.+\\)$' THEN regexp_replace(name, '^未定要員\\((.+)\\)$', '\\1')
    WHEN name ~ '^.+要員(\\(.+\\))?$' THEN regexp_replace(name, '^(.+?)要員(?:\\(.+\\))?$', '\\1')
    ELSE role
  END,
  updated_at = now()
WHERE COALESCE(NULLIF(trim(role), ''), '未設定') = '未設定'
  AND (
    name ~ '^未定要員\\(.+\\)$'
    OR name ~ '^.+要員(\\(.+\\))?$'
  );

WITH legacy_unconfirmed_members AS (
  SELECT pm.id
  FROM project_members pm
  JOIN members m ON m.id = pm.member_id
  WHERE pm.member_id IS NOT NULL
    AND (
      COALESCE(m.is_placeholder, false) = true
      OR m.category = '未定枠'
    )
)
UPDATE assignments a
SET member_id = NULL
WHERE a.project_member_id IN (SELECT id FROM legacy_unconfirmed_members)
  AND a.member_id IS NOT NULL;

WITH legacy_unconfirmed_members AS (
  SELECT pm.id
  FROM project_members pm
  JOIN members m ON m.id = pm.member_id
  WHERE pm.member_id IS NOT NULL
    AND (
      COALESCE(m.is_placeholder, false) = true
      OR m.category = '未定枠'
    )
)
UPDATE project_members pm
SET
  member_id = NULL,
  updated_at = now()
WHERE pm.id IN (SELECT id FROM legacy_unconfirmed_members);

UPDATE project_members pm
SET
  role = m.role,
  updated_at = now()
FROM members m
WHERE pm.member_id = m.id
  AND COALESCE(NULLIF(trim(pm.role), ''), '未設定') = '未設定'
  AND COALESCE(NULLIF(trim(m.role), ''), '未設定') <> '未設定';

WITH single_project_member_skill_role AS (
  SELECT
    pms.project_member_id,
    MIN(s.name) AS role_name
  FROM project_member_skills pms
  JOIN skills s ON s.id = pms.skill_id
  GROUP BY pms.project_member_id
  HAVING COUNT(*) = 1
)
UPDATE project_members pm
SET
  role = spms.role_name,
  updated_at = now()
FROM single_project_member_skill_role spms
WHERE pm.id = spms.project_member_id
  AND COALESCE(NULLIF(trim(pm.role), ''), '未設定') = '未設定';

UPDATE project_members
SET
  role = CASE
    WHEN name ~ '^未定要員\\(.+\\)$' THEN regexp_replace(name, '^未定要員\\((.+)\\)$', '\\1')
    WHEN name ~ '^.+要員(\\(.+\\))?$' THEN regexp_replace(name, '^(.+?)要員(?:\\(.+\\))?$', '\\1')
    ELSE role
  END,
  updated_at = now()
WHERE COALESCE(NULLIF(trim(role), ''), '未設定') = '未設定'
  AND (
    name ~ '^未定要員\\(.+\\)$'
    OR name ~ '^.+要員(\\(.+\\))?$'
  );
