-- Remote project_members migration audit
-- Read-only audit for the post-20260307000015 data model.
-- Result set 1: counts by invariant.
-- Result set 2: sample offending rows by invariant.

WITH audit_counts AS (
  SELECT 'assignments_project_member_id_null'::text AS invariant, 'blocking'::text AS severity, COUNT(*)::bigint AS violation_count
  FROM assignments a
  WHERE a.project_member_id IS NULL

  UNION ALL

  SELECT 'assignments_project_member_missing', 'blocking', COUNT(*)::bigint
  FROM assignments a
  LEFT JOIN project_members pm ON pm.id = a.project_member_id
  WHERE a.project_member_id IS NOT NULL
    AND pm.id IS NULL

  UNION ALL

  SELECT 'assignments_project_id_mismatch', 'blocking', COUNT(*)::bigint
  FROM assignments a
  JOIN project_members pm ON pm.id = a.project_member_id
  WHERE a.project_id IS DISTINCT FROM pm.project_id

  UNION ALL

  SELECT 'assignments_member_id_mismatch', 'blocking', COUNT(*)::bigint
  FROM assignments a
  JOIN project_members pm ON pm.id = a.project_member_id
  WHERE a.member_id IS DISTINCT FROM pm.member_id

  UNION ALL

  SELECT 'duplicate_assignments_project_member_month', 'blocking', COUNT(*)::bigint
  FROM (
    SELECT a.project_member_id, a.month
    FROM assignments a
    GROUP BY a.project_member_id, a.month
    HAVING COUNT(*) > 1
  ) dup

  UNION ALL

  SELECT 'duplicate_confirmed_project_members', 'blocking', COUNT(*)::bigint
  FROM (
    SELECT pm.project_id, pm.member_id
    FROM project_members pm
    WHERE pm.member_id IS NOT NULL
    GROUP BY pm.project_id, pm.member_id
    HAVING COUNT(*) > 1
  ) dup

  UNION ALL

  SELECT 'orphan_project_member_skills_project_member', 'blocking', COUNT(*)::bigint
  FROM project_member_skills pms
  LEFT JOIN project_members pm ON pm.id = pms.project_member_id
  WHERE pm.id IS NULL

  UNION ALL

  SELECT 'orphan_project_member_skills_skill', 'blocking', COUNT(*)::bigint
  FROM project_member_skills pms
  LEFT JOIN skills s ON s.id = pms.skill_id
  WHERE s.id IS NULL

  UNION ALL

  SELECT 'confirmed_project_members_missing_members', 'blocking', COUNT(*)::bigint
  FROM project_members pm
  LEFT JOIN members m ON m.id = pm.member_id
  WHERE pm.member_id IS NOT NULL
    AND m.id IS NULL

  UNION ALL

  SELECT 'legacy_placeholder_members_still_referenced', 'blocking', COUNT(*)::bigint
  FROM project_members pm
  JOIN members m ON m.id = pm.member_id
  WHERE pm.member_id IS NOT NULL
    AND COALESCE(m.is_placeholder, false) = true

  UNION ALL

  SELECT 'active_legacy_placeholder_members_hidden_from_master_views', 'informational', COUNT(*)::bigint
  FROM members m
  WHERE m.is_active = true
    AND COALESCE(m.is_placeholder, false) = true
)
SELECT *
FROM audit_counts
ORDER BY severity, invariant;

