import type { MemberScheduleAssignment, MemberScheduleRow } from './types';

export function buildMemberScheduleRows(
  assignments: MemberScheduleAssignment[],
  months: string[],
): MemberScheduleRow[] {
  const rows = new Map<string, MemberScheduleRow>();

  for (const assignment of assignments) {
    if (!assignment.projects) continue;

    const existing =
      rows.get(assignment.project_id) ??
      ({
        projectId: assignment.project_id,
        projectName: assignment.projects.name,
        months: Object.fromEntries(months.map((month) => [month, 0])),
      } satisfies MemberScheduleRow);

    existing.months[assignment.month] =
      (existing.months[assignment.month] ?? 0) + (assignment.percentage ?? 0);
    rows.set(assignment.project_id, existing);
  }

  return Array.from(rows.values()).sort((a, b) => a.projectName.localeCompare(b.projectName, 'ja'));
}
