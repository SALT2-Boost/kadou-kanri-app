import type { ScheduleRow, ScheduleCell, MonthlyViewRow, MonthlyViewProject } from './types';

interface MemberData {
  id: string;
  name: string;
  category: '社員' | '入社予定' | 'インターン';
  member_skills: Array<{ skill_id: string; skills: { name: string } }>;
}

interface AssignmentData {
  member_id: string;
  project_id: string;
  month: string;
  percentage: number | null;
  projects: { id: string; name: string };
}

interface MonthlyAssignmentData {
  member_id: string;
  project_id: string;
  percentage: number | null;
  projects: { id: string; name: string };
}

export function transformToScheduleRows(
  members: MemberData[],
  assignments: AssignmentData[],
): ScheduleRow[] {
  return members.map((member) => {
    const memberAssignments = assignments.filter(
      (a) => a.member_id === member.id,
    );

    const months: Record<string, ScheduleCell> = {};

    for (const assignment of memberAssignments) {
      const month = assignment.month;
      if (!months[month]) {
        months[month] = { totalPercentage: 0, assignments: [] };
      }
      const pct = assignment.percentage ?? 0;
      months[month].totalPercentage += pct;
      months[month].assignments.push({
        projectId: assignment.project_id,
        projectName: assignment.projects?.name ?? '',
        percentage: pct,
      });
    }

    return {
      memberId: member.id,
      memberName: member.name,
      category: member.category,
      skills: member.member_skills.map((ms) => ms.skills?.name ?? '').filter(Boolean),
      months,
    };
  });
}

export function transformToMonthlyView(
  members: MemberData[],
  assignments: MonthlyAssignmentData[],
): { rows: MonthlyViewRow[]; projects: MonthlyViewProject[] } {
  const projectMap = new Map<string, MonthlyViewProject>();
  for (const a of assignments) {
    if (a.projects && !projectMap.has(a.project_id)) {
      projectMap.set(a.project_id, { id: a.projects.id, name: a.projects.name });
    }
  }
  const projects = Array.from(projectMap.values());

  const rows: MonthlyViewRow[] = members.map((member) => {
    const memberAssignments = assignments.filter(
      (a) => a.member_id === member.id,
    );
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
      skills: member.member_skills.map((ms) => ms.skills?.name ?? '').filter(Boolean),
      projects: projectPercentages,
      totalPercentage,
    };
  });

  return { rows, projects };
}
