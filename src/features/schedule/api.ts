import { supabase } from '@/shared/lib/supabase';

export interface MemberWithSkills {
  id: string;
  name: string;
  category: '社員' | '入社予定' | 'インターン' | '未定枠';
  skills: Array<{ skill_id: string; name: string }>;
}

export interface AssignmentWithProject {
  member_id: string;
  project_id: string;
  month: string;
  percentage: number | null;
  project_name: string;
}

export interface MonthlyAssignmentWithProject {
  member_id: string;
  project_id: string;
  percentage: number | null;
  project_name: string;
}

// 期間ビュー用: RPC 2本を並列実行（各RPC内でJOIN済みなのでPostgRESTのネストJOINを回避）
export async function fetchMemberSchedule(startMonth: string, endMonth: string) {
  const [membersResult, assignmentsResult] = await Promise.all([
    supabase.rpc('get_members_with_skills'),
    supabase.rpc('get_assignments_in_range', {
      p_start: startMonth,
      p_end: endMonth,
    }),
  ]);
  if (membersResult.error) throw membersResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;

  return {
    members: membersResult.data as unknown as MemberWithSkills[],
    assignments: assignmentsResult.data as unknown as AssignmentWithProject[],
  };
}

// 月別ビュー用: RPC 2本を並列実行
export async function fetchMonthlyView(month: string) {
  const [membersResult, assignmentsResult] = await Promise.all([
    supabase.rpc('get_members_with_skills'),
    supabase.rpc('get_assignments_in_month', {
      p_month: month,
    }),
  ]);
  if (membersResult.error) throw membersResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;

  return {
    members: membersResult.data as unknown as MemberWithSkills[],
    assignments: assignmentsResult.data as unknown as MonthlyAssignmentWithProject[],
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
