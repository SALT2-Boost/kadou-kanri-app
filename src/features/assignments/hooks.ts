import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InsertTables } from '@/shared/types/database';
import {
  fetchAssignmentsByProject,
  fetchAssignmentsByMember,
  upsertAssignment,
  deleteAssignment,
  deleteAssignmentsByMemberAndProject,
} from './api';
import type { AssignmentWithMember } from './types';

export const assignmentKeys = {
  byProject: (id: string) => ['assignments', 'project', id] as const,
  byMember: (id: string) => ['assignments', 'member', id] as const,
};

export function useAssignmentsByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: assignmentKeys.byProject(projectId!),
    queryFn: () => fetchAssignmentsByProject(projectId!),
    enabled: !!projectId,
  });
}

export function useAssignmentsByMember(memberId: string | undefined) {
  return useQuery({
    queryKey: assignmentKeys.byMember(memberId!),
    queryFn: () => fetchAssignmentsByMember(memberId!),
    enabled: !!memberId,
  });
}

export function useUpsertAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertTables<'assignments'>) => upsertAssignment(data),
    onMutate: async (newData) => {
      const projectKey = assignmentKeys.byProject(newData.project_id);
      await queryClient.cancelQueries({ queryKey: projectKey });

      const previous =
        queryClient.getQueryData<AssignmentWithMember[]>(projectKey);

      queryClient.setQueryData<AssignmentWithMember[]>(projectKey, (old) => {
        if (!old) return old;
        const existing = old.find(
          (a) =>
            a.member_id === newData.member_id && a.month === newData.month
        );
        if (existing) {
          return old.map((a) =>
            a.member_id === newData.member_id && a.month === newData.month
              ? { ...a, percentage: newData.percentage ?? null }
              : a
          );
        }
        const optimistic: AssignmentWithMember = {
          id: `temp-${Date.now()}-${Math.random()}`,
          member_id: newData.member_id,
          project_id: newData.project_id,
          month: newData.month,
          percentage: newData.percentage ?? null,
          note: newData.note ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          members: { id: newData.member_id, name: '' },
        };
        return [...old, optimistic];
      });

      return { previous, projectId: newData.project_id };
    },
    onError: (_err, newData, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(
          assignmentKeys.byProject(newData.project_id),
          ctx.previous
        );
      }
    },
    onSettled: (_data, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byProject(vars.project_id),
      });
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byMember(vars.member_id),
      });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: string;
      projectId: string;
      memberId: string;
    }) => deleteAssignment(id),
    onSettled: (_data, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byProject(vars.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byMember(vars.memberId),
      });
    },
  });
}

export function useDeleteAssignmentsByMemberAndProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      projectId,
    }: {
      memberId: string;
      projectId: string;
    }) => deleteAssignmentsByMemberAndProject(memberId, projectId),
    onMutate: async ({ memberId, projectId }) => {
      const projectKey = assignmentKeys.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });

      const previous =
        queryClient.getQueryData<AssignmentWithMember[]>(projectKey);

      queryClient.setQueryData<AssignmentWithMember[]>(projectKey, (old) => {
        if (!old) return old;
        return old.filter((a) => a.member_id !== memberId);
      });

      return { previous, projectId };
    },
    onError: (_err, { projectId }, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(
          assignmentKeys.byProject(projectId),
          ctx.previous
        );
      }
    },
    onSettled: (_data, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byProject(vars.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byMember(vars.memberId),
      });
    },
  });
}
