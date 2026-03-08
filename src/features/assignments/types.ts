import type { Tables } from '@/shared/types/database';

export type Assignment = Tables<'assignments'>;
export type ProjectMember = Tables<'project_members'>;

export interface ProjectMemberSkillLink {
  skill_id: string;
  skills: {
    id: string;
    name: string;
  };
}

export interface ProjectMemberMemberLink {
  id: string;
  name: string;
  category: '社員' | '入社予定' | 'インターン' | '未定枠';
}

export interface ProjectMemberWithAssignments extends ProjectMember {
  members: ProjectMemberMemberLink | null;
  project_member_skills: ProjectMemberSkillLink[];
  assignments: Assignment[];
}

export interface ActiveMember {
  id: string;
  name: string;
  category: '社員' | '入社予定' | 'インターン' | '未定枠';
  member_skills: ProjectMemberSkillLink[];
}

export interface ProjectMemberRow {
  projectMemberId: string;
  memberId: string | null;
  memberName: string;
  role: string;
  isUnconfirmed: boolean;
  skillNames: string[];
  note: string | null;
  cells: Map<string, { assignmentId: string; percentage: number | null }>;
}
