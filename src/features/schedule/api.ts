import { supabase } from '@/shared/lib/supabase';

export interface MemberWithSkills {
  id: string;
  name: string;
  category: '社員' | '入社予定' | 'インターン' | '未定枠';
  skills: Array<{ skill_id: string; name: string }>;
}

export interface ProjectMemberWithAssignments {
  id: string;
  project_id: string;
  member_id: string | null;
  name: string;
  role: string;
  projects: {
    id: string;
    name: string;
    status: '確定' | '提案済' | '提案予定';
  };
  members: {
    id: string;
    name: string;
    category: '社員' | '入社予定' | 'インターン' | '未定枠';
  } | null;
  project_member_skills: Array<{
    skill_id: string;
    skills: {
      id: string;
      name: string;
    };
  }>;
  assignments: Array<{
    id: string;
    project_member_id: string;
    month: string;
    percentage: number | null;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

async function fetchActiveMembers(): Promise<MemberWithSkills[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, category, member_skills(skill_id, skills(id, name))')
    .eq('is_active', true)
    .eq('is_placeholder', false)
    .neq('category', '未定枠')
    .order('name');

  if (error) throw error;

  return (
    (data ?? []) as Array<{
      id: string;
      name: string;
      category: '社員' | '入社予定' | 'インターン' | '未定枠';
      member_skills: Array<{
        skill_id: string;
        skills: { id: string; name: string };
      }>;
    }>
  ).map((member) => ({
    id: member.id,
    name: member.name,
    category: member.category,
    skills: member.member_skills.map((link) => ({
      skill_id: link.skill_id,
      name: link.skills.name,
    })),
  }));
}

async function fetchProjectMembersWithAssignments(
  startMonth: string,
  endMonth: string,
): Promise<ProjectMemberWithAssignments[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      'id, project_id, member_id, name, role, projects(id, name, status), members(id, name, category), project_member_skills(skill_id, skills(id, name)), assignments!inner(id, project_member_id, month, percentage, note, created_at, updated_at)',
    )
    .gte('assignments.month', startMonth)
    .lte('assignments.month', endMonth)
    .order('name')
    .order('month', { foreignTable: 'assignments', ascending: true });

  if (error) throw error;
  return data as unknown as ProjectMemberWithAssignments[];
}

export async function fetchPeriodView(startMonth: string, endMonth: string) {
  const [members, projectMembers] = await Promise.all([
    fetchActiveMembers(),
    fetchProjectMembersWithAssignments(startMonth, endMonth),
  ]);

  return { members, projectMembers };
}

export async function fetchMonthlyView(month: string) {
  const [members, projectMembers] = await Promise.all([
    fetchActiveMembers(),
    fetchProjectMembersWithAssignments(month, month),
  ]);

  return { members, projectMembers };
}
