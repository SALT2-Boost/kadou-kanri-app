export interface ScheduleRow {
  memberId: string;
  memberName: string;
  category: '社員' | '入社予定' | 'インターン';
  skills: string[];
  months: Record<string, ScheduleCell>; // key: '2026-03-01'
}

export interface ScheduleCell {
  totalPercentage: number;
  assignments: Array<{
    projectId: string;
    projectName: string;
    percentage: number;
  }>;
}

export interface MonthlyViewRow {
  memberId: string;
  memberName: string;
  category: '社員' | '入社予定' | 'インターン';
  skills: string[];
  projects: Record<string, number>; // key: projectId, value: percentage
  totalPercentage: number;
}

export interface MonthlyViewProject {
  id: string;
  name: string;
}
