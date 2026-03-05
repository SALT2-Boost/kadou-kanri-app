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
  members: { name: string } | null;
}

interface UnassignedInput {
  members: Array<{ id: string; name: string; category: string }>;
  assignments: Array<{ member_id: string }>;
}

export interface RevenueRow {
  month: string;
  confirmed: number;
  proposed: number;
  draft: number;
}

export interface OverloadAlert {
  memberName: string;
  month: string;
  totalPercentage: number;
}

export interface UnassignedMember {
  id: string;
  name: string;
  category: string;
}

export function transformRevenueData(data: RevenueAssignment[]): RevenueRow[] {
  const seen = new Set<string>();
  const monthMap = new Map<string, { confirmed: number; proposed: number; draft: number }>();

  for (const row of data) {
    const key = `${row.month}_${row.project_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const revenue = row.projects?.monthly_revenue ?? 0;
    const status = row.projects?.status;

    if (!monthMap.has(row.month)) {
      monthMap.set(row.month, { confirmed: 0, proposed: 0, draft: 0 });
    }
    const entry = monthMap.get(row.month)!;

    if (status === '確定') entry.confirmed += revenue;
    else if (status === '提案済') entry.proposed += revenue;
    else if (status === '提案') entry.draft += revenue;
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({ month, ...values }));
}

export function transformOverloadAlerts(data: OverloadAssignment[]): OverloadAlert[] {
  const grouped = new Map<string, { memberName: string; month: string; total: number }>();

  for (const row of data) {
    const key = `${row.member_id}_${row.month}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        memberName: row.members?.name ?? '不明',
        month: row.month,
        total: 0,
      });
    }
    grouped.get(key)!.total += row.percentage ?? 0;
  }

  return Array.from(grouped.values())
    .filter((entry) => entry.total > 100)
    .sort((a, b) => a.month.localeCompare(b.month) || a.memberName.localeCompare(b.memberName))
    .map((entry) => ({
      memberName: entry.memberName,
      month: entry.month,
      totalPercentage: entry.total,
    }));
}

export function transformUnassignedMembers(data: UnassignedInput): UnassignedMember[] {
  const assignedIds = new Set(data.assignments.map((a) => a.member_id));
  return data.members.filter((m) => !assignedIds.has(m.id));
}
