import { supabase } from '@/shared/lib/supabase';
import { isUnconfirmedProjectMember } from '@/shared/lib/projectMembers';

interface RevenueAssignment {
  month: string;
  project_id: string;
  projects: {
    monthly_revenue: number | null;
    status: '確定' | '提案済' | '提案予定';
  } | null;
}

interface OverloadQueryRow {
  member_id: string | null;
  month: string;
  percentage: number | null;
  project_members: {
    name: string;
    member_id: string | null;
    members: {
      category: string | null;
    } | null;
  } | null;
}

export interface OverloadAssignment {
  member_id: string | null;
  month: string;
  percentage: number | null;
  member_name: string;
  is_unconfirmed: boolean;
}

function getDefaultDateRange() {
  const now = new Date();
  const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 6);
  const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`;
  return { startMonth, endMonth };
}

export async function fetchMonthlyRevenue(): Promise<RevenueAssignment[]> {
  const { startMonth, endMonth } = getDefaultDateRange();
  const { data, error } = await supabase
    .from('assignments')
    .select('month, project_id, projects(monthly_revenue, status)')
    .gte('month', startMonth)
    .lte('month', endMonth)
    .order('month');
  if (error) throw error;
  return data as RevenueAssignment[];
}

export async function fetchOverloadAlerts(): Promise<OverloadAssignment[]> {
  const { startMonth, endMonth } = getDefaultDateRange();
  const { data, error } = await supabase
    .from('assignments')
    .select('member_id, month, percentage, project_members(name, member_id, members(category))')
    .gte('month', startMonth)
    .lte('month', endMonth);
  if (error) throw error;

  return ((data ?? []) as OverloadQueryRow[]).map((row) => ({
    member_id: row.member_id,
    month: row.month,
    percentage: row.percentage,
    member_name: row.project_members?.name ?? '不明',
    is_unconfirmed: row.project_members
      ? isUnconfirmedProjectMember(row.project_members)
      : row.member_id === null,
  }));
}

interface UnassignedResult {
  members: Array<{ id: string; name: string; category: string }>;
  assignments: Array<{ member_id: string }>;
  startMonth: string;
  endMonth: string;
}

export async function fetchUnassignedMembers(): Promise<UnassignedResult> {
  const now = new Date();
  const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 3);
  const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`;

  const [membersResult, assignmentsResult] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, category')
      .eq('is_active', true)
      .eq('is_placeholder', false)
      .neq('category', '未定枠')
      .order('name'),
    supabase
      .from('assignments')
      .select('member_id')
      .not('member_id', 'is', null)
      .gte('month', startMonth)
      .lte('month', endMonth),
  ]);
  if (membersResult.error) throw membersResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;

  return {
    members: membersResult.data as Array<{ id: string; name: string; category: string }>,
    assignments: assignmentsResult.data as Array<{ member_id: string }>,
    startMonth,
    endMonth,
  };
}
