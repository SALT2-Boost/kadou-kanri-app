import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InsertTables, UpdateTables } from '@/shared/types/database';
import {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
} from './api';
import type { Project } from './types';

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: fetchProjects,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn: () => fetchProject(id!),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertTables<'projects'>) => createProject(data),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });
      const previous = queryClient.getQueryData<Project[]>(projectKeys.all);

      queryClient.setQueryData<Project[]>(projectKeys.all, (old) => {
        const optimistic: Project = {
          id: crypto.randomUUID(),
          name: newProject.name,
          monthly_revenue: newProject.monthly_revenue ?? null,
          start_month: newProject.start_month,
          end_month: newProject.end_month ?? null,
          status: newProject.status ?? '提案',
          description: newProject.description ?? null,
          note: newProject.note ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [optimistic, ...(old ?? [])];
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(projectKeys.all, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<'projects'>;
    }) => updateProject(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      const previousList = queryClient.getQueryData<Project[]>(
        projectKeys.all
      );
      const previousDetail = queryClient.getQueryData<Project>(
        projectKeys.detail(id)
      );

      queryClient.setQueryData<Project[]>(projectKeys.all, (old) =>
        old?.map((p) =>
          p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
        )
      );

      queryClient.setQueryData<Project>(projectKeys.detail(id), (old) =>
        old ? { ...old, ...data, updated_at: new Date().toISOString() } : old
      );

      return { previousList, previousDetail };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.previousList) {
        queryClient.setQueryData(projectKeys.all, ctx.previousList);
      }
      if (ctx?.previousDetail) {
        queryClient.setQueryData(projectKeys.detail(id), ctx.previousDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });
      const previous = queryClient.getQueryData<Project[]>(projectKeys.all);

      queryClient.setQueryData<Project[]>(projectKeys.all, (old) =>
        old?.filter((p) => p.id !== id)
      );

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(projectKeys.all, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
