import { useQuery } from '@tanstack/react-query';
import { fetchAllMembers, fetchAllProjects, fetchAllAssignments, fetchAllSkills } from './api';

const exportKeys = {
  members: ['export', 'members'] as const,
  projects: ['export', 'projects'] as const,
  assignments: ['export', 'assignments'] as const,
  skills: ['export', 'skills'] as const,
};

export function useExportMembers(enabled: boolean) {
  return useQuery({
    queryKey: exportKeys.members,
    queryFn: fetchAllMembers,
    enabled,
  });
}

export function useExportProjects(enabled: boolean) {
  return useQuery({
    queryKey: exportKeys.projects,
    queryFn: fetchAllProjects,
    enabled,
  });
}

export function useExportAssignments(enabled: boolean) {
  return useQuery({
    queryKey: exportKeys.assignments,
    queryFn: fetchAllAssignments,
    enabled,
  });
}

export function useExportSkills(enabled: boolean) {
  return useQuery({
    queryKey: exportKeys.skills,
    queryFn: fetchAllSkills,
    enabled,
  });
}