WITH audit_samples AS (
  SELECT
    'assignments_project_member_id_null'::text AS invariant,
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'assignment_id', a.id,
            'project_id', a.project_id,
            'month', a.month
          ) AS sample_row
          FROM assignments a
          WHERE a.project_member_id IS NULL
          ORDER BY a.month, a.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    ) AS sample_rows

  UNION ALL

  SELECT
    'assignments_project_member_missing',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'assignment_id', a.id,
            'project_member_id', a.project_member_id,
            'project_id', a.project_id,
            'month', a.month
          ) AS sample_row
          FROM assignments a
          LEFT JOIN project_members pm ON pm.id = a.project_member_id
          WHERE a.project_member_id IS NOT NULL
            AND pm.id IS NULL
          ORDER BY a.month, a.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'assignments_project_id_mismatch',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'assignment_id', a.id,
            'project_member_id', a.project_member_id,
            'assignment_project_id', a.project_id,
            'project_member_project_id', pm.project_id
          ) AS sample_row
          FROM assignments a
          JOIN project_members pm ON pm.id = a.project_member_id
          WHERE a.project_id IS DISTINCT FROM pm.project_id
          ORDER BY a.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'assignments_member_id_mismatch',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'assignment_id', a.id,
            'project_member_id', a.project_member_id,
            'assignment_member_id', a.member_id,
            'project_member_member_id', pm.member_id
          ) AS sample_row
          FROM assignments a
          JOIN project_members pm ON pm.id = a.project_member_id
          WHERE a.member_id IS DISTINCT FROM pm.member_id
          ORDER BY a.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'duplicate_assignments_project_member_month',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'project_member_id', dup.project_member_id,
            'month', dup.month,
            'assignment_ids', dup.assignment_ids
          ) AS sample_row
          FROM (
            SELECT
              a.project_member_id,
              a.month,
              jsonb_agg(a.id ORDER BY a.id) AS assignment_ids
            FROM assignments a
            GROUP BY a.project_member_id, a.month
            HAVING COUNT(*) > 1
            ORDER BY a.month, a.project_member_id
            LIMIT 10
          ) dup
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'duplicate_confirmed_project_members',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'project_id', dup.project_id,
            'member_id', dup.member_id,
            'project_member_ids', dup.project_member_ids
          ) AS sample_row
          FROM (
            SELECT
              pm.project_id,
              pm.member_id,
              jsonb_agg(pm.id ORDER BY pm.id) AS project_member_ids
            FROM project_members pm
            WHERE pm.member_id IS NOT NULL
            GROUP BY pm.project_id, pm.member_id
            HAVING COUNT(*) > 1
            ORDER BY pm.project_id, pm.member_id
            LIMIT 10
          ) dup
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'orphan_project_member_skills_project_member',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'project_member_skill_id', pms.id,
            'project_member_id', pms.project_member_id
          ) AS sample_row
          FROM project_member_skills pms
          LEFT JOIN project_members pm ON pm.id = pms.project_member_id
          WHERE pm.id IS NULL
          ORDER BY pms.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'orphan_project_member_skills_skill',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'project_member_skill_id', pms.id,
            'skill_id', pms.skill_id
          ) AS sample_row
          FROM project_member_skills pms
          LEFT JOIN skills s ON s.id = pms.skill_id
          WHERE s.id IS NULL
          ORDER BY pms.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'confirmed_project_members_missing_members',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'project_member_id', pm.id,
            'project_id', pm.project_id,
            'member_id', pm.member_id
          ) AS sample_row
          FROM project_members pm
          LEFT JOIN members m ON m.id = pm.member_id
          WHERE pm.member_id IS NOT NULL
            AND m.id IS NULL
          ORDER BY pm.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'legacy_placeholder_members_still_referenced',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'project_member_id', pm.id,
            'project_id', pm.project_id,
            'member_id', pm.member_id,
            'member_name', m.name
          ) AS sample_row
          FROM project_members pm
          JOIN members m ON m.id = pm.member_id
          WHERE pm.member_id IS NOT NULL
            AND COALESCE(m.is_placeholder, false) = true
          ORDER BY pm.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    )

  UNION ALL

  SELECT
    'active_legacy_placeholder_members_hidden_from_master_views',
    COALESCE(
      (
        SELECT jsonb_agg(sample_row)
        FROM (
          SELECT jsonb_build_object(
            'member_id', m.id,
            'name', m.name,
            'placeholder_project_id', m.placeholder_project_id
          ) AS sample_row
          FROM members m
          WHERE m.is_active = true
            AND COALESCE(m.is_placeholder, false) = true
          ORDER BY m.id
          LIMIT 10
        ) sample_rows
      ),
      '[]'::jsonb
    )
)
SELECT *
FROM audit_samples
ORDER BY invariant;
