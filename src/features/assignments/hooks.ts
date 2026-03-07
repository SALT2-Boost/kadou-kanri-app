import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertTables } from '@/shared/types/database';
import {
  confirmProjectMember,
  createProjectMember,
  deleteProjectMember,
  fetchActiveMembers,
  fetchProjectMembersByProject,
  updateProjectMemberProfile,
  upsertAssignment,
  upsertAssignmentsForRange,
} from './api';

export const assignmentKeys = {
  byProject: (id: string) => ['assignments', 'project', id] as const,
  activeMembers: ['assignments', 'active-members'] as const,
};

function invalidateRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['members'] });
  void queryClient.invalidateQueries({ queryKey: ['schedule'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  void queryClient.invalidateQueries({ queryKey: ['export'] });
}

export function useAssignmentsByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: assignmentKeys.byProject(projectId!),
    queryFn: () => fetchProjectMembersByProject(projectId!),
    enabled: !!projectId,
  });
}

export function useActiveMembers(enabled: boolean) {
  return useQuery({
    queryKey: assignmentKeys.activeMembers,
    queryFn: fetchActiveMembers,
    enabled,
  });
}

export function useCreateProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectMember,
    onSettled: (_data, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byProject(vars.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.activeMembers,
      });
      invalidateRelatedQueries(queryClient);
    },
  });
}

export function useUpdateProjectMemberProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProjectMemberProfile,
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['assignments'],
      });
      invalidateRelatedQueries(queryClient);
    },
  });
}

export function useConfirmProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectMemberId, memberId }: { projectMemberId: string; memberId: string }) =>
      confirmProjectMember(projectMemberId, memberId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.activeMembers,
      });
      invalidateRelatedQueries(queryClient);
    },
  });
}

export function useUpsertAssignmentsForRange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertAssignmentsForRange,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      invalidateRelatedQueries(queryClient);
    },
  });
}

export function useUpsertAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertTables<'assignments'>) => upsertAssignment(data),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      invalidateRelatedQueries(queryClient);
    },
  });
}

export function useDeleteProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProjectMember,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.activeMembers,
      });
      invalidateRelatedQueries(queryClient);
    },
  });
}
