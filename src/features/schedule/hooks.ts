import { useQuery } from '@tanstack/react-query';
import { fetchMemberSchedule, fetchMonthlyView, fetchAllSkills } from './api';
import { transformToScheduleRows, transformToMonthlyView } from './transforms';

export const scheduleKeys = {
  period: (start: string, end: string) => ['schedule', 'period', start, end] as const,
  monthly: (month: string) => ['schedule', 'monthly', month] as const,
  skills: ['schedule', 'skills'] as const,
};

export function useMemberSchedule(startMonth: string, endMonth: string) {
  return useQuery({
    queryKey: scheduleKeys.period(startMonth, endMonth),
    queryFn: () => fetchMemberSchedule(startMonth, endMonth),
    select: (data) => transformToScheduleRows(data.members, data.assignments),
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
    queryFn: fetchAllSkills,
  });
}
