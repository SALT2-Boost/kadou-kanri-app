import type { Tables } from '@/shared/types/database';

export type Member = Tables<'members'>;
export type Skill = Tables<'skills'>;
export type MemberSkill = Tables<'member_skills'>;
export type MemberScheduleAssignment = {
  project_id: string;
  month: string;
  percentage: number | null;
  projects: {
    id: string;
    name: string;
  } | null;
};

export interface MemberScheduleRow {
  projectId: string;
  projectName: string;
  months: Record<string, number>;
}

export interface MemberWithSkills extends Member {
  member_skills: Array<{ skill_id: string; skills: Skill }>;
}
