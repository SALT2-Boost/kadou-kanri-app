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

export async function fetchMonthlyRevenue(): Promise<RevenueAssignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('month, project_id, projects(monthly_revenue, status)')
    .order('month');
  if (error) throw error;
  return data as RevenueAssignment[];
}

export async function fetchOverloadAlerts(): Promise<OverloadAssignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('member_id, month, percentage, members(name)');
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
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('id, name, category')
    .eq('is_active', true)
    .order('name');
  if (memberError) throw memberError;

  const now = new Date();
  const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 3);
  const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`;

  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('member_id')
    .gte('month', startMonth)
    .lte('month', endMonth);
  if (assignError) throw assignError;

  return {
    members: members as Array<{ id: string; name: string; category: string }>,
    assignments: assignments as Array<{ member_id: string }>,
    startMonth,
    endMonth,
  };
}
