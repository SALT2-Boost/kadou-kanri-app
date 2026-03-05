import type { MonthlyViewRow, MonthlyViewProject } from './types';
import type { MemberWithSkills, MonthlyAssignmentWithProject } from './api';

export function transformToMonthlyView(
  members: MemberWithSkills[],
  assignments: MonthlyAssignmentWithProject[],
): { rows: MonthlyViewRow[]; projects: MonthlyViewProject[] } {
  const projectMap = new Map<string, MonthlyViewProject>();
  for (const a of assignments) {
    if (!projectMap.has(a.project_id)) {
      projectMap.set(a.project_id, { id: a.project_id, name: a.project_name });
    }
  }
  const projects = Array.from(projectMap.values());

  const assignmentsByMember = new Map<string, MonthlyAssignmentWithProject[]>();
  for (const a of assignments) {
    const list = assignmentsByMember.get(a.member_id);
    if (list) {
      list.push(a);
    } else {
      assignmentsByMember.set(a.member_id, [a]);
    }
  }

  const rows: MonthlyViewRow[] = members.map((member) => {
    const memberAssignments = assignmentsByMember.get(member.id) ?? [];
    const projectPercentages: Record<string, number> = {};
    let totalPercentage = 0;

    for (const a of memberAssignments) {
      const pct = a.percentage ?? 0;
      projectPercentages[a.project_id] = pct;
      totalPercentage += pct;
    }

    return {
      memberId: member.id,
      memberName: member.name,
      category: member.category,
      skills: member.skills.map((s) => s.name).filter(Boolean),
      projects: projectPercentages,
      totalPercentage,
    };
  });

  return { rows, projects };
}
