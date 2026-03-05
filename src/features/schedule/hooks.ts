import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { fetchPeriodView, fetchMonthlyView } from './api';
import type { PeriodMember, PeriodCell } from './api';
import { transformToMonthlyView } from './transforms';
import type { ScheduleRow } from './types';

export const scheduleKeys = {
  period: (start: string, end: string) => ['schedule', 'period', start, end] as const,
  monthly: (month: string) => ['schedule', 'monthly', month] as const,
  skills: ['schedule', 'skills'] as const,
};

// 期間ビュー: DB集約済みなのでtransformは単純なマッピングのみ
function buildScheduleRows(members: PeriodMember[], cells: PeriodCell[]): ScheduleRow[] {
  const cellMap = new Map<string, Map<string, number>>();
  for (const c of cells) {
    let memberCells = cellMap.get(c.member_id);
    if (!memberCells) {
      memberCells = new Map();
      cellMap.set(c.member_id, memberCells);
    }
    memberCells.set(c.month, c.total);
  }

  return members.map((m) => {
    const memberCells = cellMap.get(m.id);
    const months: ScheduleRow['months'] = {};
    if (memberCells) {
      for (const [month, total] of memberCells) {
        months[month] = { totalPercentage: total, assignments: [] };
      }
    }
    return {
      memberId: m.id,
      memberName: m.name,
      category: m.category,
      skills: m.skills,
      months,
    };
  });
}

export function usePeriodView(startMonth: string, endMonth: string) {
  return useQuery({
    queryKey: scheduleKeys.period(startMonth, endMonth),
    queryFn: () => fetchPeriodView(startMonth, endMonth),
    select: (data) => ({
      rows: buildScheduleRows(data.members, data.cells),
      skills: data.skills,
    }),
  });
}

export function useMonthlyView(month: string) {
  return useQuery({
    queryKey: scheduleKeys.monthly(month),
    queryFn: () => fetchMonthlyView(month),
    select: (data) => transformToMonthlyView(data.members, data.assignments),
  });
}

export function useAllSkills() {
  return useQuery({
    queryKey: scheduleKeys.skills,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}
