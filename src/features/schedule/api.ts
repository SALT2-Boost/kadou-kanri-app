import { supabase } from '@/shared/lib/supabase';

// === 期間ビュー用の型 ===

export interface PeriodMember {
  id: string;
  name: string;
  category: '社員' | '入社予定' | 'インターン' | '未定枠';
  skills: string[]; // スキル名の配列（skill_id不要）
}

export interface PeriodCell {
  member_id: string;
  month: string;
  total: number;
}

interface PeriodViewResponse {
  members: PeriodMember[];
  cells: PeriodCell[];
  skills: string[];
}

// === 月別ビュー用の型（従来通り案件詳細が必要） ===

export interface MemberWithSkills {
  id: string;
  name: string;
  category: '社員' | '入社予定' | 'インターン' | '未定枠';
  skills: Array<{ skill_id: string; name: string }>;
}

export interface MonthlyAssignmentWithProject {
  member_id: string;
  project_id: string;
  percentage: number | null;
  project_name: string;
}

// 期間ビュー用: 1回のRPCで集約済みデータを取得
export async function fetchPeriodView(startMonth: string, endMonth: string): Promise<PeriodViewResponse> {
  const { data, error } = await supabase.rpc('get_period_view', {
    p_start: startMonth,
    p_end: endMonth,
  });
  if (error) throw error;
  const result = data as unknown as PeriodViewResponse;
  return {
    members: result.members ?? [],
    cells: result.cells ?? [],
    skills: result.skills ?? [],
  };
}

// 月別ビュー用: RPC 2本を並列実行（案件ごとの内訳が必要なため）
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
