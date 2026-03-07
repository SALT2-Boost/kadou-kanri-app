import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    'Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const outputArgIndex = process.argv.indexOf('--output');
const outputPath =
  outputArgIndex >= 0 && process.argv[outputArgIndex + 1]
    ? path.resolve(process.cwd(), process.argv[outputArgIndex + 1])
    : null;

const projectRefMatch = url.match(/^https:\/\/([^.]+)\.supabase\.co$/);
const projectRef = projectRefMatch?.[1] ?? 'unknown';

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'remote-project-members-audit/1.0',
    },
  },
});

async function fetchAll(table, select, orderBy = 'id') {
  const pageSize = 1000;
  const rows = [];
  let from = 0;

  while (true) {
    const query = supabase
      .from(table)
      .select(select)
      .order(orderBy, { ascending: true })
      .range(from, from + pageSize - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`[${table}] ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

function groupBy(items, keyFn) {
  const groups = new Map();

  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  return groups;
}

function toInvariant(invariant, severity, rows) {
  return {
    invariant,
    severity,
    count: rows.length,
    sample_rows: rows.slice(0, 10),
  };
}

const [assignments, projectMembers, projectMemberSkills, skills, members] =
  await Promise.all([
    fetchAll(
      'assignments',
      'id, project_member_id, project_id, member_id, month',
    ),
    fetchAll('project_members', 'id, project_id, member_id, name, role'),
    fetchAll('project_member_skills', 'id, project_member_id, skill_id'),
    fetchAll('skills', 'id, name'),
    fetchAll(
      'members',
      'id, name, category, is_active, is_placeholder, placeholder_project_id',
    ),
  ]);

const projectMemberMap = new Map(projectMembers.map((row) => [row.id, row]));
const memberMap = new Map(members.map((row) => [row.id, row]));
const skillIds = new Set(skills.map((row) => row.id));

const assignmentsProjectMemberIdNull = assignments
  .filter((row) => row.project_member_id === null)
  .map((row) => ({
    assignment_id: row.id,
    project_id: row.project_id,
    month: row.month,
  }));

const assignmentsProjectMemberMissing = assignments
  .filter(
    (row) =>
      row.project_member_id !== null && !projectMemberMap.has(row.project_member_id),
  )
  .map((row) => ({
    assignment_id: row.id,
    project_member_id: row.project_member_id,
    project_id: row.project_id,
    month: row.month,
  }));

const assignmentsProjectIdMismatch = assignments
  .flatMap((row) => {
    if (row.project_member_id === null) return [];

    const projectMember = projectMemberMap.get(row.project_member_id);
    if (!projectMember || row.project_id === projectMember.project_id) return [];

    return [
      {
        assignment_id: row.id,
        project_member_id: row.project_member_id,
        assignment_project_id: row.project_id,
        project_member_project_id: projectMember.project_id,
      },
    ];
  });

const assignmentsMemberIdMismatch = assignments
  .flatMap((row) => {
    if (row.project_member_id === null) return [];

    const projectMember = projectMemberMap.get(row.project_member_id);
    if (!projectMember) return [];

    const assignmentMemberId = row.member_id ?? null;
    const projectMemberMemberId = projectMember.member_id ?? null;

    if (assignmentMemberId === projectMemberMemberId) return [];

    return [
      {
        assignment_id: row.id,
        project_member_id: row.project_member_id,
        assignment_member_id: assignmentMemberId,
        project_member_member_id: projectMemberMemberId,
      },
    ];
  });

const duplicateAssignmentsProjectMemberMonth = [...groupBy(
  assignments,
  (row) => `${row.project_member_id ?? 'null'}|${row.month}`,
).values()]
  .filter((rows) => rows.length > 1)
  .map((rows) => ({
    project_member_id: rows[0].project_member_id,
    month: rows[0].month,
    assignment_ids: rows.map((row) => row.id),
  }));

const duplicateConfirmedProjectMembers = [...groupBy(
  projectMembers.filter((row) => row.member_id !== null),
  (row) => `${row.project_id}|${row.member_id}`,
).values()]
  .filter((rows) => rows.length > 1)
  .map((rows) => ({
    project_id: rows[0].project_id,
    member_id: rows[0].member_id,
    project_member_ids: rows.map((row) => row.id),
  }));

const orphanProjectMemberSkillsProjectMember = projectMemberSkills
  .filter((row) => !projectMemberMap.has(row.project_member_id))
  .map((row) => ({
    project_member_skill_id: row.id,
    project_member_id: row.project_member_id,
  }));

const orphanProjectMemberSkillsSkill = projectMemberSkills
  .filter((row) => !skillIds.has(row.skill_id))
  .map((row) => ({
    project_member_skill_id: row.id,
    skill_id: row.skill_id,
  }));

const confirmedProjectMembersMissingMembers = projectMembers
  .filter((row) => row.member_id !== null && !memberMap.has(row.member_id))
  .map((row) => ({
    project_member_id: row.id,
    member_id: row.member_id,
    project_id: row.project_id,
  }));

const legacyPlaceholderMembersStillReferenced = projectMembers
  .flatMap((row) => {
    if (row.member_id === null) return [];

    const member = memberMap.get(row.member_id);
    if (!member?.is_placeholder) return [];

    return [
      {
        project_member_id: row.id,
        project_id: row.project_id,
        member_id: row.member_id,
        member_name: member.name,
      },
    ];
  });

const activeLegacyPlaceholderMembers = members
  .filter((row) => row.is_active && row.is_placeholder)
  .map((row) => ({
    member_id: row.id,
    name: row.name,
    placeholder_project_id: row.placeholder_project_id,
  }));

const invariants = [
  toInvariant(
    'assignments_project_member_id_null',
    'blocking',
    assignmentsProjectMemberIdNull,
  ),
  toInvariant(
    'assignments_project_member_missing',
    'blocking',
    assignmentsProjectMemberMissing,
  ),
  toInvariant(
    'assignments_project_id_mismatch',
    'blocking',
    assignmentsProjectIdMismatch,
  ),
  toInvariant(
    'assignments_member_id_mismatch',
    'blocking',
    assignmentsMemberIdMismatch,
  ),
  toInvariant(
    'duplicate_assignments_project_member_month',
    'blocking',
    duplicateAssignmentsProjectMemberMonth,
  ),
  toInvariant(
    'duplicate_confirmed_project_members',
    'blocking',
    duplicateConfirmedProjectMembers,
  ),
  toInvariant(
    'orphan_project_member_skills_project_member',
    'blocking',
    orphanProjectMemberSkillsProjectMember,
  ),
  toInvariant(
    'orphan_project_member_skills_skill',
    'blocking',
    orphanProjectMemberSkillsSkill,
  ),
  toInvariant(
    'confirmed_project_members_missing_members',
    'blocking',
    confirmedProjectMembersMissingMembers,
  ),
  toInvariant(
    'legacy_placeholder_members_still_referenced',
    'blocking',
    legacyPlaceholderMembersStillReferenced,
  ),
  toInvariant(
    'active_legacy_placeholder_members_hidden_from_master_views',
    'informational',
    activeLegacyPlaceholderMembers,
  ),
];

const report = {
  audited_at: new Date().toISOString(),
  project_ref: projectRef,
  source_url: url,
  summary: {
    blocking_failures: invariants.filter(
      (row) => row.severity === 'blocking' && row.count > 0,
    ).length,
    informational_findings: invariants.filter(
      (row) => row.severity === 'informational' && row.count > 0,
    ).length,
  },
  sections: {
    counts: invariants.map(({ invariant, severity, count }) => ({
      invariant,
      severity,
      count,
    })),
    samples: invariants
      .filter((row) => row.count > 0)
      .map(({ invariant, severity, sample_rows }) => ({
        invariant,
        severity,
        sample_rows,
      })),
  },
};

console.log(JSON.stringify(report, null, 2));

if (outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

const hasBlockingFailures = report.summary.blocking_failures > 0;
process.exit(hasBlockingFailures ? 2 : 0);
