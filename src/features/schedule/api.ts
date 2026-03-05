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

// 期間ビュー用: メンバー × 月の稼働集計（RPC で 2 往復に削減）
export async function fetchMemberSchedule(startMonth: string, endMonth: string) {
  const [membersResult, assignmentsResult] = await Promise.all([
    supabase.rpc('get_members_with_skills'),
    supabase.rpc('get_assignments_for_period', {
      start_month: startMonth,
      end_month: endMonth,
    }),
  ]);
  if (membersResult.error) throw membersResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;

  return {
    members: membersResult.data as MemberWithSkills[],
    assignments: assignmentsResult.data as AssignmentWithProject[],
  };
}

// 月別ビュー用: 特定月のメンバー × 案件（RPC で 2 往復に削減）
export async function fetchMonthlyView(month: string) {
  const [membersResult, assignmentsResult] = await Promise.all([
    supabase.rpc('get_members_with_skills'),
    supabase.rpc('get_assignments_for_month', {
      target_month: month,
    }),
  ]);
  if (membersResult.error) throw membersResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;

  return {
    members: membersResult.data as MemberWithSkills[],
    assignments: assignmentsResult.data as MonthlyAssignmentWithProject[],
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
