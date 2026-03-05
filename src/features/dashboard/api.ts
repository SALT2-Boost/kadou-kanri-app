import { supabase } from '@/shared/lib/supabase';

interface RevenueAssignment {
  month: string;
  project_id: string;
  projects: {
    monthly_revenue: number | null;
    status: '確定' | '提案済' | '提案';
  } | null;
}

interface OverloadAssignment {
  member_id: string;
  month: string;
  percentage: number | null;
  members: {
    name: string;
  } | null;
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
    .select('member_id, month, percentage, members(name)')
    .gte('month', startMonth)
    .lte('month', endMonth);
  if (error) throw error;
  return data as OverloadAssignment[];
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
      .order('name'),
    supabase
      .from('assignments')
      .select('member_id')
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
