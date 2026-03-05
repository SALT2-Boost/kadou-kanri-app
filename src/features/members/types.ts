import type { Tables } from '@/shared/types/database';

export type Member = Tables<'members'>;
export type Skill = Tables<'skills'>;
export type MemberSkill = Tables<'member_skills'>;

export interface MemberWithSkills extends Member {
  member_skills: Array<{ skill_id: string; skills: Skill }>;
}
