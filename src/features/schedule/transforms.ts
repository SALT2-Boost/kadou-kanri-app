import type { MemberWithSkills, ProjectMemberWithAssignments } from './api';
import type { MonthlyViewProject, MonthlyViewRow, ScheduleRow } from './types';
import { isUnconfirmedProjectMember } from '@/shared/lib/projectMembers';

interface ScheduleFilterInput {
  categories: string[];
  selectedSkills: string[];
  searchText: string;
  onlyUnconfirmed: boolean;
}

function toSortedUnique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ja'));
}

export function buildPeriodRows(
  members: MemberWithSkills[],
  projectMembers: ProjectMemberWithAssignments[],
): ScheduleRow[] {
  const rows = new Map<string, ScheduleRow>();

  for (const member of members) {
    rows.set(member.id, {
      rowId: member.id,
      memberId: member.id,
      memberName: member.name,
      category: member.category,
      isUnconfirmed: false,
      skills: toSortedUnique(member.skills.map((skill) => skill.name)),
      months: {},
    });
  }

  for (const projectMember of projectMembers) {
    const projectSkillNames = projectMember.project_member_skills.map((link) => link.skills.name);
    const treatAsUnconfirmed = isUnconfirmedProjectMember(projectMember);

    if (!treatAsUnconfirmed && projectMember.member_id) {
      const key = projectMember.member_id;
      const existing =
        rows.get(key) ??
        ({
          rowId: key,
          memberId: key,
          memberName: projectMember.members?.name ?? projectMember.name,
          category: projectMember.members?.category ?? '社員',
          isUnconfirmed: false,
          skills: [],
          months: {},
        } satisfies ScheduleRow);

      existing.skills = toSortedUnique([...existing.skills, ...projectSkillNames]);

      for (const assignment of projectMember.assignments) {
        const cell = existing.months[assignment.month] ?? {
          confirmedPercentage: 0,
          totalPercentage: 0,
          assignments: [],
        };
        const percentage = assignment.percentage ?? 0;
        const isConfirmedProject = projectMember.projects.status === '確定';
        cell.confirmedPercentage += isConfirmedProject ? percentage : 0;
        cell.totalPercentage += percentage;
        cell.assignments.push({
          projectId: projectMember.project_id,
          projectName: projectMember.projects.name,
          projectStatus: projectMember.projects.status,
          percentage,
        });
        existing.months[assignment.month] = cell;
      }

      rows.set(key, existing);
      continue;
    }

    const row: ScheduleRow = {
      rowId: projectMember.id,
      memberId: null,
      memberName: projectMember.name,
      category: '未定枠',
      isUnconfirmed: true,
      skills: toSortedUnique(projectSkillNames),
      months: {},
    };

    for (const assignment of projectMember.assignments) {
      const percentage = assignment.percentage ?? 0;
      const isConfirmedProject = projectMember.projects.status === '確定';
      row.months[assignment.month] = {
        confirmedPercentage: isConfirmedProject ? percentage : 0,
        totalPercentage: percentage,
        assignments: [
          {
            projectId: projectMember.project_id,
            projectName: projectMember.projects.name,
            projectStatus: projectMember.projects.status,
            percentage,
          },
        ],
      };
    }

    rows.set(projectMember.id, row);
  }

  return Array.from(rows.values()).sort((a, b) => a.memberName.localeCompare(b.memberName, 'ja'));
}

export function transformToMonthlyView(
  members: MemberWithSkills[],
  projectMembers: ProjectMemberWithAssignments[],
): { rows: MonthlyViewRow[]; projects: MonthlyViewProject[] } {
  const projectMap = new Map<string, MonthlyViewProject>();
  const rows = new Map<string, MonthlyViewRow>();

  for (const member of members) {
    rows.set(member.id, {
      rowId: member.id,
      memberId: member.id,
      memberName: member.name,
      category: member.category,
      isUnconfirmed: false,
      skills: toSortedUnique(member.skills.map((skill) => skill.name)),
      projects: {},
      confirmedTotalPercentage: 0,
      totalPercentage: 0,
    });
  }

  for (const projectMember of projectMembers) {
    projectMap.set(projectMember.project_id, {
      id: projectMember.project_id,
      name: projectMember.projects.name,
      status: projectMember.projects.status,
    });

    const skillNames = projectMember.project_member_skills.map((link) => link.skills.name);
    const total = projectMember.assignments.reduce(
      (sum, assignment) => sum + (assignment.percentage ?? 0),
      0,
    );
    const confirmedTotal = projectMember.projects.status === '確定' ? total : 0;
    const treatAsUnconfirmed = isUnconfirmedProjectMember(projectMember);

    if (!treatAsUnconfirmed && projectMember.member_id) {
      const key = projectMember.member_id;
      const existing =
        rows.get(key) ??
        ({
          rowId: key,
          memberId: key,
          memberName: projectMember.members?.name ?? projectMember.name,
          category: projectMember.members?.category ?? '社員',
          isUnconfirmed: false,
          skills: [],
          projects: {},
          confirmedTotalPercentage: 0,
          totalPercentage: 0,
        } satisfies MonthlyViewRow);

      existing.skills = toSortedUnique([...existing.skills, ...skillNames]);
      existing.projects[projectMember.project_id] =
        (existing.projects[projectMember.project_id] ?? 0) + total;
      existing.confirmedTotalPercentage += confirmedTotal;
      existing.totalPercentage += total;

      rows.set(key, existing);
      continue;
    }

    rows.set(projectMember.id, {
      rowId: projectMember.id,
      memberId: null,
      memberName: projectMember.name,
      category: '未定枠',
      isUnconfirmed: true,
      skills: toSortedUnique(skillNames),
      projects: {
        [projectMember.project_id]: total,
      },
      confirmedTotalPercentage: confirmedTotal,
      totalPercentage: total,
    });
  }

  return {
    rows: Array.from(rows.values()).sort((a, b) => a.memberName.localeCompare(b.memberName, 'ja')),
    projects: Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja')),
  };
}

export function filterScheduleRows<
  T extends {
    memberName: string;
    category: string;
    skills: string[];
    isUnconfirmed: boolean;
  },
>(rows: T[], filters: ScheduleFilterInput): T[] {
  const categorySet = new Set(filters.categories);
  const skillSet = new Set(filters.selectedSkills);
  const searchText = filters.searchText.trim();

  return rows.filter((row) => {
    if (!categorySet.has(row.category)) return false;
    if (filters.onlyUnconfirmed && !row.isUnconfirmed) return false;
    if (searchText && !row.memberName.includes(searchText)) return false;
    if (skillSet.size > 0 && !row.skills.some((skill) => skillSet.has(skill))) {
      return false;
    }
    return true;
  });
}
