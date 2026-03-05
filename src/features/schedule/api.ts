import { supabase } from '@/shared/lib/supabase';

interface MemberWithSkills {
  id: string;
  name: string;
  category: '社員' | '入社予定' | 'インターン';
  member_skills: Array<{
    skill_id: string;
    skills: { name: string };
  }>;
}

interface AssignmentWithProject {
  member_id: string;
  project_id: string;
  month: string;
  percentage: number | null;
  projects: { id: string; name: string };
}

interface MonthlyAssignmentWithProject {
  member_id: string;
  project_id: string;
  percentage: number | null;
  projects: { id: string; name: string };
}

// 期間ビュー用: メンバー × 月の稼働集計
export async function fetchMemberSchedule(startMonth: string, endMonth: string) {
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('id, name, category, member_skills(skill_id, skills(name))')
    .eq('is_active', true)
    .order('category')
    .order('name');
  if (memberError) throw memberError;

  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('member_id, project_id, month, percentage, projects(id, name)')
    .gte('month', startMonth)
    .lte('month', endMonth);
  if (assignError) throw assignError;

  return {
    members: members as unknown as MemberWithSkills[],
    assignments: assignments as unknown as AssignmentWithProject[],
  };
}

// 月別ビュー用: 特定月のメンバー × 案件
export async function fetchMonthlyView(month: string) {
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('id, name, category, member_skills(skill_id, skills(name))')
    .eq('is_active', true)
    .order('category')
    .order('name');
  if (memberError) throw memberError;

  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('member_id, project_id, percentage, projects(id, name)')
    .eq('month', month);
  if (assignError) throw assignError;

  return {
    members: members as unknown as MemberWithSkills[],
    assignments: assignments as unknown as MonthlyAssignmentWithProject[],
  };
}

// スキル一覧取得
export async function fetchAllSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name')
    .order('name');
  if (error) throw error;
  return data;
}
