import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMembers,
  fetchMember,
  fetchSkills,
  createMember,
  updateMember,
  deleteMember,
  updateMemberSkills,
} from './api';
import type { InsertTables, UpdateTables } from '@/shared/types/database';
import type { MemberWithSkills } from './types';

export const memberKeys = {
  all: ['members'] as const,
  detail: (id: string) => ['members', id] as const,
  skills: ['skills'] as const,
};

export function useMembers() {
  return useQuery({
    queryKey: memberKeys.all,
    queryFn: fetchMembers,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => fetchMember(id),
    enabled: !!id,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: memberKeys.skills,
    queryFn: fetchSkills,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InsertTables<'members'>) => createMember(input),
    onMutate: async (newMember) => {
      await queryClient.cancelQueries({ queryKey: memberKeys.all });
      const previous = queryClient.getQueryData<MemberWithSkills[]>(memberKeys.all);

      queryClient.setQueryData<MemberWithSkills[]>(memberKeys.all, (old) => {
        if (!old) return old;
        const optimistic: MemberWithSkills = {
          id: `temp-${Date.now()}`,
          name: newMember.name,
          category: newMember.category,
          note: newMember.note ?? null,
          join_date: newMember.join_date ?? null,
          is_active: true,
          is_placeholder: false,
          placeholder_project_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          member_skills: [],
        };
        return [...old, optimistic];
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(memberKeys.all, ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['export'] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTables<'members'> }) =>
      updateMember(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: memberKeys.all });
      await queryClient.cancelQueries({ queryKey: memberKeys.detail(id) });

      const previousList = queryClient.getQueryData<MemberWithSkills[]>(memberKeys.all);
      const previousDetail = queryClient.getQueryData<MemberWithSkills>(memberKeys.detail(id));

      // 楽観的更新: 一覧
      queryClient.setQueryData<MemberWithSkills[]>(memberKeys.all, (old) => {
        if (!old) return old;
        return old.map((m) => (m.id === id ? { ...m, ...input } : m));
      });

      // 楽観的更新: 詳細
      queryClient.setQueryData<MemberWithSkills>(memberKeys.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...input };
      });

      return { previousList, previousDetail };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.previousList) {
        queryClient.setQueryData(memberKeys.all, ctx.previousList);
      }
      if (ctx?.previousDetail) {
        queryClient.setQueryData(memberKeys.detail(id), ctx.previousDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
      void queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['export'] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: memberKeys.all });
      const previous = queryClient.getQueryData<MemberWithSkills[]>(memberKeys.all);

      queryClient.setQueryData<MemberWithSkills[]>(memberKeys.all, (old) => {
        if (!old) return old;
        return old.filter((m) => m.id !== id);
      });

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(memberKeys.all, ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['export'] });
    },
  });
}

export function useUpdateMemberSkills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, skillIds }: { memberId: string; skillIds: string[] }) =>
      updateMemberSkills(memberId, skillIds),
    onSettled: (_data, _err, { memberId }) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
      void queryClient.invalidateQueries({ queryKey: memberKeys.detail(memberId) });
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['export'] });
    },
  });
}
