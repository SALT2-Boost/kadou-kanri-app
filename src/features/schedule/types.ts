export type ScheduleProjectStatus = '確定' | '提案済' | '提案予定';

export interface ScheduleBaseRow {
  rowId: string;
  memberId: string | null;
  memberName: string;
  category: '社員' | '入社予定' | 'インターン' | '未定枠';
  isUnconfirmed: boolean;
  skills: string[];
}

export interface ScheduleRow extends ScheduleBaseRow {
  months: Record<string, ScheduleCell>;
}

export interface ScheduleCell {
  confirmedPercentage: number;
  totalPercentage: number;
  assignments: Array<{
    projectId: string;
    projectName: string;
    projectStatus: ScheduleProjectStatus;
    percentage: number;
  }>;
}

export interface MonthlyViewRow extends ScheduleBaseRow {
  projects: Record<string, number>;
  confirmedTotalPercentage: number;
  totalPercentage: number;
}

export interface MonthlyViewProject {
  id: string;
  name: string;
  status: ScheduleProjectStatus;
}
