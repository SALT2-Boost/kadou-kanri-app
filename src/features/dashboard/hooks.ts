import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyRevenue, fetchOverloadAlerts, fetchUnassignedMembers } from './api';
import { transformRevenueData, transformOverloadAlerts, transformUnassignedMembers } from './transforms';

export const dashboardKeys = {
  revenue: ['dashboard', 'revenue'] as const,
  overload: ['dashboard', 'overload'] as const,
  unassigned: ['dashboard', 'unassigned'] as const,
};

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: dashboardKeys.revenue,
    queryFn: fetchMonthlyRevenue,
    select: transformRevenueData,
  });
}

export function useOverloadAlerts() {
  return useQuery({
    queryKey: dashboardKeys.overload,
    queryFn: fetchOverloadAlerts,
    select: transformOverloadAlerts,
  });
}

export function useUnassignedMembers() {
  return useQuery({
    queryKey: dashboardKeys.unassigned,
    queryFn: fetchUnassignedMembers,
    select: transformUnassignedMembers,
  });
}
