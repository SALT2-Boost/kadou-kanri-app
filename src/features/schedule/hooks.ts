import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { fetchPeriodView, fetchMonthlyView } from './api';
import { buildPeriodRows, transformToMonthlyView } from './transforms';

export const scheduleKeys = {
  period: (start: string, end: string) => ['schedule', 'period', start, end] as const,
  monthly: (month: string) => ['schedule', 'monthly', month] as const,
  skills: ['schedule', 'skills'] as const,
};

export function usePeriodView(startMonth: string, endMonth: string) {
  return useQuery({
    queryKey: scheduleKeys.period(startMonth, endMonth),
    queryFn: () => fetchPeriodView(startMonth, endMonth),
    select: (data) => ({
      rows: buildPeriodRows(data.members, data.projectMembers),
    }),
  });
}

export function useMonthlyView(month: string) {
  return useQuery({
    queryKey: scheduleKeys.monthly(month),
    queryFn: () => fetchMonthlyView(month),
    select: (data) => transformToMonthlyView(data.members, data.projectMembers),
  });
}

export function useAllSkills() {
  return useQuery({
    queryKey: scheduleKeys.skills,
    queryFn: async () => {
      const { data, error } = await supabase.from('skills').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });
}
